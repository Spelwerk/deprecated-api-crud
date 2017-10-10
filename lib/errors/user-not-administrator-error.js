'use strict';

let UserError = require('./user-error');

class UserNotAdministratorError extends UserError {
    constructor() {
        super(403,
            "Forbidden",
            "The request could not be completed due to the user not being an administrator",
            "The user ID does not have admin boolean set to true");
    }
}

module.exports = UserNotAdministratorError;
