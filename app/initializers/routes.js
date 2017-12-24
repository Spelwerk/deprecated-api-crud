'use strict';

const util = require('util');
const fs = require('fs');
const path = require('path');
const express = require('express');
const readDir = util.promisify(fs.readdir);
const logger = require('../../lib/logger');

module.exports = async (app) => {
    logger.info('[ROUTES] Initializing');

    const folder = appRoot + '/app/routes';
    const files = await readDir(folder);

    for(let i in files) {
        try {
            let name = path.parse(files[i]).name,
                ext = path.parse(files[i]).ext;

            if(ext !== '.js') continue;

            logger.info('[ROUTES] Setting up router path for /' + name);

            const router = express.Router();

            require(path.join(folder, name))(router);

            app.use('/' + name, router);
        } catch(e) {
            throw e;
        }
    }
};
