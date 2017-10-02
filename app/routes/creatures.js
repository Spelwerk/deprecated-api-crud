'use strict';

var sequel = require('../../lib/sql/sequel');

var generic = require('../../lib/helper/generic'),
    creatures = require('../../lib/tables/creatures');

module.exports = function(router) {
    var tableName = 'creature';

    var sql = 'SELECT * FROM ' + tableName + ' LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                worldId = req.body.world_id,
                speciesId = req.body.species_id;

            creatures.post(req.user, name, description, worldId, speciesId, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // ID

    generic.id(router, sql, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
