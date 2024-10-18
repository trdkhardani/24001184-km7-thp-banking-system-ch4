import Router from 'express-promise-router';
const router = Router();

import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient();

import validateAccount from '../validation/account.js';

router.post('/', async (req, res, next) => {
    const validatedData = {
        user_id: Number(req.body.user_id),
        bank_name: req.body.bank_name,
        bank_account_number: req.body.bank_account_number,
    };

    const response = validateAccount(validatedData)

    const balance = Number(req.body.balance);

    if(response.error){
        return res.status(400).send(response.error.details)
    } else if(isNaN(balance) || balance < 0){
        return res.status(400).json({
            status: 'failed',
            message: 'Balance must be a positive number'
        })
    }

    let getUserId = await prisma.user.findUnique({
        where: {
            id: validatedData.user_id
        }
    })

    let existingAccNumber = await prisma.bank_Account.findUnique({
        where: {
            bank_account_number: validatedData.bank_account_number
        }
    })

    if(!getUserId){
        return res.status(409).json({
            status: 'failed',
            message: `No user with user_id ${req.body.user_id}`
        })
    } else if(existingAccNumber){
        return res.status(409).json({
            status: 'failed',
            message: `Bank account number ${validatedData.bank_account_number} has already taken`
        })
    }

    try {
        let account = await prisma.bank_Account.create({
            data: {
                user_id: validatedData.user_id,
                bank_name: validatedData.bank_name,
                bank_account_number: validatedData.bank_account_number,
                balance: balance
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