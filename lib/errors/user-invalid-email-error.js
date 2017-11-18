'use strict';

let UserError = require('./user-error');

class UserInvalidEmailError extends UserError {
    constructor() {
        super(400,
            "Invalid Email",
            "The email you provided does not exist in our database. Did you type it correctly?",
            "The email provided in the request body does not match any one in our database.");
    }
}

module.exports = UserInvalidEmailError;
