require('dotenv').config()

const express = require('express')
const { Server } = require('socket.io')
const http = require('http')
const redis = require('redis')


const logger = require('./logger.js')

const pgDb = require('./repository/pg/db.js')
const redisCache = require('./repository/redis/cache.js')

const app = express()

const server = http.createServer(app)
const io = new Server(server)

pgDb.initiatePool(process.env).then(() => {
    logger.info(`pg database connection pool initialized`)
}).catch( err => {
    logger.error(`failed to initialize database pool: ${err.message}`)
    process.exit(1)
})

