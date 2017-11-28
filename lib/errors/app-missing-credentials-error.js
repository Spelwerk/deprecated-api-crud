'use strict';

let AppError = require('./app-error');

class MissingCredentialsError extends AppError {
    constructor() {
        super(401,
            "Missing Credentials",
            "Credentials are missing in the header",
            "Credentials are missing in the header");
    }
}

module.exports = MissingCredentialsError;
