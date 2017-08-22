'use strict';

module.exports = function(app, callback) {
    var logger = require(appRoot + '/lib/logger');

    // Return error information as response
    app.use(function(err, req, res, next) {
        if(environment === 'development') console.error(err);

        var status = err.status || 500;

        var message = err.message || 'Server encountered an error';

        var error = environment === 'development'
            ? {environment: environment, method: req.method, url: req.url, query: err.query, error: err.error}
            : null;

        logger.error(error);

        res.status(status).send({message: message, error: error});
    });

    callback();
};
