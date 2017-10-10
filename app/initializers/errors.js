'use strict';

module.exports = function(app, callback) {
    var logger = require(appRoot + '/lib/logger');

    // Return error information as response
    app.use(function(err, req, res, next) {
        req.log.error = err;
        logger.error(req.log);

        if(environment !== 'production') console.error(req.log);

        res.status(err.getStatus()).send(err.getSend());
    });

    callback();
};
