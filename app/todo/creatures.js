'use strict';

var sequel = require('../../lib/sql/sequel');

var basic = require('../../lib/generic/basic'),
    creatures = require('../../lib/helper/creatures');

module.exports = function(router) {
    var tableName = 'creature';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            creatures.post(req, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    //basic.clone(router, tableName);
    basic.comments(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);
};
