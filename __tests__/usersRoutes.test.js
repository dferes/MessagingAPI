const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');

const app = require("../app");
const db = require("../db");
const User = require("../models/user");


let testUser;
let testUser2;
let userToken;

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


afterAll(async () => {
    await db.end();
});
  