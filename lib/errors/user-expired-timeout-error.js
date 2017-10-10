'use strict';

let UserError = require('./user-error');

class UserExpiredTimeoutError extends UserError {
    constructor(momentNow, momentTimeout) {
        super(400,
            "Timeout Expired",
            "The timeout period has expired. A new secret needs to be generated and sent to your email",
            "The timeout DATETIME is higher than the current DATETIME");

        this.momentNow = momentNow;
        this.momentTimeout = momentTimeout;
    }
}

module.exports = UserExpiredTimeoutError;
