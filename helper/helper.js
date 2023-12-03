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
            next(error)
        }
    }

    static async comparePassword(receivedPassword, databasePassword){
        try {
            return await bcrypt.compare(receivedPassword, databasePassword)
        } catch (error) {
            next(error)
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
            next(error)
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
            next(error)
        }
    }
}


module.exports = Helper