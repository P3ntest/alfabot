const Discord = require('discord.js');
const client = new Discord.Client();
const cron = require('node-cron');
const secret = require("../secret.json");
const times = require("./times.json");
const UseTable = require('./commands/useTable');
const Asign = require('./commands/asign');
const CreateTimeTable = require('./commands/createTimetable');
const AddSubject = require('./commands/addSubject');
const Feedback = require('./commands/feedback');
const ImportCmd = require('./commands/import');
const SetLink = require('./commands/setLink');
const InfoCmd = require('./commands/info');
const ExportCmd = require('./commands/export');
const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite");
const DeleteTable = require('./commands/deleteTable');
const DeleteSubject = require('./commands/deleteSubject');
const RenameSubject = require('./commands/renameSubject');
const RenameTable = require('./commands/renameTable');
const StartStopCmd = require('./commands/startStop');
const MotdAdminCommand = require('./commands/motd');

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
    db.run("CREATE TABLE IF NOT EXISTS clients (discordId TEXT, active BOOLEAN)");
    //SELECT activeTable.timetable FROM activeTable, clients WHERE activeTable.client=clients.discordId AND clients.active=true
    //db.run("CREATE TABLE IF NOT EXISTS imported (client TEXT, timetable TEXT)");

    global.db = db;
})()

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("AlfaView", { type: "PLAYING" })
    global.client = client;
});

const currentCommands = {};

