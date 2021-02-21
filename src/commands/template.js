const { getActiveTimetable, canEdit } = require("../utils/utils");
const Discord = require('discord.js');

module.exports = class Template {
    constructor() {
        this.active = true;
        this.stage = 0;
    }
    async recieve(msg) {
        switch (this.stage) {
            
        }
    }
}