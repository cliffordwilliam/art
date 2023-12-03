# npm

```
npm init -y
npm i express pg sequelize bcrypt jsonwebtoken dotenv multer imagekit jest supertest
npm i -D nodemon sequelize-cli
```

# gitignore

```
node_modules
.env
```

# .env

```
SECRET_KEY=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

# Util

```js
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
```

# Helper

```js
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")


class Helper {
    static throwCustomError(message, status) {
        throw({name:"CustomError",message,status}) 
    }
    static async hashPassword(value){
        try {
            return await bcrypt.hash(value, 10)
        } catch (error) {
            throw error
        }
    }
    static async comparePassword(receivedPassword, databasePassword){
        try {
            return await bcrypt.compare(receivedPassword, databasePassword)
        } catch (error) {
            throw error
        }
    }
    static payloadToToken(payload){
        return jwt.sign(payload,process.env.SECRET_KEY)
    }
    static tokenToPayload(token){
        return jwt.verify(token,process.env.SECRET_KEY)
    }
    static async findById(model, id){
        try {
            const obj = await model.findByPk(id)
            if (!obj) Helper.throwCustomError(`object with id:${id} does not exist`, 404)
            return obj
        } catch (error) {
            throw error
        }
    }
    static async findBywhere(model, where, isCheckingPayload){
        try {
            const obj = await model.findOne({where})
            if (!obj) { // comparing payload data with db? err is unauthorized
                if (isCheckingPayload) Helper.throwCustomError("unauthorized", 401)
                Helper.throwCustomError(`object with where:${where} does not exist`, 404)
            }
            return obj
        } catch (error) {
            throw error
        }
    }
}


module.exports = Helper
```

# Table

## Create model

```
npx sequelize db:model:create --name User --attributes username:string
```

## Edit Migration

- constraints
- validations
- fk

```js
username: {
    type:Sequelize.STRING,
    allowNull:false, // required
    unique:true, // unique
    validate:{
        isEmail:true, // email format
        isUrl:true, // url format
        len:[5,Infinity], // char len min 5
        min:100, // number min 100
    },
    references:{model:"Types",key:"id"}, // fk
    onUpdate:"cascade", // fk
    onDelete:"cascade", // fk
}
```

## Edit Migration

- constraints
- validations
- association
- before create

```js
username: {
    type:DataTypes.STRING,
    defaultValue: "Staff", // default value
    unique:true, // unique
    allowNull:false, // required
    validate:{
        notNull:{msg:"username required"}, // required
        notEmpty:{msg:"username required"}, // required
        isUrl:{msg:"wrong isUrl format"}, // url format
        isEmail:{msg:"wrong email format"}, // email format
        len:{args:[5,Infinity],msg:"password char len min 5"} // char len min 5
        min:{args:[100],msg:"price number min 100"}, // number min 100
    }
}

static associate(models) {
    User.hasMany(models.Art)
    Art.belongsTo(models.User)
}

User.beforeCreate(async (user)=>{
    try {
        user.password = await Helper.hashPassword(user.password)
    } catch (error) {
        throw error
    }
})
```

# Migrate / create table

```
npx sequelize db:migrate
npx sequelize db:migrate --env test
```

# Create seed

```
npx sequelize seed:create --name seedUser
```

# Edit seed

```js
async up (queryInterface, Sequelize) {
    // hash here because UP is not caught by before create
    await queryInterface.bulkInsert('Users', [
        {
            username: 'ryoko',
            email: 'ryoko@email.com',
            password: await Helper.hashPassword("password"),
            role: 'Admin',
            phoneNumber: '+1 123-456-7890',
            address: '1 Love Lane, Anime City',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            username: 'billy',
            email: 'billy@email.com',
            password: await Helper.hashPassword("password"),
            role: 'Admin',
            phoneNumber: '+1 987-654-3210',
            address: '2 Romantic Road, Otaku Town',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ],{})
},

async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
}
```

# Seed database / insert row

```
npx sequelize db:seed:all
```

# Middleware

```js
const Util = require("../util/util")
const Helper = require("./helper/helper")
const {User, Art, Type} = require("../models")
const {Op} = require("sequelize")


