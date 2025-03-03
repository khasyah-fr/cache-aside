const io = require('socket.io-client')
const axios = require('axios')

// Change the security code here
const securityCode = 'BBCA'

const fetchPricesHTTP = async (securityCode) => {
    try {
        const response = await axios.get(`http://localhost:3000/prices/${securityCode}`)
        console.log(`HTTP response for ${securityCode}: `, response.data)
    } catch (error) {
        console.error(`error fetching prices via HTTP: ${error.message}`)
    }
}

const fetchPricesWebSocket = (securityCode) => {
    const socket = io('ws://localhost:3000')

    socket.on('connect', () => {
        console.log(`connected to websocket server`)

        socket.emit('targetprice', securityCode)

        socket.on('priceupdate', (data) => {
            console.log(`received price update for ${securityCode}: `, data)
        })

        socket.on('error', (err) => {
            console.log('websocket error: ', err)
        })
    })

    socket.on('disconnect', () => {
        console.log('disconnected from websocket server')
    })
}

const runClient = async () => {
    console.log(`fetching prices for security codes: ${securityCode}`)

    await fetchPricesHTTP(securityCode)

    fetchPricesWebSocket(securityCode)
}

runClient()