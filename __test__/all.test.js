const request = require("supertest")
const app = require("../app")
const {sequelize} = require('../models')
const Helper = require("../helper/helper")

// for img from disk -> to req body
const path = require("path")
const fs = require("fs")
const filePath = path.resolve(__dirname, "./test.webp")
const imageBuffer = fs.readFileSync(filePath)

let adminToken
let staffToken

beforeAll(async ()=>{
    await sequelize.queryInterface.bulkInsert("Users",[
        {
            username: "admin",
            email: "admin@gmail.com",
            password: await Helper.hashPassword("password"),
            role: "Admin",
            phoneNumber: "+1 123-456-7890",
            address: "1 Love Lane, Anime City",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            username: "staff",
            email: "staff@gmail.com",
            password: await Helper.hashPassword("password"),
            role: "Staff",
            phoneNumber: "+1 123-456-7890",
            address: "1 Love Lane, Anime City",
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ],{})
    const adminPayload = {
        id : 1,
        username: "admin",
        email: "admin@gmail.com",
        password: await Helper.hashPassword("password"),
        role: "Admin",
        phoneNumber: "+1 123-456-7890",
        address: "1 Love Lane, Anime City",
    }
    const staffPayload = {
        id : 1,
        username: "staff",
        email: "staff@gmail.com",
        password: await Helper.hashPassword("password"),
        role: "Staff",
        phoneNumber: "+1 123-456-7890",
        address: "1 Love Lane, Anime City",
    }
    adminToken = Helper.payloadToToken(adminPayload)
    staffToken = Helper.payloadToToken(staffPayload)
})

afterAll(async ()=>{
    await sequelize.queryInterface.bulkDelete('Users', null,{truncate:true,cascade:true,restartIdentity:true})
    await sequelize.queryInterface.bulkDelete('Types', null,{truncate:true,cascade:true,restartIdentity:true})
    await sequelize.queryInterface.bulkDelete('Arts', null,{truncate:true,cascade:true,restartIdentity:true})
})

describe("POST /auth/login", ()=>{
    describe("Response 201", ()=>{
        it("return msg and user", async ()=>{
            const body = {email:"admin@gmail.com",password:"password"}
            const response = await request(app).post("/auth/login").send(body)
            expect(response.status).toBe(200)
            expect(response.body).toBeInstanceOf(Object)
            expect(response.body).toHaveProperty("message", "success postLogin")
            expect(response.body).toHaveProperty("token")
        })
    })
})