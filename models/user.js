const bcrypt = require("bcrypt");
const moment = require("moment");
const ExpressError = require("../expressError")
const db = require('../db');
const { BCRYPT_WORK_FACTOR } = require('../config');


class User {

  constructor(username, password, firstName, lastName, phone) {
    this.username = username;
    this.password =  password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
  }
  /* register new user -- returns {username, password, first_name, last_name, phone} */
  async register() { 
    try {
      await this.setHashedPassword()
      const results = await db.query(`
        INSERT INTO users (username, password, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING username, password, first_name, last_name, phone`,
        [this.username, this.password, this.firstName, this.lastName, this.phone]);

      return results.rows[0];
    } catch (e) {
      if (e.code === '23505') {
        return (new ExpressError("Username taken. Please pick another!", 400));
      }
        console.log('This is e: -------------->', e);
        return  new ExpressError(e, 500);
    }
  }

  async setHashedPassword() {
    this.password = await bcrypt.hash(this.password, BCRYPT_WORK_FACTOR);
  }

  /* Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) { 
    const results = await db.query(
      `SELECT username, password 
       FROM users
       WHERE username = $1`,
      [username]);
      
      const user = results.rows[0];
      return user ? await bcrypt.compare(password, user.password) : false;
  }

  /* Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    // should I make this be an instance method?? 
    await db.query(
      `UPDATE users 
      SET last_login_at=$1
      WHERE username=$2`,
      [moment().format('LLLL'), username])
  }

  /* All: basic info on all users: [{username, first_name, last_name, phone}, ...] */
  static async all() { 
    const allUsers = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users`
    );
    return allUsers;
    // TODO
    // May need to modify the format of this, test it out to see what it looks like now
  }



  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const user = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users
      WHERE username=$1`,
      [username]);
    
    return {
      username:   user.rows[0].username,
      firstName:  user.rows[0].first_name,
      lastName:   user.rows[0].last_name,
      phone:      user.rows[0].phone,
      joinAt:     user.rows[0].join_at,
      lastLogIn:  user.rows[0].last_login_at
    }
  }


  /** Return  messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is  (WTF is this asking??)
   *   {username, first_name, last_name, phone}
   */

  async messagesFrom() { 
    const allMessagesFromUser = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1`,
      [this.username]);
    return allMessagesFromUser.rows.map(message => {
      message = { 
          id:     message.id,
          toUser: message.to_user,
          body:   message.body,
          sentAt: message.sent_at,
          readTt: message.read_at
      }
    });
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;