class Middleware {
    static handleError(err,req,res,next) {
        switch (err.name) {
            case "SequelizeValidationError":
            case "SequelizeUniqueConstraintError":
                return res.status(400).json({message:err.errors[0].message})
            case "CustomError":
                return res.status(err.status).json({message:err.message})
            case "JsonWebTokenError":
                return res.status(401).json({message:err.message})
            default:
                return res.status(500).json({message:"Internal Server Error"})
        }
    }

    static async tokenGuard(req,res,next) {
        try {
            if (!req.headers.authorization) Helper.throwCustomError("unauthorized", 401)
            const token = req.headers.authorization.split(" ")[1]
            const payload = await Helper.tokenToPayload(token)
            const user = await Helper.findOne(User, {username:payload.username}, true)
            req.loggedInUser = {id:user.id, username:user.username, role:user.role}
        } catch (error) {
            throw next(error)
        }
    }

    static async adminGuard(req,res,next) {
        if (req.loggedInUser.role !== "Admin") Helper.throwCustomError("forbidden", 403)
        next()
    }

    static async staffEditSelfOnly(req,res,next){
        try {
            const obj = await Helper.findById(req.params.id, Art)
            // staff? edit their belongings only
            if (req.loggedInUser.role==="Staff" && req.loggedInUser.id!==obj.UserId) Helper.throwCustomError("forbidden", 403)
            next()
        } catch (error) {
            next(error)
        }
    }
}


module.exports = Middleware
```

# Controller crud

```js
const Util = require("../util/util")
const Helper = require("./helper/helper")
const {User, Art, Type} = require("../models")
const {Op} = require("sequelize")


