import Router from 'express-promise-router';
const router = Router();

import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient();

import validateTransaction from '../validation/transaction.js';

router.post('/', async (req, res, next) => {
    const validatedData = {
        source_account_id: Number(req.body.source_account_id),
        destination_account_id: Number(req.body.destination_account_id),
        amount: Number(req.body.amount)
    };
    
    const response = validateTransaction(validatedData);

    if(response.error){
        return res.status(400).send(response.error.details);
    }
    
    try {
        let getSourceAccInfo = await prisma.bank_Account.findUnique({
            where: {
                id: validatedData.source_account_id,
            }
        })

        let getDestAccInfo = await prisma.bank_Account.findUnique({
            where: {
                id: validatedData.destination_account_id
            }
        })

        if(!getSourceAccInfo || !getDestAccInfo){
            return res.status(409).json({
                status: 'failed',
                message: `Invalid account id`
            })
        } else if(validatedData.source_account_id === validatedData.destination_account_id){
            return res.status(409).json({
                status: 'failed',
                message: `Cannot do transaction between same account`
            })
        } else if(validatedData.amount > getSourceAccInfo.balance){
            return res.status(409).json({
                status: 'failed',
                message: `Insufficient balance`
            })
        }

        let transaction = await prisma.transaction.create({
            data: {
                source_account_id: validatedData.source_account_id,
                destination_account_id: validatedData.destination_account_id,
                amount: validatedData.amount
            }
        })

        let updateSourceAccBalance = await prisma.bank_Account.update({
            where: {
                id: validatedData.source_account_id
            }, 
            data: {
                balance: Number(getSourceAccInfo.balance) - Number(validatedData.amount)
            }
        })

        let updateDestAccBalance = await prisma.bank_Account.update({
            where: {
                id: validatedData.destination_account_id
            }, 
            data: {
                balance: Number(getDestAccInfo.balance) + Number(validatedData.amount)
            }
        })

        return res.status(201).json({
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