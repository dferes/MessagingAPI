const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


let testUser;
let testUser2;
let userToken;
let userToken2;

beforeEach(async () => {
  testUser = new User(
    "test1",
    "password",
    "Test1",
    "Testy1",
    "+14155550000",
  );

  testUser2 = new User(
    "Timmy23",
    "password2",
    "Tim",
    "McTesty",
    "+14155559999",
  );

  await request(app).post("/auth/register").send( testUser );
  await request(app).post("/auth/register").send( testUser2 );

  userToken = jwt.sign({ user: testUser }, SECRET_KEY);
  userToken2 = jwt.sign({ user: testUser2 }, SECRET_KEY);
});

afterEach( async () => {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
})

describe("GET /users/", () => {
  test("Can retrieve a list of all users when a user is logged in", async () => {
    let allUsersResponse = await request(app)
      .get('/users/')
      .send({ token: userToken });

    expect(allUsersResponse.status).toEqual(200);
    expect(allUsersResponse.body.users.length).toEqual(2);
    expect(allUsersResponse.body.users[0]).toEqual({
      username: 'test1',
      first_name: 'Test1',
      last_name: 'Testy1',
      phone: '+14155550000'      
    });
    expect(allUsersResponse.body.users[1]).toEqual({
      username: 'Timmy23',
      first_name: 'Tim',
      last_name: 'McTesty',
      phone: '+14155559999'
    });
  });
  test("Failes to retrieve a list of all users and returns a 401 error message when a JSON Web Token is not sent", async () => {
    let allUsersResponse = await request(app)
      .get('/users/')
      .send({ token: null });

    expect(allUsersResponse.body.error.status).toEqual(401);
    expect(allUsersResponse.body.error.message).toEqual('Unauthenticated');

  });
  test("Failes to retrieve list of users and returns 401 error message when JSON Web Token is invalid", async () => {
    let allUsersResponse = await request(app)
      .get('/users/')
      .send({ token: `${userToken}0` });

    expect(allUsersResponse.body.error.status).toEqual(401);
    expect(allUsersResponse.body.message).toEqual('invalid signature');
  });
  test("Failes to retrieve list of users and returns 401 error message when JSON Web Token is malformed", async () => {
    let allUsersResponse = await request(app)
      .get('/users/')
      .send({ token: 'blarghhh' });

    expect(allUsersResponse.body.error.status).toEqual(401);
    expect(allUsersResponse.body.message).toEqual('jwt malformed');
  });
});

describe("GET /users/:username", () => {
  test("Can retrieve a single user when a valid registered username is passed", async () => {
    let user = await request(app)
      .get(`/users/${testUser.username}`)
      .send({ token: userToken });

    expect(user.status).toEqual(200);
    expect(user.body.user.username).toEqual(testUser.username);
    expect(user.body.user.first_name).toEqual(testUser.firstName);
    expect(user.body.user.last_name).toEqual(testUser.lastName);
    expect(user.body.user.phone).toEqual(testUser.phone);
    expect(user.body.user.username).toEqual(testUser.username);
  });
  test("Failes to retrieve specified user and returns a 401 error message when a JSON Web Token is not sent", async () => {
    let allUsersResponse = await request(app)
      .get(`/users/${testUser.username}`)
      .send({ token: null });

    expect(allUsersResponse.body.error.status).toEqual(401);
    expect(allUsersResponse.body.error.message).toEqual('Unauthenticated');

  });
  test("Failes to retrieve specified user and returns 401 error message when JSON Web Token is invalid", async () => {
    let allUsersResponse = await request(app)
      .get(`/users/${testUser.username}`)
      .send({ token: `${userToken}0` });

    expect(allUsersResponse.body.error.status).toEqual(401);
    expect(allUsersResponse.body.message).toEqual('invalid signature');
  });
  test("Failes to retrieve specified user and returns 401 error message when JSON Web Token is malformed", async () => {
    let allUsersResponse = await request(app)
      .get(`/users/${testUser.username}`)
      .send({ token: 'blarghhh' });

    expect(allUsersResponse.body.error.status).toEqual(401);
    expect(allUsersResponse.body.message).toEqual('jwt malformed');
  });
});
  
