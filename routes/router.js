import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

import Joi from "joi";

import bcrypt from 'bcrypt';

import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'it works!'
    });
})

router.post('/api/v1/users', async (req, res, next) => {
    // const {name, email, password} = req.body
    try{
        let user = await prisma.user.create({
            data: {
                name: req.body.name,
                email: req.body.email,
                password: req.body.password
            }
        })
    
        let profile = await prisma.profile.create({
            data: {
                user_id: user.id,
                identity_type: req.body.identity_type,
                identity_number: req.body.identity_number,
                address: req.body.address
            }
        });
    
        return res.status(201).json({
            status: 'success',
            message: `Successfully added ${user.name}'s data`,
            profile: profile,
        })
    } catch(err){
        next(err)
    }
})

router.get('/api/v1/users', async (req, res) => {
    let users = await prisma.user.findMany({
        orderBy: {
            id: 'asc'
        }
    })

    return res.json({
        status: 'success',
        users_data: users,
    })
})

router.get('/api/v1/users/:userId', async (req, res, next) => {
    const userId = Number(req.params.userId)
    
    try {
        let user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            include: {profile: true}
        })
    
        if(!user){
            return res.status(404).json({
                status: 'failed',
                message: `User with id ${userId} not found`
            })
        }

        return res.json({
            status: 'success',
            user_data: user,
            // profile_data: profile,
        })
    } catch(err) {
        next(err)
    }

})

export default router;