'use strict';

let AppError = require('./app-error');

class DatabaseError extends AppError {
    constructor(err) {
        super(500, "Database Error", "An error has occured in the database", err.sqlMessage);

        this.details = err.sqlMessage;
        this.sql = err.sql;
        this.code = err.code;
        this.number = err.errno;
        this.state = err.sqlState;
    }
}

module.exports = DatabaseError;
