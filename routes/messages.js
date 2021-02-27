const express = require('express');
const User = require('../models/user');
const Message = require('../models/message');
const ExpressError = require('../expressError');
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');

const router = new express.Router();


/* GET /:id - get detail of message.
 *
 * => {message: {id, body, sent_at, read_at,
 *       from_user: {username, first_name, last_name, phone},
 *       to_user: {username, first_name, last_name, phone}}
 */
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
  if (! req.params.id) return res.status(400).json({ error: 'id paramater must be provided' });
  try {  
    const message = await Message.get(req.params.id);
    if (message.message) return res.status(message.status).json({ error: message.message });

    if ( ![message.from_user.username, message.to_user.username].includes(req.user.user.username) ) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(200).json({ message: message });
  } catch(e) {
     return next(e); 
  }
});


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}} */
router.post('/', ensureLoggedIn, async (req, res, next) => {   
  try {
    let message = req.body.message;  
    const newMessage = await Message.create(req.user.user.username, message.toUsername, message.body);

    if(newMessage.message) {
      return res.status(newMessage.status).json({ error: newMessage.message });
    }
    
    return res.status(201).json({ message: newMessage });
  } catch(e) {
      return next(e);
  }  
});


/* POST/:id/read - mark message as read:
 *  => {message: {id, read_at}} */
router.post('/:id/read', [ensureLoggedIn, ensureCorrectUser], async (req, res, next) => {
  try {
    
  }catch(e) {
    return next(e);  
  }  
})

module.exports = router;