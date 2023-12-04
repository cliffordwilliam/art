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
        throw({name:"CustomError", message, status}) 
    }
    
    static bodyCheck(reqBody) {
        for (const key of Object.keys(reqBody)) {
            if (!reqBody[key]) {
                Helper.throwCustomError(`${key} is required`, 400)
            }
        }
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
        return jwt.sign(payload, process.env.SECRET_KEY)
    }

    static tokenToPayload(token){
        return jwt.verify(token, process.env.SECRET_KEY)
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
    
    static async findByWhere(model, where, isCheckingPayload){
        try {
            // where = {authorId: 2}
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

# Sequelize init

```
npx sequelize init
```

# config.json

```json
{
  "development": {
    "username": "postgres",
    "password": "postgres",
    "database": "art",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "test": {
    "username": "postgres",
    "password": "postgres",
    "database": "artTest",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "production": {
    "use_env_variable": "DATABASE_URL"
  }
}
```

# Create database

```
npx sequelize db:create
npx sequelize db:create --env test
```

# Table

## Create model

```
npx sequelize model:create --name User --attributes username:string
```

## Edit Migration (Add what you need)

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

## Edit Model (Copy paste, delete what you don't need)

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
        len:{args:[5,Infinity],msg:"password char len min 5"}, // char len min 5
        min:{args:[100],msg:"price number min 100"}, // number min 100
    }
}

static associate(models) {
    this.hasMany(models.Art)
    this.belongsTo(models.User)
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
            email: 'ryoko@gmail.com',
            password: await Helper.hashPassword("password"),
            role: 'Admin',
            phoneNumber: '+1 123-456-7890',
            address: '1 Love Lane, Anime City',
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ],{})
  },

async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {})
}
```

# Seed database / insert row

```
npx sequelize db:seed:all
```

# Middleware

```js
const Helper = require("../helper/helper");
const Util = require("../util/util");
const {User,Art,Type} = require ("../models")
const {Op} = require("sequelize")


class Middleware {
    static handleError(err,req,res,next){
        console.log(err);
        switch (err.name) {
            case "SequelizeValidationError":
            case "SequelizeUniqueConstraintError":
                return res.status(400).json({message:err.errors[0].message})
            case "JsonWebTokenError":
                return res.status(401).json({message:err.message})
            case "CustomError":
                const {status,message,} = err
                return res.status(status).json({message})
            default:
                return res.status(500).json({message:"internal server error"})
        }
    }

    static async tokenGuard(req,res,next){ //authentication
        try {
            if (!req.headers.authorization) Helper.throwCustomError("unauthorized", 401)
            const token = req.headers.authorization.split(" ")[1]
            const payload = Helper.tokenToPayload(token)
            console.log(payload)
            const {id, username, email, password, role, phoneNumber, address} = payload
            const user = await Helper.findByWhere(User, {email}, true)
            req.loggedInUser = {id, username, role}
            next()
        } catch (error) {
            next(error)
        }
    }

    static adminGuard(req,res,next){ // authorization
        req.loggedInUser.role !== "Admin" ? Helper.throwCustomError("forbidden", 403) : next()
    }

