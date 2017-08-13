var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapontype',
        userContent = true,
        adminRestriction = false;

    var sql = 'SELECT ' +
        'weapontype.id, ' +
        'weapontype.canon, ' +
        'weapontype.popularity, ' +
        'weapontype.name, ' +
        'weapontype.description, ' +
        'weapontype.damage_dice, ' +
        'weapontype.critical_dice, ' +
        'weapontype.hand, ' +
        'weapontype.initiative, ' +
        'weapontype.hit, ' +
        'weapontype.distance, ' +
        'weapontype.weapongroup_id, ' +
        'weapongroup.special, ' +
        'weapongroup.skill_id, ' +
        'weapongroup.expertise_id, ' +
        'weapongroup.damage_id, ' +
        'weapongroup.icon, ' +
        'weapontype.created, ' +
        'weapontype.updated, ' +
        'weapontype.deleted ' +
        'FROM weapontype ' +
        'LEFT JOIN weapongroup ON weapongroup.id = weapontype.weapongroup_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapontype.canon = 1 AND ' +
                'weapongroup.special = 0 AND ' +
                'weapontype.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    router.route('/special')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapontype.canon = 1 AND ' +
                'weapongroup.special = 1 AND ' +
                'weapontype.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    // Group

    router.route('/group/:groupId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapontype.canon = 1 AND ' +
                'weapontype.weapongroup_id = ? AND ' +
                'weapontype.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.groupId]);
        });

    // ID

    router.route('/:weaponTypeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapontype.id = ? AND weapontype.id IS NULL';

            sequel.get(req, res, next, call, [req.params.weaponTypeId]);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.weaponTypeId, adminRestriction);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.weaponTypeId, adminRestriction);
        });

    router.route('/:weaponTypeId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.weaponTypeId);
        });

    router.route('/:weaponTypeId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.weaponTypeId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.weaponTypeId);
        });

    router.route('/:weaponTypeId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.weaponTypeId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

};
