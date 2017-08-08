var async = require('async');

var sequel = require(appRoot + '/lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    router.route('/')
        .get(function(req, res, next) {
            res.status(200).send('/assets');
        })
        .post(function(req, res, next) {
            res.status(200).send('/assets');
        });

    router.route('/stuff')
        .get(function(req, res, next) {
            res.status(200).send('/assets/stuff');
        });

    router.route('/stuff/:stuffId')
        .get(function(req, res, next) {
            res.status(200).send('/assets/stuffId ' + req.params.stuffId);
        });

    router.route('/:assetId')
        .get(function(req, res, next) {
            res.status(200).send('/assets/assetId ' + req.params.assetId);
        })
        .put(function(req, res, next) {
            res.status(200).send('/assets/assetId ' + req.params.assetId);
        })
        .delete(function(req, res, next) {
            res.status(200).send('/assets/assetId ' + req.params.assetId);
        });
};