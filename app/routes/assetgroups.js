var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'assetgroup',
        userContent = true,
        adminRestriction = false;

    var sql = 'SELECT * FROM assetgroup';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'assetgroup.canon = 1 AND ' +
                'assetgroup.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Asset ID

    router.route('/:assetGroupId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE assetgroup.id = ? AND assetgroup.id IS NULL';

            sequel.get(req, res, next, call, [req.params.assetGroupId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.assetGroupId, adminRestriction);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.assetGroupId, adminRestriction);
        });

    router.route('/:assetGroupId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.assetGroupId);
        });

    router.route('/:assetGroupId/ownership')
        .get(function(req, res, next) {
            ownership(req, tableName, req.params.assetGroupId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

};
