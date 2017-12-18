'use strict';

let nconf = require('nconf'),
    async = require('async'),
    path = require('path');

global.appRoot = path.resolve(__dirname);
global.environment = process.env.NODE_ENV || 'development';

let logger = require('./lib/logger');

async.series([
    function(callback) {
        logger.info('[APP] Initializing nconf');

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

        callback();
    },
    function(callback) {
        logger.info('[APP] Initializing database configuration');

        let database = require('./app/initializers/database');

        // Initialize DB Connection
        database.setup(callback);
    },
    function(callback) {
        logger.info('[APP] Initializing server configuration');

        let server = require('./app/initializers/server');

        // Start Server
        server.setup(callback);
    }
], function(err) {
    if (err) {
        console.error('[APP] [CRUD] Initialization failed', err);
        logger.error('[APP] [CRUD] Initialization failed', err);
    } else {
        console.info('[APP] [CRUD] Initialized successfully in ' + environment + ' environment');
        logger.info('[APP] [CRUD] Initialized successfully in ' + environment + ' environment');
    }
});
