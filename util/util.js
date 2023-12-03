const multer = require("multer")
const ImageKit = require("imagekit")


class Util {
    // (imagekit + multer) -> upload image to imagekit server

    // base64 -> upload -> url
    // const RESULT = await Util.imagekit.upload({
        // file:imageBase64,
        // fileName:req.file.originalname,
        // tags:[`${req.file.originalname}`]
    // })

    // middleware
    // artRouter.patch("/:id", Middleware.staffEditSelfOnly, Util.upload.single("imgUrl"), ArtController.patchLodging) // staff edit self guard
    static imagekit = new ImageKit({
        publicKey:process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey:process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint:process.env.IMAGEKIT_URL_ENDPOINT,
    })
    static upload = multer({storage: multer.memoryStorage()})
}


module.exports = Util