var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    relation = require('./../../lib/sql/relation'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'bodypart',
        userContent = false,
        adminRestriction = true;

    var sql = 'SELECT * FROM bodypart';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'bodypart.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:bodyPartId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE bodypart.id = ? AND bodypart.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.bodyPartId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.bodyPartId, adminRestriction);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.bodyPartId, adminRestriction);
        });

    router.route('/:bodyPartId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.bodyPartId, adminRestriction, userContent);
        });

    router.route('/:bodyPartId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.bodyPartId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
