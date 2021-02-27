const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


let userToken;
let userToken2;

let testUser;
let testUser2;


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

afterEach( async () => {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
})


describe("GET /messages/:id", () => {
  beforeEach( async () => {
    testUser3 = new User(
      "Bobby96",
      "password3",
      "Bob",
      "McTesterworth",
      "+14133339999",
    );

    await request(app).post("/auth/register").send( testUser3 );
    userToken3 = jwt.sign({ user: testUser3 }, SECRET_KEY);
  });

  test(`Retrieves the specified message details when a valid id is passed as a parameter and the
    message RECIPIENT signed JWT is sent`, async () => {
    let message = await request(app)
      .get(`/messages/${message1.id}`)
      .send({ token: userToken }); // RECIPIENT user token

      expect(message.status).toEqual(200);
      expect(message.body.message.id).toEqual(expect.any(Number));
      expect(message.body.message.from_user.username).toEqual(testUser2.username);
      expect(message.body.message.from_user.first_name).toEqual(testUser2.firstName);
      expect(message.body.message.from_user.last_name).toEqual(testUser2.lastName);
      expect(message.body.message.from_user.phone).toEqual(testUser2.phone);

      expect(message.body.message.id).toEqual(expect.any(Number));
      expect(message.body.message.to_user.username).toEqual(testUser.username);
      expect(message.body.message.to_user.first_name).toEqual(testUser.firstName);
      expect(message.body.message.to_user.last_name).toEqual(testUser.lastName);
      expect(message.body.message.to_user.phone).toEqual(testUser.phone);

      expect(message.body.message.body).toEqual(message1.body);
      expect(message.body.message.read_at).toEqual(null);
    });
    test(`Retrieves the specified message details when a valid id is passed as a parameter and the
    message SENDER signed JWT is sent`, async () => {
    let message = await request(app)
      .get(`/messages/${message1.id}`)
      .send({ token: userToken2 }); // SENDER user token

      expect(message.status).toEqual(200);
      expect(message.body.message.id).toEqual(expect.any(Number));
      expect(message.body.message.from_user.username).toEqual(testUser2.username);
      expect(message.body.message.from_user.first_name).toEqual(testUser2.firstName);
      expect(message.body.message.from_user.last_name).toEqual(testUser2.lastName);
      expect(message.body.message.from_user.phone).toEqual(testUser2.phone);

      expect(message.body.message.id).toEqual(expect.any(Number));
      expect(message.body.message.to_user.username).toEqual(testUser.username);
      expect(message.body.message.to_user.first_name).toEqual(testUser.firstName);
      expect(message.body.message.to_user.last_name).toEqual(testUser.lastName);
      expect(message.body.message.to_user.phone).toEqual(testUser.phone);

      expect(message.body.message.body).toEqual(message1.body);
      expect(message.body.message.read_at).toEqual(null);
    });
    test(`Fails to retrieve message details and returns a 401 error when a valid id is passed as a 
      parameter but a JWT is sent that is not associated with the sender or recipient user`, async () => {
      let message = await request(app)
        .get(`/messages/${message1.id}`)
        .send({ token: userToken3 }); // JWT token that does not decode to contain sender or recipient username
       
      expect(message.status).toEqual(401);
      expect(message.body.error).toEqual('Unauthorized');
    });
    test(`Fails to retrieve message details and returns a 404 error when an invalid integer id is passed`, async () => {
    let message = await request(app)
      .get('/messages/0')
      .send({ token: userToken });

    expect(message.status).toEqual(404);
    expect(message.body.error).toEqual('No such message: 0');
  });
  test(`Fails to retrieve message details and returns a 400 error when a non-integer id is passed`, async () => {
    let message = await request(app)
      .get('/messages/blahBlahBlah')
      .send({ token: userToken });

    console.log(message.body);  
    expect(message.status).toEqual(400);
    expect(message.body.error).toEqual('id must be an integer');
  });
});


afterAll(async () => {
  await db.end();
});
  