const CONFIG = require('../../config');
const { InfluxDB, Point } = require('@influxdata/influxdb-client')
const url = `http://localhost:8086`
const org = `APSC200_Team08`
const bucket = `seed_genesis_device_0`

class InfluxClient {
    constructor() {
        this.client = new InfluxDB({ url: url, token: CONFIG.INFLUXDB_TOKEN_WEB })
    }

    getWriteApi() {
        return this.client.getWriteApi(org, bucket, 'ns')
    } // getWriteApi()

    getQueryApi() {
        return this.client.getQueryApi(org)
    } // getQueryApi()
}

module.exports = InfluxClient