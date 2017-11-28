'use strict';

let UserError = require('./user-error');

class UserDisplaynameAlreadyExistsError extends UserError {
    constructor() {
        super(400,
            "Forbidden",
            "The displayname is already taken!",
            "The displayname is already taken!");
    }
}

module.exports = UserDisplaynameAlreadyExistsError;
