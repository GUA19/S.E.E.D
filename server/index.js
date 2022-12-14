const express = require('express')
const path = require("path");
const bodyParser = require('body-parser');
const app = express()
const port = 80

app.get('/api/authorized', function (req, res) {
    res.send('Secured Resource');
});

// Initialize database
const InfluxClient = require('./utils/influxdb');
global.globalInfluxClient = new InfluxClient();

// Initialize websocket
const WebSocket = require('./utils/websocket');
global.globalWebSocket = new WebSocket();

// Initialize Device
// TODO: register new device automaticly in the future
const Device = require('./device');
global.globalDevice = new Device();

// body parser for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// Define API
const auth = require('./api/auth')
const sensor = require('./api/sensor')
const report = require('./api/report')
app.use('/api/auth', auth)
app.use('/api/sensor_reading', sensor)
app.use('/api/report', report)

// Static folder
app.use(express.static(path.join(__dirname, "/public")))

// Handle SPA
app.get('/', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})