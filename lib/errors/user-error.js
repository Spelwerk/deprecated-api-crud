'use strict';

let AppError = require('./app-error');

class UserError extends AppError {
    constructor(status, title, message, details) {
        super(status, title, message, details);
    }
}

module.exports = UserError;
