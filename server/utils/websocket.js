const compression = require('compression')
const express = require('express')
const app = express()
app.use(compression())
const server = require('http').createServer(app);
const WebSocket = require('ws');

class WebSocketServer {
    constructor() {
        this.subSensorReadingMap = new Map();
        this.subSittingPostureMap = new Map();

        this.wss = new WebSocket.Server({ server: server })
        let v = this;
        this.wss.on('connection', function connection(ws) {
            console.log('A new client Connected!');
            ws.send('Welcome New Client!');
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
                try {
                    let dict = JSON.parse(message)
                    switch (dict.type) {
                        case "authenticate":
                            if (!globalDevice.verifyWSToken(dict.token)) {
                                ws.send('Authorization_RequestDenied');
                                ws.close()
                            }
                            break
                        case "subscribe":
                            v.subHandler(ws, dict)
                            break
                    }
                } catch (err) {
                    console.log(err);
                }
            })
        });
        this.on = true
        server.listen(5000, () => console.log(`Ws lisening on port 5000`))
    }

    // TODO: identify id for different device in the future
    subHandler(ws, dict) {
        switch (dict.channel) {
            case 'sensor_reading':
                this.subSensorReadingMap.set(ws, true)
                console.log("Sending Sensor Reading!")
                break;
            case 'sitting_posture':
                this.subSittingPostureMap.set(ws, true)
                console.log("Sending Sitting Posture!")
            default:
                break;
        }
    }

    broadcastSensorReading() {
        if (!this.on) return
        let dict = globalDevice.getSensorReading()
        dict.channel = "sensor_reading"
        for (let client of this.wss.clients) {
            if (this.subSensorReadingMap.has(client)) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(dict));
                }
            }
        }
    }

    broadcastSittingPosture() {
        if (!this.on) return
        let dict = {
            posture: globalDevice.getPosture(),
            channel: "sitting_posture",
        }
        for (let client of this.wss.clients) {
            if (this.subSittingPostureMap.has(client)) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(dict));
                }
            }
        }
    }
}

module.exports = WebSocketServer