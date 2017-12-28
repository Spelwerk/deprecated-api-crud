'use strict'; //todo ASYNC/AWAIT

let generic = require('../../lib/helper/generic'),
    creatures = require('../../lib/helper/creatures');

module.exports = function(router) {
    const tableName = 'creature';

    let sql = 'SELECT ' +
        'id, ' +
        'copy_id, ' +
        'user_id, ' +
        'canon, ' +
        'updated, ' +
        'calculated, ' +
        'firstname, ' +
        'nickname, ' +
        'middlename, ' +
        'lastname, ' +
        'age, ' +
        'gender, ' +
        'occupation, ' +
        'appearance, ' +
        'biography, ' +
        'description, ' +
        'personality, ' +
        'drive, ' +
        'pride, ' +
        'problem, ' +
        'shame ' +
        'FROM creature ' +
        'LEFT JOIN creature_with_description ON creature_with_description.creature_id = creature.id ' +
        'LEFT JOIN creature_with_drive ON creature_with_drive.creature_id = creature.id ' +
        'LEFT JOIN creature_with_extra ON creature_with_extra.creature_id = creature.id ' +
        'LEFT JOIN creature_is_copy ON creature_is_copy.creature_id = creature.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            creatures.post(req.user, req.body, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);
    generic.get(router, tableName, sql);

    router.route('/:id')
        .put(function(req, res, next) {
            let creatureId = parseInt(req.params.id);

            creatures.put(req.user, creatureId, req.body, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    generic.automatic(router, tableName);

    // RELATIONS

    creatures.armours(router);
    creatures.assets(router);
    creatures.attributes(router);
    creatures.backgrounds(router);
    creatures.bionics(router);
    creatures.expertises(router);
    creatures.forms(router);
    creatures.gifts(router);
    creatures.imperfections(router);
    creatures.languages(router);
    creatures.loyalties(router);
    creatures.manifestations(router);
    creatures.milestones(router);
    creatures.primals(router);
    creatures.relations(router);
    creatures.shields(router);
    creatures.skills(router);
    creatures.species(router);
    creatures.spells(router);
    creatures.software(router);
    creatures.tactics(router);
    creatures.weapons(router);

    // COMBINATIONS

    creatures.corporation(router);
    creatures.country(router);
    creatures.epoch(router);
    creatures.identity(router);
    creatures.nature(router);
    creatures.wealth(router);
    creatures.world(router);

    // WOUNDS

    creatures.dementations(router);
    creatures.diseases(router);
    creatures.traumas(router);

};
