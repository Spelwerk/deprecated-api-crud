'use strict';

let UserError = require('./user-error');

class UserEmailAlreadyExistsError extends UserError {
    constructor() {
        super(400,
            "Forbidden",
            "The email is already taken!",
            "The email is already taken!");
    }
}

module.exports = UserEmailAlreadyExistsError;
