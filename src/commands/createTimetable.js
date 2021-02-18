const { getActiveTimetable, canEdit,setActiveTimeTable, getNewId } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class CreateTimeTable {
    constructor(db) {
        this.db = db;
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                if (msg.content.split(" ").length > 2) {

                    this.name = msg.content.split(" ")[2];

                    this.add(msg.author.id, msg);

                    this.active = false;
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question: **What should the table be called?**"));
                    this.stage = 1;
                }
                break;
            case 1:
                this.name = msg.content;

                this.add(msg.author.id, msg);

                this.active = false;
                break;
        }
    }

    async add(client, msg) {
        msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(`:white_check_mark: **Created timetable ${this.name}.**`));
        const id = getNewId();
        this.db.run("INSERT INTO timetables VALUES (?, ?, ?)", [client, id, this.name]);
            setActiveTimeTable(msg.author.id, id, this.db);
                    
    }
}