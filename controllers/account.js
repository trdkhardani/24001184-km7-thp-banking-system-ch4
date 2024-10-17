import Router from 'express-promise-router';
const router = Router();

import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient();

router.post('/', async (req, res, next) => {
    const userId = Number(req.body.user_id)
    try {
        let getUserId = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if(!getUserId){
            return res.status(409).json({
                status: 'failed',
                message: `No user with user_id ${req.body.user_id}`
            })
        }

        let account = await prisma.bank_Account.create({
            data: {
                user_id: userId,
                bank_name: req.body.bank_name,
                bank_account_number: req.body.bank_account_number,
                balance: req.body.balance
            }
        })
        
        return res.status(201).json({
            status: 'success',
            message: `successfully added account for user_id ${account.user_id}`
        })
    } catch(err) {
        next(err);
    }
})

router.get('/', async (req, res, next) => {
    try {
        let accounts = await prisma.bank_Account.findMany({
            orderBy: {
                id: 'asc'
            }
        })

        return res.json({
            status: 'success',
            accounts_data: accounts,
        })
    } catch(err) {
        next(err);
    }
})

router.get('/:accountId', async (req, res, next) => {
    const accId = Number(req.params.accountId)
    try {
        let account = await prisma.bank_Account.findUnique({
            where: {
                id: accId
            },
            include: {user: true}
        })

        if(!account){
            return res.status(404).json({
                status: 'failed',
                message: `Account with id ${accId} not found`
            })
        }

        return res.json({
            status: 'success',
            account_data: account
        })
    } catch(err) {
        next(err);
    }
})

export default router;