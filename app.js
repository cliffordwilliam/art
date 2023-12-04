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