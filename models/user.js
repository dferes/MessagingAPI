const bcrypt = require("bcrypt");
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
        RETURNING username, password, first_name AS "firstName", last_name AS "lastName", phone`,
        [this.username, this.password, this.firstName, this.lastName, this.phone]);

      return results.rows[0];
    } catch (e) {
      if (e.code === '23505') {
        return (new ExpressError("Username taken. Please pick another!", 400));
      }
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
  async updateLoginTimestamp() {
    const newLoginTime = await db.query(
      `UPDATE users 
      SET last_login_at = current_timestamp
      WHERE username=$1
      RETURNING last_login_at`,
      [this.username])
    return newLoginTime.rows[0];
  }


  /* All: basic info on all users: [{username, first_name, last_name, phone}, ...] */
  static async all() { 
    const allUsers = await db.query(
      `SELECT username, first_name, last_name, phone
      FROM users
      ORDER BY join_at ASC`
    );
    if (allUsers.rows.length === 0) {
      return new ExpressError('No users found', 404)
    }
    return allUsers.rows;
  }


  /* Get: get user by username */
  static async get(username) { 
    const user = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at 
      FROM users
      WHERE username=$1`,
      [username]);
    if (user.rows.length === 0) {
      return new ExpressError('User not found', 404)
    }
    return user.rows[0];
  }


  /* Return  messages from this user. [{id, to_user, body, sent_at, read_at}] */
  static async messagesFrom() { 
    const allMessagesFromUser = await db.query(
      `SELECT id, to_username, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1
      ORDER BY id ASC`,
      [this.username]);

    return allMessagesFromUser.rows;
  }


  /* Return messages to this user [{id, from_user, body, sent_at, read_at}] */
  static async messagesTo(username) { 
    const allMessagesToUser = await db.query(
      `SELECT id, from_username, body, sent_at, read_at
      FROM messages
      WHERE to_username = $1
      ORDER BY id ASC`,
      [username]);

      return allMessagesToUser.rows;
  }
}


module.exports = User;