class ArtController {
    static async postArt(req,res,next) {
        try {
            // create
            const postedArt = await Art.create({
                name:req.body.name,
                description:req.body.description,
                price:req.body.price,
                stock:req.body.stock,
                imgUrl:req.body.imgUrl,
                TypeId:req.body.TypeId,
                UserId:req.loggedInUser.id
            })
            // res.status
            res.status(201).json({message:"Success postArt",postedArt})
        } catch (error) {
            next(error)
        }
    }
    static async getArt(req,res,next) {
        try {
            // findAll
            const artsArray = await Art.findAll({include:[{model:User,attributes:{exclude:["password"]}}]})
            // res.status
            res.status(200).json({message:"Success getArt",artsArray})
        } catch (error) {
            next(error)
        }
    }
    static async getArtPub(req,res,next) {
        try {
            // name: query must be a string, must be under 50 char
            if (req.query.name && !isNaN(+req.query.name)) Helper.throwCustomError("name query must be a string", 400)
            if (req.query.name && req.query.name.length > 50) Helper.throwCustomError("name maximum length is 50 characters", 400)
            // TypeId: query must be a number, must be 1 and above, must be int
            if (req.query.TypeId && isNaN(+req.query.TypeId)) Helper.throwCustomError("TypeId query must be a number", 400)
            if (req.query.TypeId && req.query.TypeId < 1) Helper.throwCustomError("TypeId minimum value is 1", 400)
            if (req.query.TypeId && !Number.isInteger(+req.query.TypeId)) Helper.throwCustomError("TypeId cannot be a float", 400)
            // sort: query must be a string, word must be 'oldest'
            if (req.query.sort && !isNaN(+req.query.sort)) Helper.throwCustomError("sort query must be a string", 400)
            if (req.query.sort && req.query.sort !== "oldest") Helper.throwCustomError("sort can only be the word 'oldest'", 400)
            // page: query must be a number, must be 1 and above, must be int
            if (req.query.page && isNaN(+req.query.page)) Helper.throwCustomError("page query must be a number", 400)
            if (req.query.page && req.query.page < 1) Helper.throwCustomError("page minimum value is 1", 400)
            if (req.query.page && !Number.isInteger(+req.query.page)) Helper.throwCustomError("page cannot be a float", 400)
            // build query
            let query = {}
            if (req.query.name) query.name = {[Op.iLike]: `%${req.query.name}%`} // name
            if (req.query.TypeId) query.TypeId = req.query.TypeId // TypeId
            if (req.query.role) query.role = req.query.role // role
            let order = req.query.sort === 'oldest' ? [['createdAt', 'ASC']] : [['createdAt', 'DESC']] // sort
            // pagination
            const limit = 10
            const currentPage = req.query.page || 1
            const offset = (currentPage - 1) * limit
            // findAll
            const artsArray = await Art.findAll({where:query,order,offset,limit})
            // res.status
            res.status(200).json({message:"Success getArt",artsArray})
        } catch (error) {
            next(error)
        }
    }
    static async getArtId(req,res,next) {
        try {
            // findById 
            const obj = await Helper.findById(req.params.id, Art)
            // res.status
            res.status(200).json({message:`Success getArtId id:${req.params.id}`,obj})
        } catch (error) {
            next(error)
        }
    }
    static async getArtIdPub(req,res,next) {
        try {
            // findById 
            const obj = await Helper.findById(req.params.id, Art)
            // res.status
            res.status(200).json({message:`Success getArtId id:${req.params.id}`,obj})
        } catch (error) {
            next(error)
        }
    }
    static async putArt(req,res,next) {
        try {
            // findById 
            const obj = await Helper.findById(req.params.id, Art)
            // update
            const puttedArt = await Art.update({
                name:req.body.name,
                description:req.body.description,
                price:req.body.price,
                stock:req.body.stock,
                imgUrl:req.body.imgUrl,
                TypeId:req.body.TypeId,
                UserId:obj.UserId
            },{where:{id:req.params.id},returning:true})
            // res.status
            res.status(200).json({message:`Success putArt id:${req.params.id}`,puttedArt})
        } catch (error) {
            next(error)
        }
    }
    static async deleteArt(req,res,next) {
        try {
            // findById 
            const obj = await Helper.findById(req.params.id, Art)
            // delete
            await Art.destroy({where:{id:req.params.id}})
            // res.status
            res.status(200).json({message:`Success deleteArt id:${req.params.id}`,obj})
        } catch (error) {
            next(error)
        }
    }
    static async patchArt(req,res,next) {
        try {
            // no req.file? throw
            if (!req.file) Helper.throwCustomError("imgUrl required", 400)
            // findById
            const obj = await Helper.findById(req.params.id, Art)
            // upload to imgkit and get the url
            const imgBase64 = req.file.buffer.toString("base64")
            const imgUrl = await Util.imagekit.upload({file:imgBase64,fileName:req.file.originalname,tags:[`${req.file.originalname}`]}).url
            // update with url
            const patchedArt = await Art.update({imgUrl},{where:{id:req.params.id},returning:true})
            // res.status
            res.status(200).json({message:`Success patchArt id:${req.params.id}`,patchedArt})
        } catch (error) {
            next(error)
        }
    }
}


module.exports = ArtController
```

# Controller auth

```js
const Util = require("../util/util")
const Helper = require("./helper/helper")
const {User, Art, Type} = require("../models")
const {Op} = require("sequelize")


