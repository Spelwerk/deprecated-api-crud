'use strict';

var nconf = require('nconf'),
    async = require('async'),
    path = require('path');

var logger = require('./lib/logger');

global.appRoot = path.resolve(__dirname);
global.environment = process.env.NODE_ENV || 'development';

// Load Environment variables from .env file
require('dotenv').load();

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
        logger.info('[APP] Initializing database configuration');

        var database = require('./app/initializers/database');

        // Initialize DB Connection
        database.connect(callback);
    },
    function(callback) {
        logger.info('[APP] Initializing server configuration');

        var server = require('./app/initializers/server');

        // Start Server
        server.start(callback);
    }
], function(err) {
    if (err) {
        console.error('[APP] Initialization failed', err);
        logger.error('[APP] Initialization failed', err);
    } else {
        console.info('[APP] Initialized successfully');
        logger.info('[APP] Initialized successfully');
    }
});