var comment = require('../../lib/sql/comment'),
    ownership = require('../../lib/sql/ownership'),
    sequel = require('../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'weaponmod',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM weaponmod';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weaponmod.canon = 1 AND ' +
                'weaponmod.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // ID

    router.route('/:weaponModId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weaponmod.id = ? AND weaponmod.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.weaponModId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.weaponModId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.weaponModId, adminRestriction);
        });

    router.route('/:weaponModId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.weaponModId, useUpdateColumn);
        });

    router.route('/:weaponModId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.weaponModId, adminRestriction, userContent);
        });

    router.route('/:weaponModId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.weaponModId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.weaponModId);
        });

    router.route('/:weaponModId/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
