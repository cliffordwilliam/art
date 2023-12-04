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