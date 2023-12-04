const express = require("express") // express
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper
// child routers
const artRouter = require("./artRouter")
const authRouter = require("./authRouter")
const typeRouter = require("./typeRouter")
const userRouter = require("./userRouter")
// controllers - for pubs
const ArtController = require("../controllers/artController")


const homeRouter = express.Router() // create router

// child routers / controller handle endpoints (get post put patch del)

// free
homeRouter.get("/art/pub", ArtController.getArtPub)
homeRouter.get("/art/pub/:id", ArtController.getArtId)
homeRouter.use("/auth", authRouter)
// token
homeRouter.use(Middleware.tokenGuard)
homeRouter.use("/art",artRouter)
homeRouter.use("/type",typeRouter)
homeRouter.use("/user", Middleware.adminGuard, userRouter)


module.exports = homeRouter