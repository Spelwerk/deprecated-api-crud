var ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'disease',
        userContent = false,
        adminRestriction = true,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM disease';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'disease.canon = 1 AND ' +
                'disease.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:diseaseId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE disease.id = ? AND disease.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.diseaseId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.diseaseId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.diseaseId, adminRestriction);
        });

    router.route('/:diseaseId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.diseaseId, useUpdateColumn);
        });

    router.route('/:diseaseId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.diseaseId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
