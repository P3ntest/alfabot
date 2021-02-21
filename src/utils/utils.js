const { v4: uuidv4 } = require('uuid');

async function getActiveTimetable(client, db) {
    let result = await db.get("SELECT * FROM activeTable WHERE client=?", [client]);
    if (!result) {
        return undefined;
    } else {
        return result.timetable;
    }
}

async function canEdit(client, timetable, db) {
    return (await db.get("SELECT * FROM timetables WHERE owner=? AND id=?", [client, timetable])) ? true : false;
}

async function setActiveTimeTable(client, table, db) {
    await global.db.run("DELETE FROM activeTable WHERE client=?", [client]);
    if(table) global.db.run("INSERT INTO activeTable VALUES (?, ?)", [client, table]);
}

function getNewId() {
    return uuidv4().substr(0, 8);
}

module.exports = {
    getActiveTimetable,
    canEdit,
    setActiveTimeTable,
    getNewId
}