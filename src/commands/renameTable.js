const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class RenameTable {
    constructor(db) {
        this.db = db;
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                const timetable = await getActiveTimetable(msg.author.id, this.db);
                if (timetable == null) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TABLE` to create one.**"));
                    this.active = false;
                    return;
                }
                this.timetable = timetable;
                if (msg.content.split(" ").length > 2) {

                    this.name = msg.content.split(" ")[2];

                    this.renameTable(msg);
                    this.active = false;
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please respond with the new name.**"));
                    this.stage = 1;
                }
                break;
            case 1:
                this.name = msg.content;

                this.renameTable(msg);
                this.active = false;
                break;
        }
    }

    async renameTable(msg) {
        const existing = await global.db.get("SELECT id FROM timetables WHERE owner=? AND LOWER(name) LIKE LOWER(?)", [msg.author.id, this.name]);
        if (existing) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **A table with the same name already exists.**"));
            return;
        }
        global.db.run("UPDATE timetables SET name=? WHERE id=?", [this.name, this.timetable]);
        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Renamed table.**"));
    }
}