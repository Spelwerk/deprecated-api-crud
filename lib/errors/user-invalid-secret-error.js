'use strict';

let UserError = require('./user-error');

class UserInvalidSecretError extends UserError {
    constructor(secret) {
        super(400,
            "Invalid Secret",
            "The secret provided in the request is invalid",
            "The secret could not be found in the table");

        this.secret = secret;
    }
}

module.exports = UserInvalidSecretError;
