'use strict';

var express = require('express'),
    nconf = require('nconf'),
    bodyParser = require('body-parser'),
    async = require('async');

var app;

function start(callback) {
    var logger = require(appRoot + '/lib/logger'),
        tokens = require(appRoot + '/lib/tokens');

    // Set up express
    app = express();

    // Use morgan for request logging
    app.use(require('morgan')('combined', {'stream':logger.stream}));

    // Configure body parser
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    // Protecting with API key
    app.use(function(req, res, next) {
        if(req.headers['x-api-key'] !== nconf.get('apikey')) return next('Faulty API Key');

        next();
    });

    async.series([
        function(callback) {
            logger.info('[SERVER] Initializing user authorization');

            // User Authorization handler
            require('./auth')(app, callback);
        },
        function(callback) {
            logger.info('[SERVER] Initializing enabled routes');

            // Initialize routes
            require('./routes')(app, appRoot + '/app/routes', callback);
        },
        function(callback) {
            logger.info('[SERVER] Initializing error handler');

            // Error handler
            require('./errors')(app, callback);
        }
    ], function(err) {
        if(err && environment === 'development') console.error(err);
    });

    logger.info('[SERVER] Listening on port: ' + nconf.get('port'));

    // Listening on port
    app.listen(nconf.get('port'));

    return callback();
}

module.exports.start = start;