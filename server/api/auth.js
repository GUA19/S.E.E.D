const express = require('express');
const router = express.Router();
var jwtAuthz = require('express-jwt-authz');
var scopeCheck = jwtAuthz(['read:db'], { customUserKey: 'auth' })

router.get('/', async (req, res) => {
    res.send(globalDevice.newWSToken())
    return
})

module.exports = router;