const express = require("express") // express
const ArtController = require("../controllers/artController") // get controller
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper


const artRouter = express.Router() // create router

// controller handle endpoints (get post put patch del)
artRouter.get("/", ArtController.getArt)
artRouter.get("/:id", ArtController.getArtId)
artRouter.post("/", ArtController.postArt)
artRouter.put("/:id", Middleware.staffEditGuard, ArtController.putArt)
artRouter.patch("/:id", Middleware.staffEditGuard, Util.upload.single("imgUrl"), ArtController.patchArt) // need middleware to patch imgurl
artRouter.delete("/:id", Middleware.staffEditGuard, ArtController.deleteArt)


module.exports = artRouter