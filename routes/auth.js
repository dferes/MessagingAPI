const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const ExpressError = require('../expressError');
const { SECRET_KEY } = require('../config');

const router = new express.Router();

/* POST /login - login: {username, password} => {token}
   Make sure to update their last-login! */
router.post('/login', async (req, res, next) => {
    try {
        let { username, password } = req.body;
        let user = await User.get(username);
        
        if (!user.firstName) throw new ExpressError(user.message, 404);

        let currentUser = new User(username, password, user.firstName, user.lastName, user.phone);
        
        if (await User.authenticate(username, password)) {
            let token = jwt.sign({username}, SECRET_KEY);
            currentUser.updateLoginTimestamp();
            return res.json({token});
        }
    }catch(e) {
        return next(e);
    }

})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next) => {
    try {
      let {username, password, first_name, last_name, phone} = req.body;
      const user = await User.get(username);
      // 409 represents a request that could not be completed due to a conflict 
      // with the current state of the resource"
      if(user.rows) throw new ExpressError(`User account with username ${username} already exists`, 409); 
      const newUser = new User(username, password, first_name, last_name, phone);
      await newUser.register();
      let token = jwt.sign({username}, SECRET_KEY);
      newUser.updateLoginTimestamp();
      return res.sataut(201).json({token});
    }
  
    catch (err) {
      return next(err);
    }
  });

 module.exports = router;