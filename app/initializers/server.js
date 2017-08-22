'use strict';

var express = require('express'),
    nconf = require('nconf'),
    bodyParser = require('body-parser'),
    async = require('async');

var logger = require(appRoot + '/lib/logger');

var app;

function start(callback) {
    async.series([
        function(callback) {
            logger.info('[SERVER] Setting up Express');

            app = express();

            callback();
        },
        function(callback) {
            logger.info('[SERVER] Using Morgan for request Logging');

            app.use(require('morgan')('combined', {'stream':logger.stream}));

            callback();
        },
        function(callback) {
            logger.info('[SERVER] Configuring Body Parser');

            app.use(bodyParser.urlencoded({extended: true}));
            app.use(bodyParser.json());

            callback();
        },
        function(callback) {
            logger.info('[SERVER] Initializing key authorization');

            // API-Key Authorization handler
            require('./auth/key')(app, callback);
        },
        function(callback) {
            logger.info('[SERVER] Initializing user authorization');

            // User Authorization handler
            require('./auth/user')(app, callback);
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
        if(err) console.error(err);

        logger.info('[SERVER] Listening on port: ' + nconf.get('port'));

        // Listening on port
        app.listen(nconf.get('port'));

        callback();
    });
}

module.exports.start = start;