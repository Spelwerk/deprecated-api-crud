'use strict';

let AppError = require('./app-error');

class JSONWebTokenError extends AppError {
    constructor() {
        super(401, "Invalid Token", "An error occured when trying to verify the token");
    }
}

module.exports = JSONWebTokenError;
