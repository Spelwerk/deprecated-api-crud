var ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'wound',
        userContent = false,
        adminRestriction = true,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM wound';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'wound.canon = 1 AND ' +
                'wound.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:woundId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE wound.id = ? AND wound.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.woundId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.woundId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.woundId, adminRestriction);
        });

    router.route('/:woundId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.woundId, useUpdateColumn);
        });

    router.route('/:woundId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.woundId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
