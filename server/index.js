const express = require('express')
const path = require("path");
const bodyParser = require('body-parser');
const app = express()
const port = 80

app.use(express.static(path.join(__dirname, "/public")))

// body parser for application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
})

app.get('/test', async (req, res) => {
    res.send('HI')
    return
})

app.post('/test', async (req, res) => {
    console.log("fsr0:", req.body.fsr0, " fsr1", req.body.fsr1, " fsr2", req.body.fsr2, " fsr3", req.body.fsr3, " tmp", req.body.temp);
    res.status(200).send();
    return
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})