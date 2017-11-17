'use strict';

let UserError = require('./user-error');

class UserNotAllowedToEditTokenError extends UserError {
    constructor() {
        super(403,
            "Forbidden",
            "The request could not be completed due to the user not being allowed to edit this token",
            "The user ID does not have admin boolean set to true, and is trying to edit a token s/he does not have ownership of.");
    }
}

module.exports = UserNotAllowedToEditTokenError;
