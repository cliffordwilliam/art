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