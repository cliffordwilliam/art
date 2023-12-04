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