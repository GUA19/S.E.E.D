const express = require('express');
const router = express.Router();
var jwtAuthz = require('express-jwt-authz');
var scopeCheck = jwtAuthz(['read:db'], { customUserKey: 'auth' })

// TODO: delete this api
router.get('/', scopeCheck, async (req, res) => {
    if ('component' in req.query) {
        let returnVal = 0
        const queryApi = globalInfluxClient.getQueryApi()
        let fluxQuery = `from(bucket: "seed_genesis_device_0")
        |> range(start: -1m)
        |> filter(fn: (r) => r._measurement == "sensors_reading")
        |> filter(fn: (r) => r["_field"] == "${req.query.component}")
        |> last()`

        queryApi.queryRows(fluxQuery, {
            next: (row, tableMeta) => {
                const tableObject = tableMeta.toObject(row)
                returnVal = tableObject._value
            },
            error: (error) => {
                res.status(400).send(error)
            },
            complete: () => {
                res.status(200).send(returnVal.toString())
            },
        })
    } else {
        res.status(400).send('Please provide valid parames :(')
    }
    return
})

router.post('/', async (req, res) => {
    let result0 = false
    let result1 = false
    if ('fsr0' in req.body && 'fsr1' in req.body && 'fsr2' in req.body && 'fsr3' in req.body) {
        result0 = globalDevice.updateForceSensorReading(req.body.fsr0, req.body.fsr1, req.body.fsr2, req.body.fsr3)
    }
    if ('temp0' in req.body && 'temp1' in req.body) {
        result1 = globalDevice.updateTemperatureSensorReading(req.body.temp0, req.body.temp1)
    }
    if (!result0 && !result1) {
        res.status(400).send('Date written failed, please check your parames.');
    } else if (result0 && result1) {
        res.status(200).send('Force & temperature sensor data successfully written!');
    } else if (result0) {
        res.status(200).send('Force sensor data successfully written!');
    } else {
        res.status(200).send('Temperature sensor data successfully written!');
    }
    return
})

module.exports = router;