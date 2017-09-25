var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    weapontypes = require('./../../lib/specific/weapontypes');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapontype';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            weapontypes.post(req, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });
    
    // Augmentation

    router.route('/augmentation/:augmentationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'augmentation_id = ?';

            sequel.get(req, res, next, call, [req.params.augmentationId]);
        });

    // Damage
    
    router.route('/damage/:damageId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'damage_id = ?';

            sequel.get(req, res, next, call, [req.params.damageId]);
        });

    // Expertise
    
    router.route('/expertise/:expertiseId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'expertise_id = ?';

            sequel.get(req, res, next, call, [req.params.expertiseId]);
        });

    // Skill
    
    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'skill_id = ?';

            sequel.get(req, res, next, call, [req.params.skillId]);
        });

    // Species
    
    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    // ID

    basic.id(router, sql, tableName);
    basic.canon(router);
    basic.clone(router, tableName);
    basic.comments(router);
    basic.labels(router);
    basic.ownership(router);
    basic.revive(router);
};
