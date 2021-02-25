const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");


let testUser;

beforeEach(async () => {
  testUser = new User(
    "test1",
    "password",
    "Test1",
    "Testy1",
    "+14155550000",
  );

  await request(app)
  .post("/auth/register")
  .send({ testUser });

  await request(app)
  .post("/auth/login")
  .send({ testUser });

});

afterEach( async () => {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
})

describe("GET /users/", () => {
  test("Can retrieve a list of all users when a user is logged in", async () => {
      console.log(testUser);
    let response = await request(app)
      .post("/auth/register")
      .send( testUser );
  
    let token = response.body.token;
  
    expect(response.status).toEqual(201);
    expect(jwt.decode(token)).toEqual({
    username: "bob",
    iat: expect.any(Number)
    });
  
  });
});


afterAll(async () => {
    await db.end();
});
  