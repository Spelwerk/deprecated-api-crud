'use strict';

module.exports = function(app, callback) {
    var logger = require(appRoot + '/lib/logger');

    // Return error information as response
    app.use(function(err, req, res, next) {
        err.status = err.status || 500;
        err.title = err.title || 'Error';
        err.message = err.message || 'The server encountered an error';
        err.details = err.details || null;

        req.log.error = err;

        logger.error(req.log);

        if(environment !== 'production') console.error(req.log);

        res.status(err.status).send({id: req.log.id, title: err.title, message: err.message, details: err.details});
    });

    callback();
};
