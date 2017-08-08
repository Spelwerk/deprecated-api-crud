'use strict';

var nconf = require('nconf'),
    async = require('async'),
    path = require('path');

var logger = require('./lib/logger');

global.appRoot = path.resolve(__dirname);

// Load Environment variables from .env file
require('dotenv').load();

var environment = process.env.NODE_ENV || 'development';

// Load configuration from file
nconf.file({
    file: appRoot + '/config/' + environment + '.yml',
    format: require('nconf-yaml')
});

// Load environment variables
nconf.env();

// Load command line arguments
nconf.argv();

logger.info('[APP] Starting server initialization');

async.series([
    function(callback) {
        var database = require('./app/initializers/database');

        // Initialize DB Connection
        database.connect(callback);
    },
    function(callback) {
        var server = require('./app/initializers/server');

        // Start Server
        server.start(callback);
    }
],function(err) {
    if (err) {
        logger.error('[APP] initialization failed', err);
    } else {
        logger.info('[APP] initialized successfully');
    }
});