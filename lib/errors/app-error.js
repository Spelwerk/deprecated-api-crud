'use strict';

class AppError extends Error {
    constructor(status, title, message, details) {
        super();

        this.name = this.constructor.name;
        this.status = status || 500;
        this.title = title || "Error";
        this.message = message || "The server encountered an error";
        this.details = details || null;

        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = (new Error(message)).stack;
        }
    }

    getStatus() {
        return this.status;
    }

    getSend() {
        return {
            title: this.title,
            message: this.message
        }
    }
}

module.exports = AppError;
