require('dotenv').config()

const express = require('express')
const { Server } = require('socket.io')
const http = require('http')


const logger = require('./logger.js')

const pgDb = require('./repository/pg/db.js')
const redisCache = require('./repository/redis/cache.js')

const app = express()

const server = http.createServer(app)
const io = new Server(server)

// Setup postgresql database
pgDb.initiatePool(process.env).then(() => {
    logger.info(`pg database connection pool initialized`)
}).catch( err => {
    logger.error(`failed to initialize database pool: ${err.message}`)
    process.exit(1)
})

// Setup redis cache
redisCache.initiateRedis(process.env).then(() => {
    logger.info(`redis cache client has been initialized`)
}).catch( err => {
    logger.error(`failed to initialize cache client: ${err.message}`)
    process.exit(1)
})

// Cache-aside implementation
const getTargetPrices = async (securityCode) => {
    const cacheKey = `target_price:${securityCode}`

    // Try to get from Redis cache
    const cachedData = await redisCache.getCachedData(cacheKey)

    if (cachedData) {
        logger.info(`fetched data from Redis for security code ${securityCode}`)
        return cachedData
    } else {
        // Cache miss, fetch from PostgreSQL
        const prices = await pgDb.queryDatabase(
            `SELECT * FROM fit.target_price WHERE sec = $1 ORDER BY seq DESC LIMIT 10;`,
            [securityCode]
        )

        // Update Redis cache
        await redisCache.setCachedData(cacheKey, prices)

        logger.info(`fetched data from PostgreSQL for security code ${securityCode}`)
        return prices
    }
}

// HTTP endpoint
app.get('/prices/:securityCode', async (req, res) => {
    const securityCode = req.params.securityCode

    try {
        const prices = await getTargetPrices(securityCode)
        res.json(prices)
    } catch (error) {
        logger.error(`error fetching prices: ${error}`)
        res.status(500).json({error: 'internal server error'})
    }
})

// WebSocket endpoint
io.on('connection', (socket) => {
    logger.info('new user connected')

    socket.on('targetprice', async (securityCode) => {
        try {
            const prices = await getTargetPrices(securityCode)
            socket.emit('priceupdate', prices)
        } catch (error) {
            logger.error(`error fetching prices for websocket: ${error}`)
            socket.emit('error', {error: 'error fetching prices'})            
        }
    })

    socket.on('disconnect', () => {
        logger.info(`a user disconnected`)
    })
})

// Gracefully close the PostgreSQL and Redis connections
const shutdown = async () => {
    logger.info(`shutting down server`)
    
    try {
        await pgDb.closePool()
        logger.info('closing postgresql connection')
    } catch (err) {
        logger.error(`error closing postgresql connection ${err.message}`)
    }

    try {
        await redisCache.closeRedis()
        logger.info('closing redis connection')
    } catch (err) {
        logger.error(`error closing redis connection ${err.message}`)
    }

    process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

const PORT = process.env.SERVERPORT || 3000
server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})