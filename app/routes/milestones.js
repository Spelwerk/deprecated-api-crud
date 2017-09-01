var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'milestone';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

    // Background

    router.route('/background/:backgroundId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'background_id = ?';

            sequel.get(req, res, next, call, [req.params.backgroundId]);
        });

    // Manifestation

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
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

    // Relations

    relations(router, 'assets', 'asset', true);
    relations(router, 'attributes', 'attribute', true);
    relations(router, 'augmentations', 'augmentation');
    relations(router, 'doctrines', 'doctrine', true);
    relations(router, 'loyalties', 'loyalty', true, true);
    relations(router, 'skills', 'skill', true);
    relations(router, 'weapons', 'weapon');
};
