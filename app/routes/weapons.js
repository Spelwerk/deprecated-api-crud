var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapon',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT ' +
        'weapon.id, ' +
        'weapon.canon, ' +
        'weapon.popularity, ' +
        'weapon.name, ' +
        'weapon.description, ' +
        'weapon.species, ' +
        'weapon.augmentation, ' +
        'weapon.damage_bonus, ' +
        'weapon.price, ' +
        'weapon.legal, ' +
        'weapon.weapontype_id, ' +
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
        'weapon.created, ' +
        'weapon.updated, ' +
        'weapon.deleted ' +
        'FROM weapon ' +
        'LEFT JOIN weapontype ON weapontype.id = weapon.weapontype_id ' +
        'LEFT JOIN weapongroup ON weapongroup.id = weapontype.weapongroup_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapon.canon = 1 AND ' +
                'weapon.species = 0 AND ' +
                'weapon.augmentation = 0 AND ' +
                'weapon.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, adminRestriction, userContent);
        });

    // Augmentation

    router.route('/augmentation')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapon.species = 0 AND ' +
                'weapon.augmentation = 1 AND ' +
                'weapon.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    // Species

    router.route('/species')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapon.species = 1 AND ' +
                'weapon.augmentation = 0 AND ' +
                'weapon.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    // Types

    router.route('/type/:typeId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapon.canon = 1 AND ' +
                'weapon.species = 1 AND ' +
                'weapon.augmentation = 0 AND ' +
                'weapon.weapontype_id = ? AND ' +
                'weapon.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.typeId]);
        });

    // ID

    router.route('/:weaponId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapon.id = ? AND weapon.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.weaponId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.weaponId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.weaponId, adminRestriction);
        });

    router.route('/:weaponId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.weaponId, useUpdateColumn);
        });

    router.route('/:weaponId/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.weaponId, adminRestriction, userContent);
        });

    router.route('/:weaponId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.weaponId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.weaponId);
        });

    router.route('/:weaponId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.weaponId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};
