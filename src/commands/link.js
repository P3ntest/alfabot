const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class GetLink {
    constructor() {
        this.active = false;
    }
    async recieve(msg) {
        const timetable = await getActiveTimetable(msg.author.id, this.db);
        if (timetable == null) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TABLE` to create one.**"));
            return;
        }
        this.timetable = timetable;
        if (msg.content.split(" ").length == 2) {

            this.subject = msg.content.split(" ")[1];

            const subject = await global.db.get("SELECT * FROM subjects WHERE timetable=? AND LOWER(name) LIKE LOWER(?)", [this.timetable, this.subject]);
            if (!subject) {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Subject not found.**"));
                return;
            } else {
                const link = await global.db.get("SELECT * FROM links WHERE timetable=? AND LOWER(subject) LIKE LOWER(?) AND client=?", [this.timetable, this.subject, msg.author.id]);
                if (link && link.link) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(`:information_source: **Link: ${link.link}**`));
                } else  {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(`:information_source: **No link set for this subject. Use \`SET LINK\` to set one.**`));
                }
                
            }
            return;
        } else {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Invalid syntax: `LINK <subject>`**"));

        }
    }
}