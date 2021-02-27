const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config');

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");


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















afterAll(async () => {
  await db.end();
});
  