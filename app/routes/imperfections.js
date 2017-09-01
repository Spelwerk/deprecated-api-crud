var sequel = require('../../lib/sql/sequel');

var basic = require('./../../lib/generic/basic'),
    relations = require('./../../lib/generic/relations');

module.exports = function(router) {
    'use strict';

    var tableName = 'imperfection';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    basic.root(router, sql, tableName);

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

    relations(router, 'attributes', 'attribute', true);
    relations(router, 'expertises', 'expertise', true);
    relations(router, 'skills', 'skill', true);
};
