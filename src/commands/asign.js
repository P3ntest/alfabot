const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class Asign {
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
                } else {
                    if (!(await canEdit(msg.author.id, timetable, this.db))) {
                        msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **You dont have the permission to edit this table.**"));
                        this.active = false;
                        return;
                    }
                }
                this.timetable = timetable;
                this.stage = 1;
                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **What subject do you want to asign?**"));
                return;
            case 1:
                const subject = msg.content.trim();
                const subjectActual = await this.db.get("SELECT * FROM subjects WHERE timetable=? AND LOWER(name) LIKE LOWER(?)", [this.timetable, subject]);
                if (!subjectActual) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Subject not found, please try again. (Use `cancel` to cancel)**"));
                    return;
                } else {
                    this.stage = 2;
                    this.subject = subjectActual.name;
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **To what day do you want to asign this subject?**"));

                }
                return;
            case 2:
                var day = -1;
                var disp; 
                const clientInputDay = msg.content.trim();
                require("../times.json").days.forEach(dayI => {
                    if (dayI.names.includes(clientInputDay.toLocaleLowerCase())) {
                        day = dayI.id;
                        disp = dayI.displayName;
                    }
                });
                if (day != -1) {
                    this.stage = 3;
                    this.day = day;
                    this.displayDay = disp;
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **What hour do you want this subject to be on? (1-11)**"));
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Invalid day. Examples: Mon, Monday, 1**"));
                    return;
                }
                return;
                case 3:

                const hour = parseInt(msg.content.trim());
                if (hour != NaN && hour < 12 && hour > 0) {
                    this.hour = hour;

                    const existing = await this.db.get("SELECT * FROM timeentry WHERE hour=? AND day=? AND timetable=?", [this.hour, this.day, this.timetable]);
                    if (existing) {
                        await this.db.run("DELETE FROM timeentry WHERE hour=? AND day=? AND timetable=?", [this.hour, this.day, this.timetable]);
                        msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **Removed old subject.**"));
                    }
                    msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(`:white_check_mark: **Asigned ${this.subject} to the ${this.hour}nth hour on ${this.displayDay}**`));
                    await this.db.run("INSERT INTO timeentry VALUES (?, ?, ?, ?)", [this.hour, this.day, this.subject, this.timetable]);
                    

                    this.active = false;
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Invlid hour, use 1-11. Type `cancel` to cancel.**"));
                    return;
                }
                return;
        }
    }
}