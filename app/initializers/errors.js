'use strict';

let logger = require(appRoot + '/lib/logger');

module.exports = function(app, callback) {
    // Return error information as response
    app.use(function(err, req, res, next) {
        err.status = err.status || 500;
        err.title = err.title || "Error";
        err.message = err.message || "The server encountered an error.";

        req.log.error = err;

        logger.error(req.log);

        if(environment !== 'production') console.error(req.log);

        res.status(err.status).send({title: err.title, message: err.message});
    });

    callback();
};
