const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class SetLink {
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

                    this.subject = msg.content.split(" ")[2];

                    this.stage = 2;
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please respond with the link.**"));
                    return;
                } 
                
                if (msg.content.split(" ").length > 3) {
                    this.link = msg.content.split(" ")[3];
                    

                    this.setIt(msg);
                    this.active = false;
                    return;
                }

                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **To what subject do you want to add a link?**"));
                this.stage = 1;
                break;
            case 1:
                this.subject = msg.content;

                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please respond with the link.**"));
                this.stage = 2;
                break;
            case 2:
                this.link = msg.content;
                this.setIt(msg);
                this.active = false;
        }
    }

    async setIt(msg) {
        const subject = await global.db.get("SELECT * FROM subjects WHERE timetable=? AND LOWER(name) LIKE LOWER(?)", [this.timetable, this.subject]);
        if (!subject) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Subject not found. Command cancelled.**"));
            return;
        }

        if (!validUrl.isWebUri(this.link)) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **That is not a valid link. Command cancelled.**"));
            return;
        }

        const oldLink = await global.db.get("SELECT * FROM links WHERE client=? AND timetable=? AND subject=?", [msg.author.id, this.timetable, subject.name]);
        if (oldLink) {
            global.db.run("DELETE FROM links WHERE client=? AND timetable=? AND subject=?", [msg.author.id, this.timetable, subject.name]);
            msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **Removed old link.**"));
        }

        global.db.run("INSERT INTO links VALUES (?, ?, ?, ?)", [msg.author.id, this.link, this.timetable, subject.name]);
        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Link set.**"));
    }
}