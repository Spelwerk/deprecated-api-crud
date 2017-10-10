'use strict';

var logger = require(appRoot + '/lib/logger');

module.exports = function(app, callback) {
    // Return error information as response
    app.use(function(err, req, res, next) {
        req.log.error = err;

        logger.error(req.log);

        if(environment !== 'production') console.error(req.log);

        res.status(err.status).send({title: err.title, message: err.message});
    });

    callback();
};
