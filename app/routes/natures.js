var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'nature',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM nature';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'nature.canon = 1 AND ' +
                'nature.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:natureId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE nature.id = ? AND nature.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.natureId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.natureId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.natureId, adminRestriction);
        });

    router.route('/:natureId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.natureId, useUpdateColumn);
        });

    router.route('/:natureId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.natureId, adminRestriction, userContent);
        });

    router.route('/:natureId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.natureId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.natureId);
        });

    router.route('/:natureId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.natureId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
