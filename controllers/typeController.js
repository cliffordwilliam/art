const Helper = require("../helper/helper")
const {User,Art,Type} = require("../models")


class TypeController {
    static async postType(req,res,next) {
        try {
            // not all body filled? throw
            Helper.bodyCheck(req.body)
            // get body
            const {name} = req.body
            // create
            const postedType = await Type.create({name})
            // res status
            res.status(201).json({message:"success postType",postedType})
        } catch (error) {
            next(error)
        }
    }

    static async getType(req,res,next) {
        try {
            // findAll
            const typesArray = await Type.findAll()
            // res status
            res.status(201).json({message:"success getType",typesArray})
        } catch (error) {
            next(error)
        }
    }

    static async putType(req,res,next) {
        try {
            // not all body filled? throw
            Helper.bodyCheck(req.body)
            // always need a param id
            const {id} = req.params
            // get body
            const {name} = req.body
            // findById
            const obj = await Helper.findById(Type, id)
            // update
            const puttedType = await Type.update({name,},{where:{id},returning:true})
            //res status
            res.status(200).json({message:"success putType",puttedType})
        } catch (error) {
            next(error)
        }
    }

    static async deleteType(req,res,next) {
        try {
            // always need a param id
            const {id} = req.params
            // findById
            const obj = await Helper.findById(Type, id)
            // delete
            await Type.destroy({where:{id}})
            //res status
            res.status(200).json({message:"success deleteType",obj})
        } catch (error) {
            next(error)
        }
    }
}


module.exports = TypeController