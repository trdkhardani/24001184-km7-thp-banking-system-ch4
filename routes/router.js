import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()
import bcrypt from 'bcrypt';
import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'it works!'
    });
})

router.post('/api/v1/users', async (req, res) => {
    // const {name, email, password} = req.body

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

    return res.json({
        status: 'success',
        message: `Successfully added ${user.name}'s data`,
        profile: profile,
    })

    // const saltRounds = 10;
    // bcrypt.genSalt(saltRounds, (err, salt) => {
    //     if (err) {
    //         // Handle error
    //         return;
    //     }
        
    //     // Salt generation successful, proceed to hash the password
    // });

    // bcrypt.hash(password, salt, (err, hash) => {
    //         if (err) {
    //             // Handle error
    //             return;
    //         }
    // });
})

export default router;