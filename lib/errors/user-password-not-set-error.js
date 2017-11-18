'use strict';

let UserError = require('./user-error');

class UserPasswordNotSetError extends UserError {
    constructor() {
        super(400,
            "Password not set",
            "You are trying to log in to an account that has no password. You can only use your email to log in to this account.",
            "The password field is NULL");
    }
}

module.exports = UserPasswordNotSetError;
