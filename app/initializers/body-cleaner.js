'use strict';

const logger = require('../../lib/logger');

function loopBody(body) {
    let object = {};

    if(!body && body.length === 0) return object;

    for(let key in body) {
        if(!body.hasOwnProperty(key)) continue;
        if(body[key] === null) continue;
        if(typeof body[key] === 'undefined') continue;

        if(!isNaN(parseInt(body[key]))) body[key] = parseInt(body[key]);

        object[key] = body[key];
    }

    return object;
}

module.exports = (app) => {
    logger.info('[BODY-CLEANER] Initializing');

    app.use(function(req, res, next) {
        req.body = loopBody(req.body);

        next();
    });
};
