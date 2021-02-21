const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class StartStopCmd {
    constructor() {
        this.active = false;
    }
    async recieve(msg) {
        if (msg.content.toLowerCase().trim() == "start") {
            global.db.run("UPDATE clients SET active=true WHERE discordId=?", [msg.author.id]);
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **You will be notified with classes.**"));
        } else if (msg.content.toLowerCase().trim() == "stop") {
            global.db.run("UPDATE clients SET active=false WHERE discordId=?", [msg.author.id]);
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **You will no longer recieve notifications.**"));
        }
    }
}