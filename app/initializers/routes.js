'use strict';

let express = require('express'),
    path = require('path'),
    fs = require('fs');

let logger = require(appRoot + '/lib/logger');

module.exports = function(app, folderName, callback) {
    fs.readdir(folderName, function(err, files) {
        if(err) return callback(err);

        files
            .map(function(file) {
                return path.join(folderName, file);
            })
            .filter(function(file) {
                return fs.statSync(file).isFile();
            })
            .filter(function(file) {
                return path.parse(file).ext === '.js'
            })
            .forEach(function(file) {
                // Parsing filename without ext
                let fileName = path.parse(file).name;

                logger.info('[ROUTES] Setting up router path for /' + fileName);

                // Load express router
                let router = express.Router();

                // Join foldername + filename into full path
                let fullPath = path.join(folderName, fileName);

                // Initialize the route to add its functionality to router
                require(fullPath)(router);

                // Add router to the speficied route name in the app
                app.use('/' + fileName, router);
            });

        callback();
    });
};
