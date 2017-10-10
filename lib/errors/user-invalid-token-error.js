'use strict';

let UserError = require('./user-error');

class UserInvalidTokenError extends UserError {
    constructor() {
        super(400,
            "Invalid token",
            "The token provided in the request is invalid",
            "The token could not be found in the table");
    }
}

module.exports = UserInvalidTokenError;
