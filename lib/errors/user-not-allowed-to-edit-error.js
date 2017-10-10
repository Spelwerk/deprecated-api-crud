'use strict';

let UserError = require('./user-error');

class UserNotAllowedToEditError extends UserError {
    constructor() {
        super(403,
            "Forbidden",
            "The request could not be completed due to the user not being allowed to edit this row",
            "The user ID does not have admin boolean set to true, and does not have owner/edit booleans set to true on this row");
    }
}

module.exports = UserNotAllowedToEditError;
