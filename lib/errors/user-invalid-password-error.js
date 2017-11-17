'use strict';

let UserError = require('./user-error');

class UserInvalidPasswordError extends UserError {
    constructor(secret) {
        super(400,
            "Invalid Password",
            "The password you typed is not correct. Did you type it correctly?",
            "The password provided in the request body does not match the one in our database.");

        this.secret = secret;
    }
}

module.exports = UserInvalidPasswordError;
