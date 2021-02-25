const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Message = require('./models/message');
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config');

const router = new express.Router();

/* POST /login - login: {username, password} => {token}
   Make sure to update their last-login! */
router.post('/login', async (req, res, next) => {
    try {
        let { username, password } = req.body;
        let user = await User.get(username);
        if (user.error) {
            continue; // come back to this...
        }
        if (await User.authenticate(username, password)) {
            let token = jwt.sign({username}, SECRET_KEY);
            User.updateLoginTimestamp(username);
            return res.json({token});
        }
    }catch(e) {

    }

})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

 module.exports = router;