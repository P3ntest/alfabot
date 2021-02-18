async function getActiveTimetable(client, db) {
    return (await db.get("SELECT * FROM activeTable WHERE client=?", [client])).timetable;
}

async function canEdit(client, timetable, db) {
    return (await db.get("SELECT * FROM timetables WHERE owner=? AND id=?", [client, timetable])) ? true : false;
}

module.exports = {
    getActiveTimetable,
    canEdit
}