const express = require("express") // express
const AuthController = require("../controllers/authController") // get controller
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper


const authRouter = express.Router() // create router

// controller handle endpoints (get post put patch del)
authRouter.post("/login", AuthController.postLogin)


module.exports = authRouter