    static async staffEditGuard(req,res,next){
        try {
            if (req.loggedInUser.role === "Admin") return next() // you may pass
            // staff can only edit their own belongings
            const {id} = req.params
            const obj = await Helper.findById(Art, id)
            if (req.loggedInUser.id !== obj.UserId) Helper.throwCustomError("forbidden", 403)
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
const Helper = require("../helper/helper")
const {User,Art,Type} = require("../models")
const Util = require("../util/util") // 3rd API helper


class ArtController {
    static async postArt(req,res,next) {
        try {
            // not all body filled? throw
            Helper.bodyCheck(req.body)
            // get body
            const {name,description,price,stock,imgUrl,TypeId} = req.body
            const UserId = req.loggedInUser.id // art belongs to creator (the one who post)
            // create
            const postedArt = await Art.create({name,description,price,stock,imgUrl,TypeId,UserId})
            // res status
            res.status(201).json({message:"success postArt",postedArt})
        } catch (error) {
            next(error)
        }
    }

    static async getArt(req,res,next) {
        try {
            // findAll - include owner users but do not get their password
            const artsArray = await Art.findAll({include:[{model:User,attributes:{exclude:["password"]}},{model:Type}]})
            // res status
            res.status(201).json({message:"success getArt",artsArray})
        } catch (error) {
            next(error)
        }
    }

    static async getArtPub(req,res,next) {
        try {
            // get query
            const {name,TypeId,sort,page} = req.query

            // queries can be blank
            
            // name: query must be a string, must be under 50 char
            if (name && !isNaN(+name)) Helper.throwCustomError("name query must be a string", 400)
            if (name && name.length > 50) Helper.throwCustomError("name maximum length is 50 characters", 400)
            // TypeId: query must be a number, must be 1 and above, must be int
            if (TypeId && isNaN(+TypeId)) Helper.throwCustomError("TypeId query must be a number", 400)
            if (TypeId && TypeId < 1) Helper.throwCustomError("TypeId minimum value is 1", 400)
            if (TypeId && !Number.isInteger(+TypeId)) Helper.throwCustomError("TypeId cannot be a float", 400)
            // sort: query must be a string, word must be 'oldest'
            if (sort && !isNaN(+sort)) Helper.throwCustomError("sort query must be a string", 400)
            if (sort && sort !== "oldest") Helper.throwCustomError("sort can only be the word 'oldest'", 400)
            // page: query must be a number, must be 1 and above, must be int
            if (page && isNaN(+page)) Helper.throwCustomError("page query must be a number", 400)
            if (page && page < 1) Helper.throwCustomError("page minimum value is 1", 400)
            if (page && !Number.isInteger(+page)) Helper.throwCustomError("page cannot be a float", 400)
            
            // build query
            let query = {}
            if (name) query.name = {[Op.iLike]: `%${name}%`} // query.name
            if (TypeId) query.TypeId = TypeId // query.TypeId
            let order = sort === 'oldest' ? [['createdAt', 'ASC']] : [['createdAt', 'DESC']] // order
            // pagination
            const limit = 10 // limit
            const currentPage = page || 1
            const offset = (currentPage - 1) * limit // offset
            // findAll
            const artsArray = await Art.findAll({where:query,order,offset,limit})
            // res.status
            res.status(200).json({message:"success getArtPub",artsArray})
        } catch (error) {
            next(error)
        }
    }

    static async getArtId(req,res,next) {
        try {
            // always need a param id
            const {id} = req.params
            // findById
            const obj = await Helper.findById(Art, id)
            //res status
            res.status(200).json({message:"success getArtId",obj})
        } catch (error) {
            next(error)
        }
    }

    static async putArt(req,res,next) {
        try {
            // not all body filled? throw
            Helper.bodyCheck(req.body)
            // always need a param id
            const {id} = req.params
            // get body
            const {name,description,price,stock,imgUrl,TypeId} = req.body
            // findById
            const obj = await Helper.findById(Art, id)
            // update
            const UserId = obj.UserId // UserId stays the same
            const puttedArt = await Art.update({name,description,price,stock,imgUrl,TypeId,UserId},{where:{id},returning:true})
            //res status
            res.status(200).json({message:"success putArt",puttedArt})
        } catch (error) {
            next(error)
        }
    }

    static async patchArt(req,res,next) {
        try {
            // not all req.file filled? throw
            if (!req.file) Helper.throwCustomError("imgUrl required", 400)
            Helper.bodyCheck(req.file)
            // always need a param id
            const {id} = req.params
            // findById
            const obj = await Helper.findById(Art, id)
            // upload to imgkit and get the url
            const imgBase64 = req.file.buffer.toString("base64")
            const result = await Util.imagekit.upload({file:imgBase64,fileName:req.file.originalname,tags:[`${req.file.originalname}`]})
            const imgUrl = result.url
            // update
            const patchedArt = await Art.update({imgUrl},{where:{id},returning:true})
            //res status
            res.status(200).json({message:"success patchArt",patchedArt})
        } catch (error) {
            next(error)
        }
    }

    static async deleteArt(req,res,next) {
        try {
            // always need a param id
            const {id} = req.params
            // findById
            const obj = await Helper.findById(Art, id)
            // delete
            await Art.destroy({where:{id}})
            //res status
            res.status(200).json({message:"success deleteArt",obj})
        } catch (error) {
            next(error)
        }
    }
}


module.exports = ArtController
```

# Controller auth

```js
const Helper = require("../helper/helper")
const {User,Art,Type} = require("../models")


class AuthController {
    static async postLogin(req,res,next){
        try {
            // not all body filled? throw
            Helper.bodyCheck(req.body)
            // get body
            const {email:bodyEmail, password:bodyPassword} = req.body
            // since email is unique, email is used as 'where' to find the user
            const user = await Helper.findByWhere(User, {email:bodyEmail}, true)
            const {id, username, email, password, role, phoneNumber, address} = user
            // password correct?
            if (!await Helper.comparePassword(bodyPassword, password)) Helper.throwCustomError("incorrect password", 401)
            // make payload
            const payload = {id, username, email, password, role, phoneNumber, address}
            // payload -> token
            const token = await Helper.payloadToToken(payload)
            // res status
            res.status(200).json({message:"success postLogin",token})
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


const typeRouter = express.Router() // create router

// controller handle endpoints (get post put patch del)
typeRouter.get("/", TypeController.getType)
typeRouter.post("/", TypeController.postType)
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


const artRouter = express.Router() // create router

// controller handle endpoints (get post put patch del)
artRouter.get("/", ArtController.getArt)
artRouter.get("/:id", ArtController.getArtId)
artRouter.post("/", ArtController.postArt)
artRouter.put("/:id", Middleware.staffEditGuard, ArtController.putArt)
artRouter.patch("/:id", Middleware.staffEditGuard, Util.upload.single("imgUrl"), ArtController.patchArt) // need middleware to patch imgurl
artRouter.delete("/:id", Middleware.staffEditGuard, ArtController.deleteArt)


module.exports = artRouter
```

# Home router

```js
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
```

# App

```js
if (process.env.NODE_ENV !== "production") require('dotenv').config() // production?
const express = require("express") // express
const homeRouter = require("./routers/homeRouter") // home router
const Middleware = require("./middleware/middleware") // handle error


const app = express()

app.use(express.urlencoded({extended:true})) // req.body
app.use(express.json()) // for jest to be able to read
app.use(homeRouter) // home router
app.use(Middleware.handleError) // handle error


module.exports = app
```

# www

```js
const app = require("../app")


const PORT = process.env.PORT || 3000
app.listen(PORT, ()=>{`listening to ${PORT}`})
```