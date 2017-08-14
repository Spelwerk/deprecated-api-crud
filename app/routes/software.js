var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'software',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM software';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'software.canon = 1 AND ' +
                'software.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:softwareId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE software.id = ? AND software.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.softwareId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.softwareId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.softwareId, adminRestriction);
        });

    router.route('/:softwareId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.softwareId, useUpdateColumn);
        });

    router.route('/:softwareId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.softwareId, adminRestriction, userContent);
        });

    router.route('/:softwareId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.softwareId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.softwareId);
        });

    router.route('/:softwareId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.softwareId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
