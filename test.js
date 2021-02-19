const Table = require("./src/utils/table");

let table = new Table();
table.addRow("Hello", "test", "this is very coool");
table.addRow("", "", "");
table.addRow("", "this is very coool", "");

console.log(table.toString());