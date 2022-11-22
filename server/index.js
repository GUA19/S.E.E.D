const express = require('express')
const path = require("path");
const bodyParser = require('body-parser');
const app = express()
const port = 80

const { Point } = require('@influxdata/influxdb-client')
const InfluxClient = require('./influxdb');
global.globalInfluxClient = new InfluxClient();

app.use(express.static(path.join(__dirname, "/public")))

// body parser for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
})

app.get('/sensor_reading', async (req, res) => {
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

app.post('/sensor_reading', async (req, res) => {
    const writeApi = globalInfluxClient.getWriteApi()
    if ('fsr0' in req.body && 'fsr1' in req.body && 'fsr2' in req.body && 'fsr3' in req.body) {
        let point = new Point('sensors_reading')
            .tag('force_sensor', 'GHF-10')
            .intField('fsr0', parseFloat(req.body.fsr0))
            .intField('fsr1', parseFloat(req.body.fsr1))
            .intField('fsr2', parseFloat(req.body.fsr2))
            .intField('fsr3', parseFloat(req.body.fsr3))
        writeApi.writePoint(point)
    }
    if ('temp0' in req.body && 'temp1' in req.body) {
        let point = new Point('sensors_reading')
            .tag('temperature_sensor', 'TMP36')
            .intField('temp0', parseFloat(req.body.temp0))
            .intField('temp1', parseFloat(req.body.temp1))
        writeApi.writePoint(point)
    }
    void setTimeout(() => {
        writeApi.flush()
    }, 5000)
    res.status(200).send('Data Successfully Written');
    return
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})