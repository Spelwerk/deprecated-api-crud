'use strict';

let AppError = require('./app-error');

class DatabaseDuplicateEntryError extends AppError {
    constructor(err) {
        let unique = err.sqlMessage.indexOf("_UNIQUE") !== -1
            ? err.sqlMessage.split("_UNIQUE")
            : null;

        let uniqueKey = unique !== null
            ? unique[0].split("for key \'")[1]
            : null;

        super(500,
            "Duplicate Key Error",
            "The unique key you provided already exists in the table.",
            "The key key is unique and cannot have a duplicate in the table.");

        this.uniqueKey = uniqueKey;
        this.details = err.sqlMessage;
        this.sql = err.sql;
        this.code = err.code;
        this.number = err.errno;
        this.state = err.sqlState;
    }
}

module.exports = DatabaseDuplicateEntryError;
