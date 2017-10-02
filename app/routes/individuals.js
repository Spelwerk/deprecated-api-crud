'use strict';

var async = require('async');

var generic = require('../../lib/helper/generic'),
    creatures = require('../../lib/tables/creatures'),
    individuals = require('../../lib/tables/individuals');

module.exports = function(router) {
    var tableName = 'creature';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN creature ON creature.id = individual.creature_id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var individualId,
                name = req.body.name,
                description = req.body.description,
                worldId = req.body.world_id,
                speciesId = req.body.species_id,
                manifestation = req.body.manifestation,
                age = req.body.age,
                firstName = req.body.firstname,
                lastName = req.body.lastname,
                gender = req.body.gender,
                occupation = req.body.occupation;

            async.series([
                function(callback) {
                    creatures.post(req.user, name, description, worldId, speciesId, function(err, id) {
                        if(err) return callback(err);

                        individualId = id;

                        callback();
                    });
                },
                function(callback) {
                    individuals.post(req.user, individualId, manifestation, age, firstName, lastName, gender, occupation, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: individualId});
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
