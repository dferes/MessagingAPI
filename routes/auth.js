const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { SECRET_KEY } = require('../config');

const router = new express.Router();


router.post('/login', async (req, res, next) => {
    try {
        let { username, password } = req.body;
        let user = await User.get(username);
        
        if (!user.first_name) return res.status(409).json({ error: `No such username: ${username}`});

        let currentUser = new User(username, password, user.firstName, user.lastName, user.phone);
        
        if (await User.authenticate(username, password)) {
            let token = jwt.sign({username}, SECRET_KEY);
            await currentUser.updateLoginTimestamp();
            return res.json({ token: token });
        }
        return res.status(409).json({ error: 'Invalid password' });
    }catch(e) {
        return next(e);
    }

})


router.post("/register", async (req, res, next) => {
    try {
        let {username, password, firstName, lastName, phone} = req.body;
        const user = await User.get(username);
        if(!user.message) {
            return res.status(409).json({ error: `User account with username ${username} already exists` });
        }
        const newUser = new User(username, password, firstName, lastName, phone);
        await newUser.register();

        let token = jwt.sign({username}, SECRET_KEY);
        await newUser.updateLoginTimestamp();

        return res.status(201).json({ token: token });
        
      // 409 represents a request that could not be completed due to a conflict 
      // with the current state of the resource

    } catch (err) {
        return next(err);
    }
});

 module.exports = router;