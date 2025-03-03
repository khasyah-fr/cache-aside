const redis = require('redis')
const logger = require('../../logger.js')

let redisClient = null

exports.initiateRedis = async (config) => {
    if (!redisClient) {
        redisClient = redis.createClient({
            url: `redis://${config.REDISHOST}:${config.REDISPORT}`,
            password: config.REDISPASSWORD
        })

        redisClient.on('error', (err) => {
            logger.error('redis client error ', err)
        })

        await redisClient.connect()
    }

    return redisClient
}

exports.closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit()
        redisClient = null
    }
}

exports.getCachedData = async (cacheKey) => {
    if (!redisClient) {
        throw new Error('redis client has not been initialized')
    }

    try {
        const data = await redisClient.get(cacheKey)
        return data ? JSON.parse(data) : null
    } catch (error) {
        throw new Error(`redis get error: ${error.message}`)        
    }
}

exports.setCachedData = async (cacheKey, data) => {
    if (!redisClient) {
        throw new Error(`redis client has not been initialized`)
    }

    try {
        await redisClient.set(cacheKey, JSON.stringify(data))
    } catch (error) {
        throw new Error(`redis set error: ${error.message}`)        
    }
}