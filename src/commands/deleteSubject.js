const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class DeleteSubject {
    constructor() {
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                this.activeTable = await global.db.get("SELECT timetable FROM activeTable WHERE client=?", [msg.author.id]);    
                const allSubjects = await global.db.all("SELECT * FROM subjects WHERE timetable=?", [this.activeTable.timetable]);
                if (allSubjects.length < 1) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No subjects found! Looks like you don't have any.**"));
                    this.active = false;
                    return;
                }
                if (msg.content.split(" ").length > 2) {
                    this.name = msg.content.split(" ")[2];
                    if(this.confirm(msg)) {
                        this.active = false;
                    }
                    this.stage = 1;
                } else {
                    let embed = new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **What subject do you want to delete?**");
                    let listOfAll = "";
                    allSubjects.forEach(row => {
                        listOfAll += row.name + "\n";
                    });
                    embed.addField("List of all your subjects:", listOfAll);
                    msg.channel.send(embed);
                    this.stage = 1;
                }
                break;
            case 1:
                this.name = msg.content;
                if(this.confirm(msg)) {
                    this.active = false;
                }
                break;
        }
    }

    async deleteSubject(msg, subject) {
        global.db.run("DELETE FROM subjects WHERE name=?", [subject.name]);
        global.db.run("DELETE FROM links WHERE links.subject=? AND links.client=? AND links.timetable=?", [subject.name, msg.author.id, this.activeTable.timetable]);
        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Deleted subject.**"));
        return true;
    }

    async confirm(msg) {
        const subject = await global.db.get("SELECT * FROM subjects WHERE LOWER (name) LIKE LOWER (?) AND timetable = ?", [this.name, this.activeTable.timetable]);
        if(!subject) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Subject not found, please try again. Use `cancel` to cancel.**"));
            return false;
        }
        else {
            const message = await msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Are you sure?**"))
            await message.react("✅");
            await message.react("🟥");
            message.awaitReactions(() => true, {max: 1, time: 60000})
            .then(collected => {
                if (collected.first().emoji.name == "✅") this.deleteSubject(msg, subject);
                else  msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **Action has been cancelled.**"));
                message.delete();
            });
        }
    }
}