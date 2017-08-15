var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'identity',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM identity';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'identity.canon = 1 AND ' +
                'identity.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:identityId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE identity.id = ? AND identity.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.identityId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.identityId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.identityId, adminRestriction);
        });

    router.route('/:identityId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.identityId, useUpdateColumn);
        });

    router.route('/:identityId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.identityId, adminRestriction, userContent);
        });

    router.route('/:identityId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.identityId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.identityId);
        });

    router.route('/:identityId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.identityId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
