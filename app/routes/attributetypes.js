var ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'attributetype',
        userContent = false,
        adminRestriction = true,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM attributetype';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'attributetype.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:attributeTypeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE attributetype.id = ? AND attributetype.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.attributeTypeId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.attributeTypeId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.attributeTypeId, adminRestriction);
        });

    router.route('/:attributeTypeId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.attributeTypeId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

};
