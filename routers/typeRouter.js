const express = require("express") // express
const TypeController = require("../controllers/typeController") // get controller
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper


const typeRouter = express.Router() // create router

// controller handle endpoints (get post put patch del)
typeRouter.get("/", TypeController.getType)
typeRouter.post("/", TypeController.postType)
typeRouter.put("/:id", TypeController.putType)
typeRouter.delete("/:id", TypeController.deleteType)


module.exports = typeRouter