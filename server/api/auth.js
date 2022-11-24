const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.send(globalDevice.newWSToken())
    return
})

module.exports = router;