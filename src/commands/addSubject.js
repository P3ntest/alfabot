const {
    getActiveTimetable,
    canEdit,
    setActiveTimeTable,
    getNewId
} = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = {
    name: 'addSubject',
    aliases: ["add Subject", "create Subject"],
    async execute(msg, db, args) {
        let active = true;
        let stage = 0;
        switch (stage) {
            case 0:
                const timetable = await getActiveTimetable(msg.author.id, db);
                if (timetable == null) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TABLE` to create one.**"));
                    active = false;
                    return;
                } else {
                    if (!(await canEdit(msg.author.id, timetable, db))) {
                        msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **You dont have the permission to edit this table.**"));
                        active = false;
                        return;
                    }
                }
                this.timetable = timetable;
                if (msg.content.split(" ").length > 2) {

                    this.name = msg.content.split(" ")[2];

                    stage = 2;
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please enter the link for that subject. Use `none` to set the link later.**"));
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **What should the subject be called?**"));
                    stage = 1;
                }
                break;
            case 1:
                this.name = msg.content;

                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Please enter the link for that subject. Use `none` to set the link later.**"));
                stage = 2;
                break;
            case 2:
                var link = msg.content.trim();
                if (link.trim().toLowerCase() == "none") {
                    link = "";
                } else {
                    if (!validUrl.isWebUri(link)) {
                        msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **That is not a valid link, please try again. Use `cancel` to cancel.**"));
                        return;
                    }
                }

                const exists = await db.get("SELECT * FROM subjects WHERE timetable=? AND LOWER(name) LIKE LOWER(?)", [this.timetable, this.name]);
                if (exists) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Subject already exists.**"));
                } else {
                    db.run("INSERT INTO subjects VALUES (?, ?)", [this.timetable, this.name]);
                    msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(`:white_check_mark: **Created subject ${this.name}.**`));
                    if (link != "") {
                        db.run("INSERT INTO links VALUES (?, ?, ?, ?)", [msg.author.id, link, this.timetable, this.name]);
                        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(`:white_check_mark: **Set link to ${link}**`));

                    }
                }
                active = false;
                break;
        }
    }
};