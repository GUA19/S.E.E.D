const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.send('report goes here')
    return
})

module.exports = router;