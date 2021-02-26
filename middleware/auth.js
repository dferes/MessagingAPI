const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/* Middleware: Authenticate user. */
function authenticateJWT(req, res, next) {
  try {
    const tokenFromBody = req.body._token;
    const payload = jwt.verify(tokenFromBody, SECRET_KEY);
    req.user = payload; // create a current user
    return next();
  } catch (err) {
    return next();
  }
}

/* Middleware: Requires user is authenticated. */
function ensureLoggedIn(req, res, next) {
  if (!req.body.token) return next({ status: 401, message: "Unauthenticated" })
  try{
    jwt.verify(req.body.token, SECRET_KEY);
    const payload = jwt.decode(req.body.token); 
    if (!payload.user) return next({ status: 401, message: "You must be logged in" });
    
    req.user = payload;
    return next();
  }
  catch(e) {
    return next({ status: 401, message: e.message })
  }  
}

/* Middleware: Requires correct username. */
function ensureCorrectUser(req, res, next) {
  try {
    if (req.user.user.username === req.params.username) {
      return next();
    } else {
      return next({ status: 401, message: "Unauthorized" });
    }
  } catch (err) {
    // errors would happen here if we made a request and req.user is undefined
    return next({ status: 401, message: "Unauthorized" });
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser
};
