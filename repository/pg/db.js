const { Pool } = require('pg')

let pool = null 

exports.initiatePool = async (config) => {
    if (!pool) {
        pool = new Pool({
            user: config.PGUSER,
            password: config.PGPASSWORD,
            database: config.PGDATABASE,
            host: config.PGHOST,
            port: config.PGPORT,
        })
    }

    return pool
}

exports.closePool = async () => {
    if (pool) {
        await pool.end()
        pool = null
    }
}

exports.queryDatabase = async (query, params) => {
    if (!pool) {
        throw new Error('pool has not been initialized')
    }

    const client = await pool.connect()

    try {
        const res = await client.query(query, params)
        return res.rows
    } catch (error) {
        throw new Error(`database query error: ${error.message}`)
    } finally {
        client.release()
    }
}

