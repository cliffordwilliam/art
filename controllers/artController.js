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