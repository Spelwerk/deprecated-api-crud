var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'assettype',
        userContent = true,
        adminRestriction = false;

    var sql = 'SELECT * FROM assettype';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'assettype.canon = 1 AND ' +
                'assettype.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Group

    router.route('/group/:groupId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'assettype.canon = 1 AND ' +
                'assettype.assetgroup_id = ? AND ' +
                'assettype.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.groupId]);
        });

    // ID

    router.route('/:assetTypeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE assettype.id = ? AND assettype.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.assetTypeId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.assetTypeId, adminRestriction);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.assetTypeId, adminRestriction);
        });

    router.route('/:assetTypeId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.assetTypeId);
        });

    router.route('/:assetTypeId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.assetTypeId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

};
