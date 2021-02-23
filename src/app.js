const cron = require('node-cron');
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require("sqlite");

const secret = require("../secret.json");
const times = require("./times.json");

const commands = fs.readFileSync('./commands');
client.commands = new Discord.Collection();

for(const file of commands){
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

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

async function setupNewUser(discordId) {
    const row = await db.get("SELECT * FROM clients WHERE discordId=?", [discordId]);
    if (!row) {
        db.run("INSERT INTO clients VALUES (?, ?)", [discordId, true]);
    }
}

client.on('message', async msg => {
    if(msg.channel.type == "dm" && !msg.author.bot) return;

    if(!msg.channel.lastMessage) { //Prüfen ob es eine Nachricht vor der jetzigen gegeben hat. Spaart Datenbank abrufe
        msg.channel.send(`<@${msg.author.id}> welcome to AlfaBot! Here is our help page to get you started:`, getHelpEmbed());
        await setupNewUser(msg.author.id);
        return;
    }
    const commandName = content.trim().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if(!command) return; //Wenn kein Command gefunden wird
    //Hier kann man beschränkungen prüfen, wie zum Beispiel ob argumente benötigt werden, Cooldowns usw usw...

    try {
        command.execute(msg, args = undefined, db);
    } catch (error) {
        console.error(error);
        msg.reply('An error Occured!');
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
        3) \`ASSIGN\` to assign your subject to an hour on your schedule
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
    *LIST TABLES* - List of all your tables
    *INFO* - Display all information about your current table.
    *RENAME TABLE* - Rename the current table.
    *DELETE TABLE* - Delete a table.
    `)
    embed.addField("\u200b",

    `
    \`Table Configuration\`
    *CREATE SUBJECT* - Create a subject.
    *RENAME SUBJECT* - Rename a subject from the current table.
    *DELETE SUBJECT* - Delete a subject.
    *LIST SUBJECTS* - List of all your subjects
    *ASSIGN* - Assign a subject to a school hour.
    *UNASSIGN* - Remove a class data from the table.
    *SET LINK* - Set a link for a subject.
    *LINK <subject>* - View a link for a subject.
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