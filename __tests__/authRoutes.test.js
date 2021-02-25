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
    "+14155550000"
  );
});

afterEach( async () => {
  await db.query("DELETE FROM messages");
  await db.query("DELETE FROM users");
})


/* POST /auth/register => token  */
describe("POST /auth/register", () => {
  test("Can register when all 5 valid user paramaters are passed as JSON ", async () => {
    let response = await request(app)
      .post("/auth/register")
      .send( testUser );

    let token = response.body.token;

    expect(response.status).toEqual(201);
    expect(jwt.decode(token)).toEqual({
    username: "test1",
    iat: expect.any(Number)
    });

  });

  test("Returns a 409 Error when a user tries to register with username that already exists", async () => {
    let res = await request(app)
      .post("/auth/register")
      .send( testUser );
    res = await request(app)
      .post("/auth/register")
      .send( testUser );

    expect(res.body.error).toEqual('User account with username test1 already exists');
    expect(res.status).toEqual(409);
  });
});


describe("POST /auth/login",  () => {
  beforeEach( async () => {
    await request(app)
    .post("/auth/register")
    .send( testUser );
  });

  test("Can login when valid user credentials are passed in", async () => {
    let response = await request(app)
      .post("/auth/login")
      .send({ username: testUser.username, password: testUser.password });
    
    let token = response.body.token;
    expect(response.status).toEqual(200);
    expect(jwt.decode(token)).toEqual({
      username: testUser.username,
      iat: expect.any(Number)
    });
  });

  test("Return a 409 status and fail to login to user account when a valid username is passed in with the wrong password", async () => {
    let response = await request(app)
      .post("/auth/login")
      .send({ username: testUser.username, password: "WRONG" });
    expect(response.statusCode).toEqual(409);
    expect(response.body).toEqual({ 
        error: 'Invalid password'});
  });

  test("Return a 409 status and fail to login when an unregistered username is passed in", async () => {
    let response = await request(app)
      .post("/auth/login")
      .send({ username: "not_user", password: "password" });
    expect(response.statusCode).toEqual(409);
  });

});


afterAll(async () => {
  await db.end();
});
