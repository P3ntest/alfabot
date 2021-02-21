const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');
const Table = require("../utils/table");

module.exports = class InfoCmd {
    constructor() {
        this.active = false;
        this.stage = 0;
    }
    async recieve(msg) {
        const embed = new Discord.MessageEmbed();


                const response = await global.db.get("SELECT timetable FROM activeTable WHERE client=?", [msg.author.id]);
                if (!response) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TIMETABLE <name>` to create one.**"));
                    return;
                }
                const { timetable: activeTable } = response;
                if (activeTable) {
                    const tableId = activeTable;
                    const tableInfo = await global.db.get("SELECT * FROM timetables WHERE id=?", [tableId])
                    const tableName = tableInfo.name;

                    const subjects = await global.db.all("SELECT * FROM subjects WHERE timetable=?", [tableId]);
                    const links = await global.db.all("SELECT * FROM links WHERE timetable=? AND client=?", [tableId, msg.author.id]);

                    if (!subjects) subjects = [];
                    if (!links) links = [];


                    embed.setColor("#5cd1ff").setTitle(`Information about *${tableName}*`).setDescription(":notepad_spiral: **" + tableName + "** is currently selected. Use `SWITCH` to change tables.");

                    embed.addField("\u200b", "\u200b");

                    embed.addField("Export Code", `:globe_with_meridians: \`${tableId}\``, true);
                    embed.addField("Subjects", ":notebook_with_decorative_cover: " + subjects.length, true);
                    embed.addField("Links", ":link: " + links.length, true);

                    if (subjects.length > 0) {
                        embed.addField("\u200b", "\u200b");
                        var subjectsString = "";
                        subjects.forEach(subject => {

                            let link = undefined;

                            links.forEach(iLink => {
                                if (iLink.subject == subject.name) {
                                    link = iLink;
                                }
                            });

                            subjectsString += "`" + subject.name + "`";

                            if (link) {
                                subjectsString += " **-** " + link.link;
                            }

                            subjectsString += "\n";
                        });
                        embed.addField("List of all subjects", subjectsString);
                    }

                    embed.addField("\u200b", "\u200b");

                    const table = new Table();
                    table.addRow(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

                    var rows = [];

                    for (let row = 1; row < 12; row++) {
                        const currentRow = [];
                        for (let day = 1; day < 6; day++) {
                            const entry = await global.global.db.get("SELECT subject FROM timeentry WHERE hour=? AND day=? AND timetable=?", [row, day, tableId]);
                            if (entry) {
                                currentRow.push(entry.subject);
                            } else {
                                currentRow.push("");
                            }

                        }
                        rows.push(currentRow);
                    }

                    var lastDay = 0;
                    var currDay = 0;
                    rows.forEach(row => {
                        currDay++;
                        let contains = false;
                        row.forEach(el => {
                            if (el && el != "") {
                                contains = true;
                            }
                        });
                        if (contains) {
                            lastDay = currDay;
                        }
                    });

                    if (lastDay < 6) lastDay = 6;

                    for (let row = 0; row < lastDay; row++) {
                        table.addRow(rows[row]);
                    }

                    const tableString = table.toString();

                    if (tableString.length > 1024) {
                        embed.addField("Timetable", "\u200b");
                        msg.channel.send(embed);
                        msg.channel.send(tableString);
                    } else {
                        embed.addField("Timetable", tableString);
                        msg.channel.send(embed);
                    }


                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TIMETABLE <name>` to create one.**"));
                }
    }
}