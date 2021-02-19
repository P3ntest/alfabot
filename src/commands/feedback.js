const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');

const secret = require("../../secret.json");

module.exports = class Feedback {
    constructor(db) {
        this.db = db;
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            case 0:
                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **Thank you for giving me feedback!\nHow many stars do you rate? (0-5)**"));
                this.stage = 1;
                break;
            case 1:
                let stars = parseFloat(msg.content);
                if (stars == NaN || stars > 5 || stars < 0 || (stars % 1) != 0) {
                    msg.channel.send(new Discord.MessageEmbed().setColor("#ff2146").setDescription(":no_entry_sign:  **Please use whole numbers from 0-5!**"));
                    return;
                }
                this.stars = stars;
                msg.channel.send(new Discord.MessageEmbed().setColor("#5cd1ff").setDescription(":question:   **What would you like to say as a review?**"));
                this.stage = 2;
                break;
            case 2:
                this.del = msg.content;
                const embed = new Discord.MessageEmbed().setColor("#5cd1ff").setTitle("Thank you for your feedback!")
                .setDescription("I will come back to you shortly.")
                .setFooter("P3ntest#3515 - Developer of AlfaBot", "https://images-ext-2.discordapp.net/external/vfLSGZoBx9h67czQxr2lBGCgbT_jYC2W1xjt-wAxqkc/https/cdn.discordapp.com/avatars/357871005093462019/a9232e8e06016a5b52595f539dc6e896.webp?width=64&height=64")
                .setThumbnail("https://i.imgur.com/Zq1aEYZ.png");
                
                var starsString = "";
                for (let star = 0; star < 5; star++) {
                    starsString += (star < this.stars) ? ":star:" : ":black_medium_small_square:"
                }
                embed.addField("\u200b", "\u200b");
                embed.addField("Stars", starsString, true);
                embed.addField("User", msg.author.username + "#" + msg.author.discriminator, true);
                embed.addField("Review", this.del);
                embed.addField("\u200b", "\u200b");
                msg.channel.send(embed);

                const devEmbed = new Discord.MessageEmbed().setColor("#ff21fb").setTitle("Feedback!").setTimestamp();

                devEmbed.setThumbnail(msg.author.avatarURL());

                devEmbed.addField("Stars", starsString, true);
                devEmbed.addField("User", msg.author.username + "#" + msg.author.discriminator, true);
                devEmbed.addField("Review", this.del);

                secret.static.owners.forEach(async ownerId => {
                    global.client.users.fetch(ownerId).then(async user => {
                        user.send(`<@${msg.author.id}>`, devEmbed).then(msg => msg.pin());
                    })
                });

                this.active = false;
            }
    }
}