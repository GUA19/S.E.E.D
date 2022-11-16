const express = require('express')
const path = require("path");
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, "/public")))

app.get('/', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
})

app.get('/test', async (req, res) => {
    res.send('HI')
    return
})

app.post('/test', async (req, res) => {
    console.log(req.body.data)
    res.status(200).send();
    return
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})