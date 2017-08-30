var comment = require('../../lib/sql/comment'),
    ownership = require('../../lib/sql/ownership'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'loyalty',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM loyalty';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'loyalty.canon = 1 AND ' +
                'loyalty.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:loyaltyId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE loyalty.id = ? AND loyalty.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.loyaltyId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.loyaltyId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.loyaltyId, adminRestriction);
        });

    router.route('/:loyaltyId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.loyaltyId, useUpdateColumn);
        });

    router.route('/:loyaltyId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.loyaltyId, adminRestriction, userContent);
        });

    router.route('/:loyaltyId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.loyaltyId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.loyaltyId);
        });

    router.route('/:loyaltyId/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
