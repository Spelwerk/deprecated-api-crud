'use strict';

let yaml = require('node-yaml').readSync;

let defaults = yaml('./../../config/defaults.yml'),
    dice = yaml('./../../config/dice.yml'),
    icons = yaml('./../../config/icons.yml'),
    points = yaml('./../../config/points.yml');

module.exports = function(router) {

    router.route('/')
        .get(function(req, res) {
            res.status(204).send();
        });

    router.route('/config/defaults')
        .get(function(req, res) {
            res.status(200).send(defaults);
        });

    router.route('/config/dice')
        .get(function(req, res) {
            res.status(200).send(dice);
        });

    router.route('/config/icons')
        .get(function(req, res) {
            res.status(200).send(icons);
        });

    router.route('/config/points')
        .get(function(req, res) {
            res.status(200).send(points);
        });

};
