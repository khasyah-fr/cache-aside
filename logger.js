const winston = require('winston')
const path = require('path')

const DailyRotateFile = require('winston-daily-rotate-file')

const fs = require('fs')
const logDir = path.join(__dirname, 'logs')
if ( !fs.existsSync(logDir) ) {
    fs.mkdirSync(logDir)
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: path.join(logDir, 'info-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'info'
        }),
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error'
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
})

module.exports = logger