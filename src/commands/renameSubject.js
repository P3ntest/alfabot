const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class RenameSubject {
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

                    this.renameSubject(msg);
                    this.active = false;
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please respond with the name of the subject you want to rename.**"));
                    this.stage = 1;
                }
                break;
            case 1:
                this.name = msg.content;

                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please respond with the new name.**"));
                this.stage = 2;
                break;
            case 2:
            this.newname = msg.content;

            this.renameSubject(msg);
            this.active = false;
            break;
        }
    }

    async renameSubject(msg) {
        const exists = await this.db.get("SELECT * FROM subjects WHERE timetable=? AND LOWER(name) LIKE LOWER(?)", [this.timetable, this.newname]);
        if (exists) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **A subject with that name already exists.**"));
        } else {
            global.db.get("SELECT name FROM subjects WHERE timetable=?", [this.timetable]);
            global.db.run("UPDATE subjects SET name=? WHERE timetable=? AND name=?", [this.newname, this.timetable, this.name]);
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Renamed subject.**"));
        }
    }
}