'use strict';

let UserError = require('./user-error');

class UserNotLoggedInError extends UserError {
    constructor() {
        super(403,
            "User not logged in",
            "The request could not be completed due to the client not finding a logged in user",
            "The user ID was not found on the req Object");
    }
}

module.exports = UserNotLoggedInError;
