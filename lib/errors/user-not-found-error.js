'use strict';

let UserError = require('./user-error');

class UserNotFoundError extends UserError {
    constructor() {
        super(404,
            "User not found",
            "The requested user was not found",
            "The user ID was not found in the database");
    }
}

module.exports = UserNotFoundError;
