const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class ExportCmd {
    constructor(db) {
        this.db = db;
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        
            const timetable = await getActiveTimetable(msg.author.id, this.db);
            if (timetable == null) {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TABLE` to create one.**"));
                this.active = false;
                return;
            }
            this.timetable = timetable;
            msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **This table's export code: `" + timetable + "`**"));
    }

    async rename(msg) {
        global.db.run("UPDATE timetables SET name=? WHERE id=?", [this.name, this.timetable]);
        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Renamed table.**"));
    }
}