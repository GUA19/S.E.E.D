const { Point } = require('@influxdata/influxdb-client')

const TESTTIMERID = 'test'
const ACTUALTIMERID = 'actual'
const FORCESENSORTHRESHOLD = 500
const TEMPSENSORTHRESHOLD = 24

class Device {
    constructor(id) {
        this.id = id;
        this.WSTokens = {}
        this.sensors = {
            fsr0: 0,
            fsr1: 0,
            fsr2: 0,
            fsr3: 0,
            temp0: 0,
            temp1: 0,
        };
        this.offset = {
            fsr0: 0,
            fsr1: 0,
            fsr2: 0,
            fsr3: 0,
        }
        this.posture = "not_sitting";
        this.writeApi = globalInfluxClient.getWriteApi();
        setInterval(() => {
            // update posture analysis every 5s
            this.updatePosture()
        }, 5 * 1000);
        setInterval(() => {
            // check timer status every 0.5s
            this.handleTimers()
            // broadcast data to websocket every 0.5s
            globalWebSocket.broadcastSensorReading()
        }, 500);

        this.testTimer = 0
        this.testTimerOn = false
        this.testInterval = null
        this.actualTimer = 0
        this.actualTimerOn = false
        this.actualInterval = null
    }

    handleTimers() {
        if ((this.sensors.fsr0 - this.offset.fsr0) >= FORCESENSORTHRESHOLD || 
            (this.sensors.fsr1 - this.offset.fsr1) >= FORCESENSORTHRESHOLD || 
            (this.sensors.fsr2 - this.offset.fsr2) >= FORCESENSORTHRESHOLD || 
            (this.sensors.fsr3 - this.offset.fsr3) >= FORCESENSORTHRESHOLD ) {
            // some one is sitting on the device.
            if (this.sensors.temp0 <= TEMPSENSORTHRESHOLD && this.sensors.temp0 <= TEMPSENSORTHRESHOLD) {
                // I am sure this is a human, start actual timer, stop test timer.
                if (this.testTimerOn && !this.actualTimerOn) {
                    this.setTimerOff(TESTTIMERID)
                    this.actualTimer = this.testTimer
                    this.testTimer = 0
                    this.setTimerOn(ACTUALTIMERID)
                }
            } else {
                // I am not sure if this is a human or object, start test timer.
                if (!this.testTimerOn) {
                    this.setTimerOn(TESTTIMERID)
                }
            }
        } else {
            // nobody is sitting on the device, stop both timers.
            if (this.testTimerOn) {
                this.setTimerOff(TESTTIMERID)
                this.testTimer = 0
            }
            if (this.actualTimerOn) {
                this.setTimerOff(ACTUALTIMERID)
                this.actualTimer = 0
            }
        }
    }

    setTimerOn(id) {
        if (id == TESTTIMERID) {
            this.testTimerOn = true
            this.testInterval = setInterval(() => {
                this.testTimer++
            }, 1000)
        } else if (id == ACTUALTIMERID) {
            this.actualTimerOn = true
            this.actualInterval = setInterval(() => {
                this.actualTimer++
                if (this.actualTimer % 3600 == 0) {
                    // TODO: send message to user
                    // `you have been sitting for ${this.actualTimer / 3600} hour(s), please stand up and walk around for a while`
                }
            }, 1000)
        }
    }

    setTimerOff(id) {
        if (id == TESTTIMERID) {
            this.testTimerOn = false
            clearInterval(this.testInterval)
            this.testInterval = null
        } else if (id == ACTUALTIMERID) {
            this.actualTimerOn = false
            clearInterval(this.testInterval)
            this.testInterval = null
        }
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

    calibrateForceSensors() {
        this.offset = {
            fsr1: this.sensors.fsr1,
            fsr0: this.sensors.fsr0,
            fsr2: this.sensors.fsr2,
            fsr3: this.sensors.fsr3,
        }
    }

    getSensorReading() {
        return {
            fsr0: this.sensors.fsr0 - this.offset.fsr0,
            fsr1: this.sensors.fsr1 - this.offset.fsr1,
            fsr2: this.sensors.fsr2 - this.offset.fsr2,
            fsr3: this.sensors.fsr3 - this.offset.fsr3,
            temp0: this.sensors.temp0,
            temp1: this.sensors.temp1,
        }
    }

    // ['not_sitting', 'upright', 'leaning_backward', 'leaning_forward', 'leaning_sideways', 'one_leg_over_the_other', 'sitting_at_the_front_edge']
    updatePosture() {
        //     if (this.sensors.fsr0 >= 700 && this.sensors.fsr1 >= 700 && this.sensors.fsr2 >= 700 && this.sensors.fsr3 >= 700) {
        //         if (this.posture)
        //         setInterval(() => {
        //             if (this.sensors.fsr0 >= 700 && this.sensors.fsr1 >= 700 && this.sensors.fsr2 >= 700 && this.sensors.fsr3 >= 700) {
        //                 this.posture = 'upright'
        //             }
        //         }, 5 * 1000);
        //     } else if () {
        //     } else if () {
        //     }
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