const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

let testUser;
let testUser2;
let message;
let message2;

beforeEach(async () => {
  testUser = new User(
    "test1",
    "password",
    "Test1",
    "Testy1",
    "+14155550000",
  );
  testUser2 = new User(
    "test2",
    "password",
    "Test2",
    "Testy2",
    "+14155552222",
  );

  await testUser.register();
  await testUser2.register();

  message1 = await Message.create(
    "test1",
    "test2",
    "u1-to-u2"
  );
  message2 = await Message.create(
    "test2",
    "test1",
    "u2-to-u1"
  );
});


afterEach( async () => {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
  await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");
})


describe("Test the create() method of the Message class", () => {
  test("can create a new message when valid usernames and message body are passed to it", async () => {
    let newMessage = await Message.create(
      testUser.username,
      testUser2.username,
      "new message to user2"
    );

    expect(newMessage).toEqual({
      id: expect.any(Number),
      from_username: "test1",
      to_username: "test2",
      body: "new message to user2",
      sent_at: expect.any(Date),
    });
  });
  test("Returns a 404 error message when unregistered from_user variable is passed to create()", async () => {
    let errorMessage = await Message.create(
      "notAUser",
      testUser2.username,
      "new message to user2"
    );
    expect(errorMessage.status).toEqual(404);
    expect(errorMessage.message).toEqual('User notAUser not found');
  });
  test("Returns a 404 error message when unregistered to_user variable is passed to create()", async () => {
    let errorMessage = await Message.create(
      testUser.username,
      'invalidUser',
      "new message to user2"
    );
    expect(errorMessage.status).toEqual(404);
    expect(errorMessage.message).toEqual('User invalidUser not found');
  });
  test("Returns a 404 error message when the message body is null", async () => {
    let errorMessage = await Message.create(
      testUser.username,
      testUser.username,
      null
    );
    expect(errorMessage.status).toEqual(404);
    expect(errorMessage.message).toEqual('Message must contain a body');
  });
});

describe("Test the markRead() method of the Message class", () => {
  test("markRead() sets the time a message is read when it hasn't been read yet", async () => {
    expect(message1.read_at).toBe(undefined);

    await Message.markRead(message1.id);
    const result = await db.query("SELECT read_at from messages where id=$1",
        [message1.id]);
    expect(result.rows[0].read_at).toEqual(expect.any(Date));
  });
  test("Returns a 400 error when a non integer parameter is passed to it", async () => {
    let errorMessage = await Message.markRead('abc');
    expect(errorMessage.status).toEqual(400);
    expect(errorMessage.message).toEqual('id must be an integer');
  });
  test("Returns a 404 error when an invalid id parameter is passed to it", async () => {
    let errorMessage = await Message.markRead(0);
    expect(errorMessage.status).toEqual(404);
    expect(errorMessage.message).toEqual('No such message: 0');
  });
});

describe("Test the get() method of the Message class", () => {
  test("Retrieves a message when the get() method is called using a valid id parameter", async () => {
    const message = await Message.get(message1.id);
    expect(message).toEqual({
      id: expect.any(Number),
      from_user: {
        username: 'test1',
        first_name: 'Test1',
        last_name: 'Testy1',
        phone: '+14155550000'
      },
      to_user: {
        username: 'test2',
        first_name: 'Test2',
        last_name: 'Testy2',
        phone: '+14155552222'
      },
      body: 'u1-to-u2',
      sent_at: expect.any(Date),
      read_at: null
    });
  });
  test("Returns a 400 error when a non integer parameter is passed to it", async () => {
    let errorMessage = await Message.get('abc');
    expect(errorMessage.status).toEqual(400);
    expect(errorMessage.message).toEqual('id must be an integer');
  });
  test("Returns a 404 error when an invalid id parameter is passed to it", async () => {
    let errorMessage = await Message.get(0);
    expect(errorMessage.status).toEqual(404);
    expect(errorMessage.message).toEqual('No such message: 0');
  });
});


afterAll(async function() {
  await db.end();
});