class AuthController {
    static async postUser(req,res,next) {
        try {
            if (req.body.username) Helper.throwCustomError("username required", 400)
            if (req.body.email) Helper.throwCustomError("email required", 400)
            if (req.body.password) Helper.throwCustomError("password required", 400)
            if (req.body.phoneNumber) Helper.throwCustomError("phoneNumber required", 400)
            if (req.body.address) Helper.throwCustomError("address required", 400)
            const role = "Staff"
            // create
            const postedUser = await User.create({
                username:req.body.username,
                email:req.body.email,
                password:req.body.password,
                phoneNumber:req.body.phoneNumber,
                address:req.body.address,
                role,
            })
            // prep obj to show without the password
            const postedUserNoPassword = {
                username:req.body.username,
                email:req.body.email,
                phoneNumber:req.body.phoneNumber,
                address:req.body.address,
                role,
            }
            // res.status
            res.status(201).json({message:"Success postUser",postedUserNoPassword})
        } catch (error) {
            next(error)
        }
    }
    static async postLogin(req,res,next) {
        try {
            if (req.body.email) Helper.throwCustomError("email required", 400)
            if (req.body.password) Helper.throwCustomError("password required", 400)
            // email is unique, see if it exists in database
            const obj = await Helper.findBywhere(User, {where:{email:req.body.email}})
            // password correct?
            if (!await Helper.comparePassword(password, obj.password)) Helper.throwCustomError("wrong password", 401)
            // make payload
            const payload = {
                id:obj.id,
                username:obj.username,
                email:obj.email,
                role:obj.role
            }
            // payload -> token
            const token = await Helper.payloadToToken(payload)
            // res.status
            res.status(200).json({message:"Success postLogin",token})
        } catch (error) {
            next(error)
        }
    }
}


module.exports = AuthController
```

# Type router

```js
const express = require("express") // express
const TypeController = require("../controllers/typeController") // get controller
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper


const typeRouter = express.Router() // make router with express

// controller handle endpoints
typeRouter.post("/", TypeController.postType)
typeRouter.get("/", TypeController.getType)
typeRouter.put("/:id", TypeController.putType)
typeRouter.delete("/:id", TypeController.deleteType)


module.exports = typeRouter
```

# Art router

```js
const express = require("express") // express
const ArtController = require("../controllers/artController") // get controller
const Middleware = require("../middleware/middleware") // guards
const Util = require("../util/util") // 3rd API helper


const artRouter = express.Router() // make router with express

// controller handle endpoints
artRouter.get("/", ArtController.getLodging)
artRouter.get("/:id", ArtController.getLodgingId)
artRouter.post("/", ArtController.postLodging)
artRouter.put("/:id", Middleware.staffEditSelfOnly, ArtController.putLodging) // staff edit self guard
artRouter.delete("/:id", Middleware.staffEditSelfOnly, ArtController.deleteLodging) // staff edit self guard
artRouter.patch("/:id", Middleware.staffEditSelfOnly, Util.upload.single("imgUrl"), ArtController.patchLodging) // staff edit self guard


module.exports = artRouter
```

# Home router

```js
const express = require("express") // express
 //child router
const artRouter = require("./artRouter")
const typeRouter = require("./typeRouter")
// guards
const Middleware = require("../middleware/middleware")
// get controllers
const AuthController = require("../controllers/authController")
const ArtController = require("../controllers/artController")

const homeRouter = express.Router() // make router with express

// free
homeRouter.post("/login", AuthController.postLogin)
homeRouter.get("/pub", ArtController.getArtPub)
homeRouter.get("/pub/:id", ArtController.getArtIdPub)
// token
homeRouter.use(Middleware.tokenGuard)
homeRouter.use("/type", typeRouter)
homeRouter.use("/art", artRouter)
homeRouter.post("/add-user", Middleware.adminGuard, AuthController.postUser) // Admin only guard


module.exports = homeRouter
```

# App

```js
if (process.env.NODE_ENV !== "production") require('dotenv').config() // not production? use .env
const express = require("express") // express
const homeRouter = require("./routers/homeRouter") // home router
const Middleware = require("./middleware/middleware") // err handler


const app = express()

app.use(express.urlencoded({extended:true})) // req.body
app.use(express.json()) // ini buat baca dari test
app.use(homeRouter) // home router
app.use(Middleware.handleError) // error handler


module.exports = app
```