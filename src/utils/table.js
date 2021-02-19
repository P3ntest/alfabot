module.exports = class Table {
    table;
    
    constructor() {
        this.table = [];
    }

    addRow(row) {
        this.table.push(row);

        return this;
    }

    toString() {
        let tableString = "╔";
        let bottomString = "╚";
        let seperatorStirng = "╠";
        for (let i = 0; i < this.getWidth(); i++) {
            for (let j = 0; j < this.getColumnWidth(i) + 2; j++) {
                tableString += "═";
                bottomString += "═";
                seperatorStirng += "═";
            }
            tableString += "╦";
            bottomString += "╩";   
            seperatorStirng += "╬";

        }
        bottomString = bottomString.substr(0, bottomString.length - 1);
        bottomString += "╝";
        tableString = tableString.substr(0, tableString.length - 1);
        tableString += "╗";
        seperatorStirng = seperatorStirng.substr(0, seperatorStirng.length - 1);
        seperatorStirng += "╣";

        this.table.forEach(row => {
            tableString += "\n║";
            let column = 0;
            row.forEach(el => {
                let remaining = this.getColumnWidth(column) - el.toString().length;
                
                for (let i = 0; i < Math.ceil(remaining / 2); i++) {
                    tableString += "\ ";
                }
                
                tableString += "\ " + el + "\ "
                
                for (let i = 0; i < Math.floor(remaining / 2); i++) {
                    tableString += "\ ";
                }

                tableString += "║";
                column++;
            });
            tableString += "\n" + seperatorStirng;
        });

        tableString = tableString.substr(0, tableString.length - (seperatorStirng.length));
        tableString += bottomString;

        return "```" + tableString + "```";
    }

    getWidth() {
        let longest = 0;
        this.table.forEach(row => {
                if (row.length > longest) {
                longest = row.length;
            }
        });
        return longest;
    }

    getColumnWidth(index) {
        let longest = 0;
        this.table.forEach(row => {
            if (row[index].length > longest) {
                longest = row[index].length;
            }
        });
        return longest;
    }




}