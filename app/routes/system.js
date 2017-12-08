'use strict';

let yaml = require('node-yaml').readSync;

let defaults = yaml('./../../config/defaults.yml');

module.exports = function(router) {

    router.route('/')
        .get(function(req, res) {
            res.status(204).send();
        });

    router.route('/defaults')
        .get(function(req, res) {
            res.status(200).send(defaults);
        });

};
