const Helper = require("../helper/helper")
const {User,Art,Type} = require("../models")


class UserController {
    static async postUser(req,res,next) {
        // not all body filled? throw
        Helper.bodyCheck(req.body)
        // get body
        const {username,email,password,phoneNumber,address} = req.body
        const role = "Staff"
        // create
        const postedUser = await User.create({username,email,password,phoneNumber,address,role})
        // postedUser -> postedUserNoPassword
        const postedUserNoPassword = {username,email,phoneNumber,address,role}
        // res status
        res.status(201).json({message:"success postUser",postedUserNoPassword})
    }
}


module.exports = UserController