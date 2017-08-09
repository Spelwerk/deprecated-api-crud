var async = require('async');

var sequel = require(appRoot + '/lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = '',
        userContent = true,
        adminRestriction = false;

    router.route('/')
        .get(function(req, res, next) {
            res.status(200).send({success: true, message: 'example', data: ['/example']});
        })
        .post(function(req, res, next) {
            res.status(200).send({success: true, message: 'example', id: 4});
        });

    router.route('/error')
        .get(function(req, res, next) {
            next({error: 'jonn'});
        });

    router.route('/stuff')
        .get(function(req, res, next) {
            res.status(200).send('/example/stuff');
        });

    router.route('/stuff/:stuffId')
        .get(function(req, res, next) {
            res.status(200).send('/example/stuffId ' + req.params.stuffId);
        });

    router.param('exampleId', function(req, res, next, exampleId) {
        console.log('validating exampleId ' + exampleId);

        next();
    });

    router.route('/:exampleId')
        .get(function(req, res, next) {
            res.status(200).send('/example/exampleId ' + req.params.exampleId);
        });
};