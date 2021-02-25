const db = require("../db");
const ExpressError = require("../expressError");


class Message {

  /* register new message -- returns {id, from_username, to_username, body, sent_at} */
  static async create(from_username, to_username, body) {
    if (!body) {
      return new ExpressError('Message must contain a body', 404);
    }
    const fromUser = await db.query(
      `SELECT * FROM users WHERE username = $1`, [from_username]);
    const toUser = await db.query(
      `SELECT * FROM users WHERE username = $1`, [to_username]);
    
    if( toUser.rows.length === 0) {
      return new ExpressError(`User ${to_username} not found`, 404);
    }
    if( fromUser.rows.length === 0) {
      return new ExpressError(`User ${from_username} not found`, 404);
    }

    const result = await db.query(
        `INSERT INTO messages (from_username, to_username, body, sent_at)
        VALUES ($1, $2, $3, current_timestamp)
        RETURNING id, from_username, to_username, body, sent_at`,
        [from_username, to_username, body]);

    return result.rows[0];
  }

  /* Update read_at for message */
  static async markRead(id) {
    if(isNaN(id)) return new ExpressError('id must be an integer', 400);

    const result = await db.query(
        `UPDATE messages
        SET read_at = current_timestamp
        WHERE id = $1
        RETURNING id, read_at`,
        [id]);

    if (!result.rows[0]) {
      return new ExpressError(`No such message: ${id}`, 404);
    }

    return result.rows[0];
  }

  /* Get: get message by id returns {id, from_user, to_user, body, sent_at, read_at} */
  static async get(id) {
    if(isNaN(id)) return new ExpressError('id must be an integer', 400);

    const result = await db.query(
        `SELECT m.id,
                m.from_username,
                f.first_name AS from_first_name,
                f.last_name AS from_last_name,
                f.phone AS from_phone,
                m.to_username,
                t.first_name AS to_first_name,
                t.last_name AS to_last_name,
                t.phone AS to_phone,
                m.body,
                m.sent_at,
                m.read_at
          FROM messages AS m
            JOIN users AS f ON m.from_username = f.username
            JOIN users AS t ON m.to_username = t.username
          WHERE m.id = $1`,
        [id]);

    let message = result.rows[0];

    if (!message) return new ExpressError(`No such message: ${id}`, 404);

    return {
      id: message.id,
      from_user: {
        username: message.from_username,
        first_name: message.from_first_name,
        last_name: message.from_last_name,
        phone: message.from_phone,
      },
      to_user: {
        username: message.to_username,
        first_name: message.to_first_name,
        last_name: message.to_last_name,
        phone: message.to_phone,
      },
      body: message.body,
      sent_at: message.sent_at,
      read_at: message.read_at,
    };
  }
}


module.exports = Message;