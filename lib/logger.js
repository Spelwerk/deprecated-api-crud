let winston = require('winston');

let errorFile = appRoot + '/logs/error.log',
    debugFile = appRoot + '/logs/debug.log',
    infoFile = appRoot + '/logs/info.log';

let logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: 'error',
            level: 'error',
            filename: errorFile,
            json: true,
            maxsize: 5242880,
            maxFiles: 5,
            handleExceptions: true
        }),
        new winston.transports.File({
            name: 'debug',
            level: 'debug',
            filename: debugFile,
            json: true,
            maxsize: 5242880,
            maxFiles: 5
        }),
        new winston.transports.File({
            name: 'info',
            level: 'info',
            filename: infoFile,
            json: true,
            maxsize: 5242880,
            maxFiles: 5
        })
    ],
    exitOnError: false
});

module.exports = logger;

module.exports.stream = {
    write: function(message, encoding){
        logger.debug(message);
    }
};