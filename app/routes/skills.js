var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'skill',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM skill';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'skill.canon = 1 AND ' +
                'skill.species_id IS NULL AND ' +
                'skill.manifestation = 0 AND ' +
                'skill.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Species

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'skill.canon = 1 AND ' +
                'skill.species_id = ? AND ' +
                'skill.manifestation = 0 AND ' +
                'skill.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // ID

    router.route('/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE skill.id = ? AND skill.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.skillId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.skillId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.skillId, adminRestriction);
        });

    router.route('/:skillId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.skillId, useUpdateColumn);
        });

    router.route('/:skillId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.skillId, adminRestriction, userContent);
        });

    router.route('/:skillId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.skillId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.skillId);
        });

    router.route('/:skillId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.skillId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
