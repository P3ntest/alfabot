const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class MotdAdminCommand {
    constructor() {
        this.active = false;
    }
    async recieve(msg) {
        const allArgs = msg.content.split(" ");

        if (allArgs.length == 1) {
            msg.react("⚠️");
            return;
        } else {
            const type = allArgs[1];
            var status = "";

            for (let i = 2; i < allArgs.length; i++) {
                status += allArgs[i] + " ";
            }

            global.client.user.setActivity(status, {type: type.toUpperCase()});
            msg.react("👍");
        }

        

    }
}