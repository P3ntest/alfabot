const { getActiveTimetable, canEdit, setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class ListTables {
    constructor() {
        this.active = false;
    }
    async recieve(msg) {
        const allTables = await global.db.all("SELECT * FROM timetables WHERE owner=?", [msg.author.id]);
        let listOfAll = "";
        allTables.forEach(row => {
            listOfAll += row.name + "\n";
        });
        if (listOfAll != "") {
            let embed = new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **List of all subjects: **")
            embed.addField("\u200b", listOfAll);
            msg.channel.send(embed);
        } else {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetables found. Use `CREATE TABLE` to create one. Or `IMPORT` to import one.**"));
        }
    }
}