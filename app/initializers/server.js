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

    // Looking up user if token is set in headers
    app.use(function(req, res, next) {
        if(!req.headers['x-user-token']) return next();

        req.user = {};

        req.user.token = req.headers['x-user-token'];
        req.user.decoded = tokens.decode(req.user.token);
        req.user.email = req.user.decoded.email;

        if(!req.user.decoded) return next('Invalid token.');

        var auth = require(appRoot + '/lib/sql/auth');

        auth.user(req, function(err) {
            next(err);
        });
    });

    async.series([
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

    });

    logger.info('[SERVER] Listening on port: ' + nconf.get('port'));

    // Listening on port
    app.listen(nconf.get('port'));

    return callback();
}

module.exports.start = start;