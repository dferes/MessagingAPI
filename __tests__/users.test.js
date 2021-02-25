const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const { TestScheduler } = require("jest");

let testUser;
let testUser2;
let unHashedPassword = 'password';

beforeEach(async function () {
  testUser = new User(
    "testUser",
    unHashedPassword,
    "Jimmy",
    "McTest",
    "+14155550000",
  );
  testUser2 = new User(
    "testUser2",
    unHashedPassword,
    "Timmy",
    "Tester",
    "+14155559999",
  );
});


afterEach( async () => {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
}) 


afterAll(async function() {
  await db.end();
});

function delay(ms) {
  return new Promise( resolve => setTimeout(resolve, ms));
}

describe("Test registration() method of the User class", () => {
  test("can register a user when all db constraints are correct", async () => {
    registeredUser = await testUser.register();
    expect(registeredUser.username).toBe(testUser.username);
    expect(registeredUser.first_name).toBe(testUser.firstName);
    expect(registeredUser.last_name).toBe(testUser.lastName);
    expect(registeredUser.phone).toBe(testUser.phone);
    expect(registeredUser.password).not.toBe(undefined);
  });
  test("A username taken error is thrown when a user with the same username attempts to register", async function () {
    await testUser.register();
    failedRegistration = await testUser.register();
    expect(failedRegistration.message).toEqual('Username taken. Please pick another!')
  });

});

describe("Test authentication() method of the User class", () => {
  test("can authenticate a user when they have already registered and provide the CORRECT password", async () => {
    await testUser.register();
    let isValid = await User.authenticate(testUser.username, unHashedPassword);
    expect(isValid).toBeTruthy();
  });
  test("fail to authenticate a user when they have already registered and provide the WRONG password", async () => {
    await testUser.register();
    let isValid = await User.authenticate(testUser.username, 'SomeOtherPassword');
    expect(isValid).toBeFalsy();
  });
  test("fail to authenticate a user when they have NOT registered", async () => {
    await testUser.register();
    let isValid = await User.authenticate('someGuy', 'SomePassword');
    expect(isValid).toBeFalsy();
  });
});

describe("Test updateLoginTimestamp() method of the User class", () => {
  test("can update a users' last login time when they have NOT logged in before", async () => {
    await testUser.register();
    const user = await db.query(
      `SELECT * FROM users WHERE username = $1`, 
      [testUser.username]
    );
    expect(user.rows[0].last_login_at).toBe(null);
    let timeStampResponse = await testUser.updateLoginTimestamp();
    expect(timeStampResponse.last_login_at).not.toBe(null);
  });
  test("can update a users' last login time when they HAVE logged in before", async () => {
    await testUser.register();
    const user = await db.query(
      `SELECT * FROM users WHERE username = $1`, 
      [testUser.username]
    );
    expect(user.rows[0].last_login_at).toBe(null);
  
    let timeStampResponse = await testUser.updateLoginTimestamp();
    await delay(2000);
    let timeStampResponse2 = await testUser.updateLoginTimestamp();

    expect(timeStampResponse2.last_login_at).not.toBe(null);
    expect(timeStampResponse2.last_login_at).not.toEqual(timeStampResponse.last_login_at);
    
  });
});

describe("Test the all() method of the User class", () => {
  test("Retrieves a list of 2 users in the database when 2 users are registered", async () => {
    await testUser.register();
    await testUser2.register();
    let allUsers = await User.all();
    
    expect(allUsers[0]).toEqual(
      {
        username: 'testUser',
        first_name: 'Jimmy',
        last_name: 'McTest',
        phone: '+14155550000'
      }
    )
    expect(allUsers[1]).toEqual(
      {
        username: 'testUser2',
        first_name: 'Timmy',
        last_name: 'Tester',
        phone: '+14155559999'
      }
    )
  });
});

describe("Test the get() method of the User class", () => {
  test("Retrieves a single user in the database when they are registered", async () => {
    await testUser.register();
    let user = await User.get(testUser.username);
  
    expect(user).toEqual(
      {
        username: 'testUser',
        first_name: 'Jimmy',
        last_name: 'McTest',
        phone: '+14155550000',
        join_at: expect.any(Date),
        last_login_at: null
      }
    )
  });
  test("Returns a 404 error message when a non registered username is passed as a parameter", async () => {
    let errorMessage = await User.get('notAUser');
    expect(errorMessage.status).toEqual(404);
    expect(errorMessage.message).toEqual('User not found');
  });
});




describe("Test messages part of User class", () => {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155552222",
    });
    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2"
    });
    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1"
    });
  });
  test('can get messages from user', async () => {
    let m = await User.messagesFrom("test1");
    expect(m).toEqual([{
      id: expect.any(Number),
      body: "u1-to-u2",
      sent_at: expect.any(Date),
      read_at: null,
      to_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      }
    }]);
  });
   test('can get messages to user', async function () {
    let m = await User.messagesTo("test1");
    expect(m).toEqual([{
      id: expect.any(Number),
      body: "u2-to-u1",
      sent_at: expect.any(Date),
      read_at: null,
      from_user: {
        username: "test2",
        first_name: "Test2",
        last_name: "Testy2",
        phone: "+14155552222",
      }
    }]);
  });
});

