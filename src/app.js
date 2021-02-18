const Discord = require('discord.js');
const client = new Discord.Client();
const { v4: uuidv4 } = require('uuid');

const secret = require("../secret.json");

const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite");

// let tempDb = new sqlite3.Database("./info.db", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => { });
// tempDb.close();
var db;
(async () => {
    db = await open({
        filename: './info.db',
        driver: sqlite3.Database
    })

    db.run("CREATE TABLE IF NOT EXISTS timetables (owner TEXT, id TEXT, name TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS subjects (timetable TEXT, name TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS links (client TEXT, link TEXT, timetable TEXT, subject TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS timeentry (hour TEXT, day TEXT, subject TEXT, timetable TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS activeTable (client TEXT, timetable TEXT)");
})()



const times = require("./times.json");
const asign = require('./commands/asign');
const Asign = require('./commands/asign');



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("ur schools stuff", { type: "WATCHING" })
});

const currentCommands = {};

client.on('message', async msg => {
    if (msg.channel.type == "dm") {
        if (msg.content.trim() == "cancel") {
            currentCommands[msg.author.id] = undefined;
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Command cancelled.**"));
        } else if (currentCommands[msg.author.id] && currentCommands[msg.author.id].active) {
            currentCommands[msg.author.id].recieve(msg);
        } else {
            if (msg.content.trim().toLowerCase().startsWith("asign")) {
                currentCommands[msg.author.id] = new Asign(db);
                currentCommands[msg.author.id].recieve(msg);
            }
        }
        if (msg.content.toLowerCase().startsWith("create timetable")) {
            if (msg.content.trim().split(" ").length != 3) {
                msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **CREATE TIMETABLE <name>**"));
            } else {
                const name = msg.content.trim().split(" ")[2];
                const id = getNewId()
                db.run("INSERT INTO timetables VALUES (?, ?, ?)", [msg.author.id, id, name]);
                setActiveTimeTable(msg.author.id, id);
                msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Timetable created and set as main. (`USE <timetable>` to change)**"));
            }
        } else if (msg.content.toLowerCase().startsWith("use")) {
            if (msg.content.trim().split(" ").length != 2) {
                msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **USE <timetable>**"));
            } else {
                const name = msg.content.trim().split(" ")[1];
                const row = await db.get("SELECT id FROM timetables WHERE owner=? AND LOWER(name) LIKE LOWER(?)", [msg.author.id, name]);
                if (row) {
                    setActiveTimeTable(msg.author.id, row.id);
                    msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Timetable set as main.**"));
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Timetable not found. Use `CREATE TIMETABLE <name>` to create one.**"));
                }
            }
        } else if (msg.content.toLowerCase().startsWith("info")) {
            const embed = new Discord.MessageEmbed();


            const { timetable: activeTable } = await db.get("SELECT timetable FROM activeTable WHERE client=?", [msg.author.id])
            if (activeTable) {
                const tableId = activeTable;
                const tableInfo = await db.get("SELECT * FROM timetables WHERE id=?", [tableId])
                const tableName = tableInfo.name;


                embed.setColor("#5cd1ff").setTitle("Selected timetable information.").setDescription("This is the information about your currently selected timetable.");
                embed.setFooter("Created by P3ntest#3515", "https://cdn.discordapp.com/avatars/357871005093462019/a9232e8e06016a5b52595f539dc6e896.png?size=128");
                embed.addField("Name", tableName, true);
                embed.addField("Subjects", 0, true);
                embed.addField("Other", 0, true);

                msg.channel.send(embed);
            } else {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TIMETABLE <name>` to create one.**"));
            }
        } else if (msg.content.toLowerCase().startsWith("add subject")) {
            var timetable = await getActiveTimetable(msg.author.id);
            if (timetable == undefined) {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TIMETABLE <name>` to create one.**"));
            } else {
                if (!canEdit(msg.author.id, timetable)) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **You dont have the permission to edit this table.**"));
                } else {
                    if (msg.content.trim().split(" ").length != 3) {
                        msg.channel.send(new Discord.MessageEmbed().setColor("#f5b042").setDescription(":information_source: **ADD SUBJECT <name>**"));
                    } else {
                        const name = msg.content.trim().split(" ")[2];
                        const exists = await db.get("SELECT * FROM subjects WHERE timetable=? AND LOWER(name) LIKE LOWER(?)", [timetable, name]);
                        if (exists) {
                            msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Subject already exists.**"));
                        } else {
                            db.run("INSERT INTO subjects VALUES (?, ?)", [timetable, name]);
                            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Subject added.**"));
                        }
                    }
                }
            }
            
        }
    }

});

async function getActiveTimetable(client) {
    let result = await db.get("SELECT * FROM activeTable WHERE client=?", [client]);
    if (!result) {
        return undefined;
    } else {
        return result.timetable;
    }
}

async function canEdit(client, timetable) {
    return (await db.get("SELECT * FROM timetables WHERE owner=? AND id=?", [client, timetable])) ? true : false;
}

async function setActiveTimeTable(client, table) {
    await db.run("DELETE FROM activeTable WHERE client=?", [client]);
    db.run("INSERT INTO activeTable VALUES (?, ?)", [client, table]);
}

function getNewId() {
    return uuidv4().substr(0, 8);
}

client.login(secret.discord.secret);