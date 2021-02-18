const { getActiveTimetable, canEdit,setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class UseTable {
    constructor(db) {
        this.db = db;
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                if (msg.content.split(" ").length > 1) {

                    this.name = msg.content.split(" ")[1];

                    this.add(msg.author.id, msg);

                    this.active = false;
                } else {
                    const allTables = await this.db.all("SELECT * FROM timetables WHERE owner=?", [msg.author.id]);
                    let embed = new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **What timetable do you want to use?**");
                    let listOfAll = "";
                    allTables.forEach(row => {
                        listOfAll += row.name + "\n";
                    });
                    if (listOfAll != "") {
                        embed.addField("List of all your timetables:", listOfAll);
                        msg.channel.send(embed);
                        this.stage = 1;
                    } else {
                        msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetables found. Use `CREATE TABLE` to create one. Or `IMPORT` to import one.**"));
                        this.active = false;
                    }
                        
                    
                }
                break;
            case 1:
                this.name = msg.content.trim();

                if (msg.content.startsWith("use")) {
                    this.name = msg.content.substr(4).trim();
                }
                if (msg.content.startsWith("switch")) {
                    this.name = msg.content.substr(7).trim();
                }

                if ((await this.add(msg.author.id, msg))) {
                    this.active = false;

                }
                break;
                
        }
    }

    async add(client, msg) {
        const doesExist = await this.db.get("SELECT * FROM timetables WHERE owner=? AND LOWER(name) LIKE LOWER(?)", [msg.author.id, this.name]);

        if (doesExist) {
            setActiveTimeTable(msg.author.id, doesExist.id, this.db);
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(`:white_check_mark: **Switched to timetable ${this.name}.**`));
            return true;
        } else  {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Table not found, please try again. Use `cancel` to cancel.**"));
            return false;
        }
                    
    }
}