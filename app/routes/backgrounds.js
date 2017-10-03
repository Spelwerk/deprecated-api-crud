'use strict';

var generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations'),
    sequel = require('../../lib/sql/sequel'),
    backgrounds = require('../../lib/tables/backgrounds');

module.exports = function(router) {
    var tableName = 'background';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_manifestation ON ' + tableName + '_is_manifestation.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN ' + tableName + '_is_species ON ' + tableName + '_is_species.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                icon = req.body.icon,
                manifestationId = req.body.manifestation_id,
                speciesId = req.body.species_id;

            backgrounds.post(req.user, name, description, icon, manifestationId, speciesId, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            })
        });

    generic.deleted(router, tableName, sql);

    router.route('/manifestation/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            sequel.get(req, res, next, call, [req.params.manifestationId]);
        });

    router.route('/species/:speciesId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            sequel.get(req, res, next, call, [req.params.speciesId]);
        });

    generic.get(router, tableName, sql);

    router.route('/:id')
        .put(function(req, res, next) {
            var id = req.params.id,
                name = req.body.name,
                description = req.body.description,
                icon = req.body.icon,
                manifestationId = req.body.manifestation_id,
                speciesId = req.body.species_id;

            backgrounds.put(req.user, id, name, description, icon, manifestationId, speciesId, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'assets', 'asset');
    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'bionics', 'bionic');
    relations(router, tableName, 'doctrines', 'doctrine');
    relations(router, tableName, 'skills', 'skill');
    relations(router, tableName, 'weapons', 'weapon');
};
