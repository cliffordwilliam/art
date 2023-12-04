const express = require("express") // express
const UserController = require("../controllers/userController") // get controller
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper


const userRouter = express.Router() // create router

// controller handle endpoints (get post put patch del)
userRouter.post("/", UserController.postUser)


module.exports = userRouter