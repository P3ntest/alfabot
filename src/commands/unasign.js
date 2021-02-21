const { getActiveTimetable, canEdit, getNumberApprending } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class UnAsign {
    constructor() {
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                const timetable = await getActiveTimetable(msg.author.id, null);
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
                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **Of what day do you want to remove a subject?**"));
                return;
            case 1:
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
                    this.stage = 2;
                    this.day = day;
                    this.displayDay = disp;
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **What hour do you want to unasign?**"));
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Invalid day. Examples: Mon, Monday, 1**"));
                    return;
                }

                return;
            case 2:
                const hour = parseInt(msg.content.trim());
                if (hour != NaN && hour < 12 && hour > 0) {
                    this.hour = hour;

                    await global.db.run("DELETE FROM timeentry WHERE timetable=? AND day=? AND hour=?", [this.timetable, this.day, this.hour]);
                    msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(`:white_check_mark: **Unasign the ${this.hour}${getNumberApprending(this.hour)} hour on ${this.displayDay}**`));


                    this.active = false;
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Invlid hour, use 1-11. Type `cancel` to cancel.**"));
                    return;
                }
                return;


        }
    }
}