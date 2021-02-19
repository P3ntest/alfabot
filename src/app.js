const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');
const Table = require("./utils/table");
const secret = require("../secret.json");

const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite");

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
    db.run("CREATE TABLE IF NOT EXISTS clients (discordId TEXT)");
})()



const times = require("./times.json");

const UseTable = require('./commands/useTable');
const Asign = require('./commands/asign');
const CreateTimeTable = require('./commands/createTimetable');
const AddSubject = require('./commands/addSubject');
const Feedback = require('./commands/feedback');



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("ur schools stuff", { type: "WATCHING" })
    //doCronJob(1);
    global.client = client;
});

const currentCommands = {};

async function checkFirstMessage(discordId) {

    const row = await db.get("SELECT * FROM clients WHERE discordId=?", [discordId]);
    if (!row) {
        db.run("INSERT INTO clients VALUES (?)", [discordId]);
        return true;
    }

    return false;
}

client.on('message', async msg => {
    if (msg.channel.type == "dm" && !msg.author.bot) {
        if (await checkFirstMessage(msg.author.id)) {
            msg.channel.send(`<@${msg.author.id}> welcome to AlfaBot! Here is our help page to get you started:`, getHelpEmbed());
            return;
        }
        if (msg.content.trim() == "cancel") {
            currentCommands[msg.author.id] = undefined;
            msg.channel.send(new Discord.MessageEmbed().setColor("#42f554").setDescription(":white_check_mark: **Command cancelled.**"));
        } else if (currentCommands[msg.author.id] && currentCommands[msg.author.id].active) {
            currentCommands[msg.author.id].recieve(msg);
        } else {
            if (msg.content.trim().toLowerCase().startsWith("asign")) {
                currentCommands[msg.author.id] = new Asign(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("create table")
                || msg.content.trim().toLowerCase().startsWith("add table")
                || msg.content.trim().toLowerCase().startsWith("create timetable")
                || msg.content.trim().toLowerCase().startsWith("add timetable")) {
                currentCommands[msg.author.id] = new CreateTimeTable(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("use")
                || msg.content.trim().toLowerCase().startsWith("switch")) {
                currentCommands[msg.author.id] = new UseTable(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("add subject")
                || msg.content.trim().toLowerCase().startsWith("create subject")) {
                currentCommands[msg.author.id] = new AddSubject(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("feedback")
                || msg.content.trim().toLowerCase().startsWith("review")
                || msg.content.trim().toLowerCase().startsWith("support")) {
                currentCommands[msg.author.id] = new Feedback(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.toLowerCase().startsWith("info")) {
                const embed = new Discord.MessageEmbed();


                const response = await db.get("SELECT timetable FROM activeTable WHERE client=?", [msg.author.id]);
                if (!response) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TIMETABLE <name>` to create one.**"));
                    return;
                }
                const { timetable: activeTable } = response;
                if (activeTable) {
                    const tableId = activeTable;
                    const tableInfo = await db.get("SELECT * FROM timetables WHERE id=?", [tableId])
                    const tableName = tableInfo.name;


                    embed.setColor("#5cd1ff").setTitle("Selected timetable information.").setDescription("This is the information about your currently selected timetable.");
                    embed.addField("Name", tableName, true);

                    const table = new Table();
                    table.addRow(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

                    var rows = [];

                    for (let row = 1; row < 12; row++) {
                        const currentRow = [];
                        for (let day = 1; day < 6; day++) {
                            const entry = await db.get("SELECT subject FROM timeentry WHERE hour=? AND day=? AND timetable=?", [row, day, tableId]);
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
                        msg.channel.send(embed);
                        msg.channel.send(tableString);
                    } else {
                        embed.addField("Table", tableString);
                        msg.channel.send(embed);
                    }
                
                    
                } else {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **No timetable set. Use `CREATE TIMETABLE <name>` to create one.**"));
                }
            } else if (msg.content.toLowerCase().includes("help")) {
                msg.channel.send(getHelpEmbed());
            } else {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Command not found. Use `HELP` for help.**"));

            }
        }
    }

});

function getHelpEmbed() {
    const embed = new Discord.MessageEmbed().setColor("#f5b042").setTimestamp().setTitle("AlfaBot's Help Page")
        .setDescription("This is a list of all commands.")
        .setThumbnail("https://i.imgur.com/ni1gwxv.png");

    embed.setAuthor("Information", "https://i.imgur.com/ni1gwxv.png");

    embed.addField("Usage", " - Commands are not case sensetive.\n - They only work in DMs");

    embed.addField("\u200b", "\u200b");

    embed.addField("HELP", "Displays this screen.");
    embed.addField("ADD SUBJECT", "Create a new subject to your timetable with a custom link and name.");
    embed.addField("ASIGN", "Asign a subject to a certain school hour. Use this to setup your timetable.");
    embed.addField("CREATE TABLE", "Create a new timetable. You can only have 3!");
    embed.addField("SWITCH", "Select which table you want to edit and be notified about.");
    embed.addField("INFO", "View info about the current select timetable.");
    embed.addField("IMPORT", "Import and use a timetable someone else created.");
    embed.addField("EXPORT", "View the code someone else can use to import your current timetable. Don't worry, they wont be able to edit it. Links will also not be shared.");
    embed.addField("FEEDBACK", "Leave feedback for the developer.");

    embed.addField("\u200b", "\u200b");

    return (embed);
}


times.hours.forEach(async hour => {
    let hours = parseInt(hour.time.split(" ")[1]);
    let minutes = parseInt(hour.time.split(" ")[0]);
    minutes = minutes - 5;

    if (minutes < 0) {
        minutes = 60 + minutes;
        hours -= 1;
    }

    cron.schedule(`${minutes} ${hours} * * 1-5`, () => doCronJob(hour.hour));
});

async function doCronJob(hour) {
    const day = new Date().getDay();

    const allEntrys = await db.all("SELECT * FROM timeentry WHERE day=? AND hour=?", [day, hour]);

    allEntrys.forEach(async entry => {
        const timetable = entry.timetable;

        const allClients = await db.all("SELECT client FROM activeTable WHERE timetable=?", [timetable]);

        allClients.forEach(async client => {
            const discordId = client.client;

            const linkRaw = (await db.get("SELECT link FROM links WHERE timetable=? AND LOWER(subject) LIKE LOWER(?) AND client=?", [entry.timetable, entry.subject, discordId]));

            var link = "";
            if (linkRaw)
                link = linkRaw.link;

            notifyClient(discordId, entry.subject, link);
        })
    });
}

function notifyClient(clientId, subject, link) {
    client.users.fetch(clientId).then(user => {
        const embed = new Discord.MessageEmbed().setColor("#5cd1ff").setTitle("You have *" + subject + "* in 5 minutes!").setTimestamp()
            .setThumbnail("https://i.imgur.com/n5ZS0h3.png");

        if (link.trim() != "") {
            embed.addField("Link", link);
            embed.setURL(link);
        }

        user.send(`<@${user.id}>`, embed);
    });
}

client.login(secret.discord.secret);