describe('GET /users/:username/to', () => {
  beforeEach( async () => {
    message1 = await Message.create(
      testUser2.username,
      testUser.username,
      "Hello, user 1"
    );
    message2 = await Message.create(
      testUser2.username,
      testUser.username,
      "Hello again, user 1"
    );
  });

  test('Retrieves a list of all messages sent TO this user when a registered username is passed as a parameter', async ()=> {
    let allMessagesTo = await request(app)
      .get(`/users/${testUser.username}/to`)
      .send({ token: userToken });
    expect(allMessagesTo.body.messages.length).toEqual(2);
    expect(allMessagesTo.body.messages[0].id).toEqual(expect.any(Number));
    expect(allMessagesTo.body.messages[0].from_username).toEqual(testUser2.username);
    expect(allMessagesTo.body.messages[0].body).toEqual(message1.body);
    
    expect(allMessagesTo.body.messages[1].id).toEqual(expect.any(Number));
    expect(allMessagesTo.body.messages[1].from_username).toEqual(testUser2.username);
    expect(allMessagesTo.body.messages[1].body).toEqual(message2.body);
  });
  test('Fails to retrieve a list of all messages and returns a 401 error message when a JSON Web Token is not sent', async ()=> {
    let allMessagesTo = await request(app)
      .get(`/users/${testUser.username}/to`)
      .send({ token: null });
    
    expect(allMessagesTo.status).toEqual(401);
    expect(allMessagesTo.body.message).toEqual('Unauthenticated');;
  });
  test('Fails to retrieve list of messages and returns a 401 error message when a JSON Web Token is invalid', async ()=> {
    let allMessagesTo = await request(app)
      .get(`/users/${testUser.username}/to`)
      .send({ token: `${userToken}0` });
    
    expect(allMessagesTo.status).toEqual(401);
    expect(allMessagesTo.body.message).toEqual('invalid signature');
  });
  test('Fails to retrieve list of messages and returns a 401 error message when a JSON Web Token is malformed', async ()=> {
    let allMessagesTo = await request(app)
      .get(`/users/${testUser.username}/to`)
      .send({ token: 'blahBlah121' });
    
    expect(allMessagesTo.status).toEqual(401);
    expect(allMessagesTo.body.message).toEqual('jwt malformed');
  });
  test('Fails to retrieve list of messages and returns a 401 error message when a JSON Web Token is for another user', async ()=> {
    let allMessagesTo = await request(app)
      .get(`/users/${testUser.username}/to`)
      .send({ token: userToken2 });

    expect(allMessagesTo.status).toEqual(401);
    expect(allMessagesTo.body.message).toEqual('Unauthorized');
  });
});

describe('GET /users/:username/to', () => {
  beforeEach( async () => {
    message1 = await Message.create(
      testUser.username,
      testUser2.username,
      "Hello, user 2"
    );
    message2 = await Message.create(
      testUser.username,
      testUser2.username,
      "Hello again, user 2"
    );
  });
  
  test('Retrieves a list of all messages sent FROM this user when a registered username is passed as a parameter', async ()=> {
    let allMessagesFrom = await request(app)
      .get(`/users/${testUser.username}/from`)
      .send({ token: userToken });

    expect(allMessagesFrom.body.messages.length).toEqual(2);
    expect(allMessagesFrom.body.messages[0].id).toEqual(expect.any(Number));
    expect(allMessagesFrom.body.messages[0].to_username).toEqual(testUser2.username);
    expect(allMessagesFrom.body.messages[0].body).toEqual(message1.body);
      
    expect(allMessagesFrom.body.messages[1].id).toEqual(expect.any(Number));
    expect(allMessagesFrom.body.messages[1].to_username).toEqual(testUser2.username);
    expect(allMessagesFrom.body.messages[1].body).toEqual(message2.body);
  });
  test('Fails to retrieve a list of all messages and returns a 401 error message when a JSON Web Token is not sent', async ()=> {
    let allMessagesFrom = await request(app)
      .get(`/users/${testUser.username}/from`)
      .send({ token: null });
   
    expect(allMessagesFrom.status).toEqual(401);
    expect(allMessagesFrom.body.message).toEqual('Unauthenticated');;
  });
  test('Fails to retrieve list of messages and returns a 401 error message when a JSON Web Token is invalid', async ()=> {
    let allMessagesFrom = await request(app)
      .get(`/users/${testUser.username}/from`)
      .send({ token: `${userToken}0` });
    
    expect(allMessagesFrom.status).toEqual(401);
    expect(allMessagesFrom.body.message).toEqual('invalid signature');
  });
  test('Fails to retrieve list of messages and returns a 401 error message when a JSON Web Token is malformed', async ()=> {
    let allMessagesFrom = await request(app)
      .get(`/users/${testUser.username}/from`)
      .send({ token: 'blahBlah121' });
      
    expect(allMessagesFrom.status).toEqual(401);
    expect(allMessagesFrom.body.message).toEqual('jwt malformed');
  });
  test('Fails to retrieve list of messages and returns a 401 error message when a JSON Web Token is for another user', async ()=> {
    let allMessagesFrom = await request(app)
      .get(`/users/${testUser.username}/from`)
      .send({ token: userToken2 });
  
    expect(allMessagesFrom.status).toEqual(401);
    expect(allMessagesFrom.body.message).toEqual('Unauthorized');
  });
});

afterAll(async () => {
    await db.end();
});
  