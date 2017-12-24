'use strict';

const nconf = require('nconf');
const logger = require('../../lib/logger');

logger.info('[NCONF] Initializing');

require('dotenv').load();
nconf.file({file: appRoot + '/config/' + environment + '.yml', format: require('nconf-yaml')});
nconf.env();
nconf.argv();