async function checkFirstMessage(discordId) {

    const row = await db.get("SELECT * FROM clients WHERE discordId=?", [discordId]);
    if (!row) {
        db.run("INSERT INTO clients VALUES (?, ?)", [discordId, true]);
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
            msg.react("👍");
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
            } else if (msg.content.trim().toLowerCase().startsWith("start")
                || msg.content.trim().toLowerCase().startsWith("stop")) {
                currentCommands[msg.author.id] = new StartStopCmd();
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
            } else if (msg.content.trim().toLowerCase().startsWith("import")) {
                currentCommands[msg.author.id] = new ImportCmd(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.toLowerCase().startsWith("delete table")) {
                currentCommands[msg.author.id] = new DeleteTable();
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.toLowerCase().startsWith("delete subject")) {
                currentCommands[msg.author.id] = new DeleteSubject();
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.toLowerCase().startsWith("motd")
            && secret.static.owners.includes(msg.author.id)) {
                currentCommands[msg.author.id] = new MotdAdminCommand();
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("rename table")) {
                currentCommands[msg.author.id] = new RenameTable(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("rename subject")) {
                currentCommands[msg.author.id] = new RenameSubject(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("export")) {
                currentCommands[msg.author.id] = new ExportCmd(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.trim().toLowerCase().startsWith("set link")) {
                currentCommands[msg.author.id] = new SetLink(db);
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.toLowerCase().startsWith("info")) {
                currentCommands[msg.author.id] = new InfoCmd();
                currentCommands[msg.author.id].recieve(msg);
            } else if (msg.content.toLowerCase().includes("help")) {
                msg.channel.send(getHelpEmbed());
            } else if (msg.content.toLowerCase().includes("about")) {
                msg.channel.send(getAboutEmbed());
            } else {
                msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Command not found. Use `HELP` for help.**"));

            }
        }
    }

});

function getHelpEmbed() {
    const embed = new Discord.MessageEmbed().setColor("#f5b042").setTimestamp().setTitle("AlfaBot's Help Page")
        .setThumbnail("https://i.imgur.com/ni1gwxv.png");

    embed.setAuthor("Information", "https://i.imgur.com/ni1gwxv.png");
    embed.setFooter("AlfaBot");

    //embed.addField("\u200b", "\u200b");

    embed.addField("General Information",
        `AlfaBot helps you with joining the right conference room in time by sending you a reminder with the link 5 minutes prior to your class. ` +
        `You can also share your tables with other who share the same timetable as you. The table will be duplicated and your links will not be shared.`)
    embed.addField("Setting up your schedule",
        `1) \`CREATE TABLE\` to create your table
        2) \`CREATE SUBJECT\` to create your subjects
        3) \`ASIGN\` to asign your subject to an hour on your schedule
        4) Done! You will now be notified when you have class.`);

    embed.addField("\u200b", "\u200b");

    embed.addField("Command Usage", " - Commands are not case sensetive.\n - Send them directly to this bot. They don't work in servers.");

    embed.addField("\u200b", `
    \`General\`
    *HELP* - Displays this screen.
    *FEEDBACK* - Ask for support, give me feedback or report bugs.
    *ABOUT* - Ask for support, give me feedback or report bugs.
    \u200b
    \`Notifications\`
    *STOP* - Stops reminding you of your classes.
    *START* - Reactivates reminders.
    \u200b
    \`Table Management\`
    *CREATE TABLE* - Create a new table.
    *SWITCH* - Switch between your currently active table
    *INFO* - Display all information about your current table.
    *RENAME TABLE* - Rename the current table.
    *DELETE TABLE* - Delete a table.
    \u200b
    \`Table Configuration\`
    *CREATE SUBJECT* - Create a subject.
    *RENAME SUBJECT* - Rename a subject from the current table.
    *DELETE SUBJECT* - Delete a subject.
    *ASIGN* - Asign a subject to a school hour.
    *SET LINK* - Set a link for a subject.
    \u200b
    \`Publishing\`
    *IMPORT* - Import a table using an import code.
    *EXPORT* - Export and share your current table and recieve your export code.`);

    embed.addField("\u200b", "\u200b");

    embed.addField("Invite AlfaBot to your server :ballot_box_with_check:", ` Use [this](https://discord.com/oauth2/authorize?client_id=811963323532836966&scope=bot&permissions=0) link to add AlfaBot to your server.`);


    return (embed);
}

function getAboutEmbed() {
    const embed = new Discord.MessageEmbed().setColor("#f5b042").setTimestamp().setTitle("AlfaBot's Developers :computer: ")
        .setThumbnail("https://i.imgur.com/ni1gwxv.png");

    embed.setAuthor("About", "https://i.imgur.com/ni1gwxv.png");
    embed.setFooter("AlfaBot");

    embed.addField("Lopfi :man_mage:",
        `<@304221361851596802> is the co-developer for AlfaBot.`)
    embed.addField("P3ntest :watermelon:",
        `<@357871005093462019> is the founder of AlfaBot.`);

    embed.addField("\u200b", "\u200b");

    embed.addField("Feedback :star:", "Contact developers directly or use the `FEEDBACK` command.");

    embed.addField("Invite AlfaBot to your server :ballot_box_with_check:", `[Invite Link](https://discord.com/oauth2/authorize?client_id=811963323532836966&scope=bot&permissions=0)`);
    
    embed.addField("\u200b", "\u200b");

    embed.addField("Buy me a coffee :coffee:", `If you :heart: AflaBot and want to support me, I would be gratefull about donations: [PayPal Link](https://paypal.me/p3ntest)`);



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
    var day = new Date().getDay();

    const allEntrys = await db.all("SELECT * FROM timeentry WHERE day=? AND hour=?", [day, hour]);

    allEntrys.forEach(async entry => {
        const timetable = entry.timetable;

        const client = await db.get(
            "SELECT activeTable.client FROM activeTable, clients WHERE activeTable.timetable=? AND activeTable.client=clients.discordId AND clients.active=true", [timetable]);

        if (client) {
            const discordId = client.client;

            const linkRaw = (await db.get("SELECT link FROM links WHERE timetable=? AND LOWER(subject) LIKE LOWER(?) AND client=?", [entry.timetable, entry.subject, discordId]));

            var link = "";
            if (linkRaw)
                link = linkRaw.link;

            notifyClient(discordId, entry.subject, link);
        }

    });
}

function notifyClient(clientId, subject, link) {
    client.users.fetch(clientId).then(user => {
        const embed = new Discord.MessageEmbed().setColor("#eb4034").setTimestamp().setFooter("AlfaBot")
            .setAuthor("You have class in 5 minutes!")


        embed.addField("Subject", subject, true);

        if (link.trim() != "") {
            embed.addField("Link", link, true);
            embed.setURL(link)
                .setTitle("Click here to join.");
        }

        user.send(`<@${user.id}>`, embed);
    });
}

client.login(secret.discord.secret);