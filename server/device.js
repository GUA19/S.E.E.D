const { Point } = require('@influxdata/influxdb-client')

class Device {
    constructor(id) {
        this.id = id;
        this.sensors = {
            fsr0: 0,
            fsr1: 0,
            fsr2: 0,
            fsr3: 0,
            temp0: 0,
            temp1: 0,
        };
        this.posture = "not_sitting";
        setInterval(() => {
            // update posture analysis every 5s
            this.updatePosture()
        }, 5 * 1000);
        setInterval(() => {
            // broadcast web socket data every 1s
            globalWebSocket.broadcastSensorReading()
            globalWebSocket.broadcastSittingPosture()
        }, 1000);
        this.writeApi = globalInfluxClient.getWriteApi();
        this.WSTokens = {}
    }

    updateForceSensorReading(fsr0, fsr1, fsr2, fsr3) {
        this.sensors.fsr0 = fsr0
        this.sensors.fsr1 = fsr1
        this.sensors.fsr2 = fsr2
        this.sensors.fsr3 = fsr3
        let point = new Point('sensors_reading')
            .tag('force_sensor', 'GHF-10')
            .intField('fsr0', parseFloat(fsr0))
            .intField('fsr1', parseFloat(fsr1))
            .intField('fsr2', parseFloat(fsr2))
            .intField('fsr3', parseFloat(fsr3))
        try {
            this.writeApi.writePoint(point)
            void setTimeout(() => {
                this.writeApi.flush()
            }, 1000)   
        } catch (error) {
            console.log(error)
            return false
        }
        return true
    }

    updateTemperatureSensorReading(temp0, temp1) {
        this.sensors.temp0 = temp0
        this.sensors.temp1 = temp1
        let point = new Point('sensors_reading')
            .tag('temperature_sensor', 'TMP36')
            .intField('temp0', parseFloat(temp0))
            .intField('temp1', parseFloat(temp1))
        try {
            this.writeApi.writePoint(point)
            void setTimeout(() => {
                this.writeApi.flush()
            }, 1000)
        } catch (error) {
            console.log(error)
            return false
        }
        return true
    }

    getSensorReading() {
        return this.sensors
    }

    // ['not_sitting', 'upright', 'leaning_back', 'leaning_forward', 'leaning_right_or_Left', 'one_leg_over_the_other', 'sitting_at_the_front_edge']
    updatePosture() {

    }

    getPosture() {
        return this.posture
    }

    newWSToken() {
        let res = Date.now().toString() + "-" + this.generateRandomString(32)
        this.WSTokens[res] = true
        return res
    }

    verifyWSToken(token) {
        let a = Date.now() + 1000 - parseInt(token.slice(0, 13));
        if (a > 5 * 60 * 1000) {
            // allow each token to be valid for 5 mins
            delete this.WSTokens[token]
            return false
        }
        // check if this is actually a cached token
        return (this.WSTokens[token] == true)
    }

    generateRandomString(myLength) {
        const chars = "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
        const randomArray = Array.from(
            { length: myLength },
            (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
        return randomArray.join("");
    };
}

module.exports = Device