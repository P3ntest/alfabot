const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class ImportCmd {
    constructor(db) {
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        this.client = msg.author.id;
        switch (this.stage) {
            case 0:
                if (msg.content.split(" ").length > 1) {
                    this.code = msg.content.split(" ")[1];
                    this.import(msg);
                    this.active = false;
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **Please respond with the import code.**"));
                    this.stage = 1;
                }
                break;
            case 1:
                this.code = msg.content;
                this.import(msg);
                this.active = false;
                break;
        }
    }

    async import(msg) {
        const code = this.code.trim().toLowerCase();

        const db = global.db;

        const table = await db.get("SELECT * FROM timetables WHERE LOWER(id) LIKE LOWER(?)", [code]);
        
        if (table) {
            
            const newId = getNewId();
            db.run("INSERT INTO timetables VALUES (?, ?, ?)", [this.client, newId, table.name]);

            const subjects = await db.all("SELECT * FROM subjects WHERE timetable=?", [table.id]);
            subjects.forEach(subject => {
                db.run("INSERT INTO subjects VALUES (?, ?)", [newId, subject.name]);
            });

            const entries = await db.all("SELECT * FROM timeentry WHERE timetable=?", [table.id]);
            entries.forEach(entry => {
                db.run("INSERT INTO timeentry VALUES (?, ?, ?, ?)", [entry.hour, entry.day, entry.subject, newId]);
            });

            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Duplicated table `" + table.name + "`**"));

            setActiveTimeTable(this.client, newId, global.db);
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Switched to new table**"));


        } else {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Invalid code.**"));
        }
    }
}