'use strict';

let AppError = require('./app-error');

class InvalidCredentialsError extends AppError {
    constructor() {
        super(401,
            "Invalid API Credentials",
            "The API key provided was not correct.",
            "The API key provided was not correct.");
    }
}

module.exports = InvalidCredentialsError;
