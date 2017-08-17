var ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'sanity',
        userContent = false,
        adminRestriction = true,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM sanity';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'sanity.canon = 1 AND ' +
                'sanity.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:sanityId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE sanity.id = ? AND sanity.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.sanityId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.sanityId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.sanityId, adminRestriction);
        });

    router.route('/:sanityId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.sanityId, useUpdateColumn);
        });

    router.route('/:sanityId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.sanityId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
