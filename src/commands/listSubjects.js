const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class ListSubjectsCmd {
    constructor() {
        this.active = false;
    }
    async recieve(msg) {

        const embed = new Discord.MessageEmbed();

        const tableId = await global.db.get("SELECT timetable FROM activeTable WHERE client=?", [msg.author.id]);

        if (tableId) {
            const subjects = await global.db.all("SELECT * FROM subjects WHERE timetable=?", [tableId.timetable]);
            const links = await global.db.all("SELECT * FROM links WHERE timetable=? AND client=?", [tableId.timetable, msg.author.id]);

            console.log(tableId)
            if (subjects.length > 0) {
                embed.addField("\u200b", "\u200b");
                var subjectsString = "";
                var subjectStrings = [];
                for (let i = 0; i < subjects.length; i++) {
                    const subject = subjects[i];

                    let addedLenght = 11;
                    let link = undefined;

                    links.forEach(iLink => {
                        if (iLink.subject == subject.name) {
                            link = iLink;
                        }
                    });

                    subjectsString += "`" + subject.name + "`";

                    addedLenght += subject.name.length + link.link.length;

                    if (link) {
                        subjectsString += " **-** " + link.link;
                    }

                    subjectsString += "\n";
                
                    if (subjectsString.length >= 1024) {
                        subjectStrings.push(subjectsString.substr(0, subjectsString.length-addedLenght));
                        subjectsString = "";
                        i -= 1;
                    }
                    
                }
                
                subjectStrings.push(subjectsString);

                if (subjectStrings.length > 1) {
                    embed.addField("List of all subjects", subjectStrings[0]);
                    for (let i = 1; i < subjectStrings.length; i++) {
                        embed.addField("\u200b", subjectStrings[i]);
                    }
                } else {
                    embed.addField("List of all subjects", subjectsString);
                }

                msg.channel.send(embed);
            } else {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **You dont have any subjects.**"));
            }

        } else {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **You dont have an active table.**"));
        }
    }
}