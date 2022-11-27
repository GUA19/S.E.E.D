const axios = require('axios');
const CONFIG = require('../../../config');
const defaultParams = {
    sound: "choo",
    level: 'timeSensitive'
}

class BarkPusher {
    static async pushNotificationToAll(title, msg, sound) {
        for (let id of CONFIG.barkIds) {
            this.pushNotification(id, title, msg, sound)
        }
    }

    static async pushNotification(id, title, msg, sound) {
        let params = defaultParams
        if (sound) {
            params.sound = sound
        }
        try {
            await axios.get(CONFIG.url + id + '/' + title + '/' + msg, { params: params }, { timeout: 20000 });
        } catch (err) {
            console.log(err);
            console.log('Axios Request ERROR - timeout');
        }
    }
}

module.exports = BarkPusher