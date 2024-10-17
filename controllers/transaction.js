import Router from 'express-promise-router';
const router = Router();

import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient();

router.post('/', async (req, res, next) => {
    const sourceAccId = Number(req.body.source_account_id);
    const destAccId = Number(req.body.destination_account_id);
    const amount = Number(req.body.amount);
    try {
        let getSourceAccInfo = await prisma.bank_Account.findUnique({
            where: {
                id: sourceAccId,
            }
        })

        let getDestAccInfo = await prisma.bank_Account.findUnique({
            where: {
                id: destAccId
            }
        })

        if(!getSourceAccInfo || !getDestAccInfo){
            return res.status(409).json({
                status: 'failed',
                message: `invalid account id`
            })
        } else if(sourceAccId === destAccId){
            return res.status(409).json({
                status: 'failed',
                message: `cannot do transaction between same account`
            })
        } else if(amount > getSourceAccInfo.balance){
            return res.status(409).json({
                status: 'failed',
                message: `insufficient balance`
            })
        }

        let transaction = await prisma.transaction.create({
            data: {
                source_account_id: sourceAccId,
                destination_account_id: destAccId,
                amount: amount
            }
        })

        let updateSourceAccBalance = await prisma.bank_Account.update({
            where: {
                id: sourceAccId
            }, 
            data: {
                balance: getSourceAccInfo.balance - amount
            }
        })

        let updateDestAccBalance = await prisma.bank_Account.update({
            where: {
                id: destAccId
            }, 
            data: {
                balance: Number(getDestAccInfo.balance) + Number(amount)
            }
        })

        res.json({ // for debugging, will delete later
            status: 'success',
            transaction: transaction,
            source_account: updateSourceAccBalance,
            destination_account: updateDestAccBalance
        }) 
    } catch(err) {
        next(err)
    }
})

router.get('/', async (req, res, next) => {
    try{
        let transactions = await prisma.transaction.findMany({
            orderBy: {
                id: 'asc'
            }
        })

        return res.json({
            status: 'success',
            transactions_data: transactions
        });
    } catch(err) {
        next(err)
    }
})

router.get('/:transaction', async (req, res, next) => {
    const transactionId = Number(req.params.transaction)
    try{
        let transaction = await prisma.transaction.findUnique({
            where: {
                id: transactionId,
            }, 
            include: {
                sourceAccount: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                destinationAccount: {
                    include: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        if(!transaction){
            return res.status(404).json({
                status: 'failed',
                message: `Transaction with id ${transactionId} not found`
            })
        }

        return res.json({
            status: 'success',
            transaction: transaction
        })
    } catch(err) {
        next(err)
    }
})

export default router;