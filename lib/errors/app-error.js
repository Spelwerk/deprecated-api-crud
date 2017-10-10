'use strict';

class AppError extends Error {
    constructor(status, title, message, details) {
        super();

        this.name = this.constructor.name;
        this.status = status;
        this.title = title;
        this.message = message;
        this.details = details;

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }
}

module.exports = AppError;
