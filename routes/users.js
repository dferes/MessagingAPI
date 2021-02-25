const express = require('express');
const User = require('../models/user');
const Message = require('../models/message');
const ExpressError = require('../expressError');

const router = new express.Router();


/* GET / - get list of users.
 * returns {users: [{username, first_name, last_name, phone}, ...]} */
router.get('/', async () => {
    try{

    }catch(e) {
        return next(e);
    }
});


/* GET /:username - get detail of users.
 * returns {user: {username, first_name, last_name, phone, join_at, last_login_at}} */
router.get('/:username', async () => {
    try{

    }catch(e) {
        return next(e);
    }
});


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', async () => {
    try{

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
router.get('/:username/from', async () => {
    try{

    }catch(e) {
        return next(e);
    }
});

module.exports = router;