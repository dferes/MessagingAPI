const express = require('express');
const User = require('../models/user');
const Message = require('../models/message');
const ExpressError = require('../expressError');
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

const router = new express.Router();


/* GET / - get list of users.
 * returns {users: [{username, first_name, last_name, phone}, ...]} */
router.get('/', ensureLoggedIn, async (req, res, next) => {
  try{
    let allUsers = await User.all();
    return res.status(200).json({ users: allUsers });
  }catch(e) {
    return next(e);
  }
});


/* GET /:username - get detail of users.
 * returns {user: {username, first_name, last_name, phone, join_at, last_login_at}} */
router.get('/:username', ensureLoggedIn, async (req, res, next) => {
  try{
    let user = await User.get(req.user.user.username);
    return res.status(200).json({ user: user });
  }catch(e) {
    return next(e);
  }
});


/* GET /:username/to - get messages to user
 * => {messages: [{id, body, sent_at, read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 */
router.get('/:username/to', [ensureLoggedIn, ensureCorrectUser], async (req, res, next) => {
  try{
    let allMessagesTo = await User.messagesTo(req.user.user.username);

    if (allMessagesTo.length === 0) {
        return res.status(200).json({ message: "No messages found" });
    }
    return res.status(200).json({ messages: allMessagesTo });
  }catch(e) {
    return next(e);
  }
});


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', async (req, res, next) => {
    try{

    }catch(e) {
        return next(e);
    }
});

module.exports = router;