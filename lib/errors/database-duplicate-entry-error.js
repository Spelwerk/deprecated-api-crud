'use strict';

let AppError = require('./app-error');

class DatabaseDuplicateEntryError extends AppError {
    constructor(err) {
        let unique = err.sqlMessage.split("_UNIQUE"),
            uniqueKey = unique[0].split("for key \'")[1];

        super(500,
            "Duplicate Key Error",
            "The " + uniqueKey + " you provided already exists.",
            "The " + uniqueKey + " key is unique and cannot have a duplicate in the table.");

        this.uniqueKey = uniqueKey;
        this.details = err.sqlMessage;
        this.sql = err.sql;
        this.code = err.code;
        this.number = err.errno;
        this.state = err.sqlState;
    }
}

module.exports = DatabaseDuplicateEntryError;
