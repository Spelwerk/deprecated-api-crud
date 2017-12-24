'use strict';

const path = require('path');

global.appRoot = path.resolve(__dirname);
global.environment = process.env.NODE_ENV || 'development';

const nconf = require('nconf');
const express = require('express');
const bodyParser = require('body-parser');
const logger = require('./lib/logger');

async function main() {
    logger.info('[SERVER] Setting up Server');

    const app = express();

    try {
        require('./app/initializers/nconf');

        await require('./app/initializers/database').setup();

        logger.info('[SERVER] Configuring Body Parser');

        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());

        logger.info('[SERVER] Configuring App with Initializers');

        require('./app/initializers/log')(app);
        require('./app/initializers/auth')(app);
        require('./app/initializers/user')(app);

        await require('./app/initializers/routes')(app);

        require('./app/initializers/errors')(app);

        logger.info('[SERVER] Listening on port: ' + nconf.get('port'));

        app.listen(nconf.get('port'));
    } catch(e) {
        console.error(e);
        logger.error(e);
    }

    logger.info('[SERVER] Initialized successfully in ' + environment + ' environment');

    console.info('[CRUD] Initialized successfully in ' + environment + ' environment');
}

void main();
