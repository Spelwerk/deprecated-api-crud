'use strict';

var uuid = require('uuid/v1');

module.exports = function(app, callback) {
    var logger = require(appRoot + '/lib/logger');

    // Return error information as response
    app.use(function(err, req, res, next) {
        err.id = uuid();
        err.status = err.status || 500;
        err.message = err.message || 'Server encountered an error';
        err.error = err.error || 'Contact an administrator if the error persists.';

        var fullInformation = {id: err.id, message: err.message, error: err.error, stackTrace: err.stackTrace, environment: environment, method: req.method, url: req.url},
            basicInformation = {id: err.id, message: err.message, error: err.error};

        var sendError = environment !== 'production'
            ? fullInformation
            : basicInformation;

        logger.error(fullInformation);

        if(environment !== 'production') console.error(fullInformation);

        res.status(err.status).send(sendError);
    });

    callback();
};
