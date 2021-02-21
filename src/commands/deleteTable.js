const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');
const validUrl = require("valid-url");

module.exports = class DeleteTable {
    constructor() {
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                const allTables = await global.db.all("SELECT * FROM timetables WHERE owner=?", [msg.author.id]);
                if (!allTables) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable's found! Looks like you don't have any.**"));
                    this.active = false;
                    return;
                }
                if (msg.content.split(" ").length > 2) {
                    this.name = msg.content.split(" ")[2];
                    if (this.confirm(msg)) {
                        this.active = false;
                    }
                    this.stage = 1;
                } else {
                    let embed = new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **What timetable do you want to delete?**");
                    let listOfAll = "";
                    allTables.forEach(row => {
                        listOfAll += row.name + "\n";
                    });
                    embed.addField("List of all your timetables:", listOfAll);
                    msg.channel.send(embed);
                    this.stage = 1;
                }
                break;
            case 1:
                this.name = msg.content;
                if (this.confirm(msg)) {
                    this.active = false;
                }
                break;
        }
    }

    async deleteTable(msg, timetable) {
        global.db.run("DELETE FROM timetables WHERE id=?", [timetable.id]);
        setActiveTimeTable(msg.author.id, "", null)
        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Deleted table.**"));
        return true;
    }

    async confirm(msg) {
        const timetable = await global.db.get("SELECT * FROM timetables WHERE LOWER (name) LIKE LOWER (?) AND owner = ?", [this.name, msg.author.id]);
        if (!timetable) {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Table not found, please try again. Use `cancel` to cancel.**"));
            return false;
        }
        else {
            const message = await msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **Are you sure?**"))
            await message.react("✅");
            await message.react("🟥");
            message.awaitReactions(() => true, { max: 1, time: 60000 })
                .then(collected => {
                    if (collected.first().emoji.name == "✅") this.deleteTable(msg, timetable);
                    else msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **Action has been cancelled.**"));
                    message.delete();
                });
        }
    }
}