'use strict';

var generic = require('../../lib/helper/generic'),
    creatures = require('../../lib/tables/creatures');

module.exports = function(router) {
    var tableName = 'creature';

    var sql = 'SELECT * FROM ' + tableName;

    generic.root(router, tableName, sql);

    router.route('/')
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

    generic.deleted(router, tableName, sql);

    // ID

    generic.get(router, tableName, sql);
    generic.put(router, tableName, false, true);
    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
