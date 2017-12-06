'use strict';

let AppError = require('./app-error');

class DatabaseRowNotFound extends AppError {
    constructor(err) {
        super(500,
            "Item Not Found",
            "The item cannot be found",
            "The item cannot be found");

        this.details = err.sqlMessage;
        this.sql = err.sql;
        this.code = err.code;
        this.number = err.errno;
        this.state = err.sqlState;
    }
}

module.exports = DatabaseRowNotFound;
