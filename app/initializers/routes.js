var express = require('express'),
    path = require('path'),
    fs = require('fs');

module.exports = function(app, folderName) {
    'use strict';

    fs.readdir(folderName, function(err, files) {
        if(err) console.log(err);

        files.map(function(file) {
            return path.join(folderName, file);
        }).filter(function(file) {
            return fs.statSync(file).isFile();
        }).filter(function(file) {
            return path.parse(file).ext === ".js";
        }).forEach(function(file) {
            // Parsing filename without ext
            var fileName = path.parse(file).name;

            // Load express router
            var router = express.Router();

            // Initialize the route to add its functionality to router
            require(path.join(folderName, fileName))(router);

            // Add router to the speficied route name in the app
            app.use('/' + fileName, router);
        });
    });
};