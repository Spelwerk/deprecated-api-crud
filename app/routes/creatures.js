'use strict';

const routes = require('../../lib/routes/generic/routes');
const creatures = require('../../lib/routes/creatures/creatures');
const relations = require('../../lib/routes/creatures/relations/routes');
const combinations = require('../../lib/routes/creatures/combinations/routes');
const wounds = require('../../lib/routes/creatures/wounds/routes');

module.exports = (router) => {
    const tableName = 'creature';

    const rootQuery = 'SELECT ' +
        'creature.id, ' +
        'creature.canon, ' +
        'creature.template, ' +
        'creature.nickname, ' +
        'creature.firstname, ' +
        'creature.middlename, ' +
        'creature.lastname, ' +
        'creature.age, ' +
        'creature.gender, ' +
        'creature.occupation,' +
        'creature.created ' +
        'FROM creature';

    const singleQuery = 'SELECT ' +
        'creature.id, ' +
        'creature.canon, ' +
        'creature.template, ' +
        'creature.nickname, ' +
        'creature.firstname, ' +
        'creature.middlename, ' +
        'creature.lastname, ' +
        'creature.age, ' +
        'creature.gender, ' +
        'creature.occupation, ' +
        'creature_with_description.appearance, ' +
        'creature_with_description.biography, ' +
        'creature_with_description.description, ' +
        'creature_with_description.personality, ' +
        'creature_with_description.species, ' +
        'creature_with_description.drive, ' +
        'creature_with_description.pride, ' +
        'creature_with_description.problem, ' +
        'creature_with_description.shame, ' +
        'creature.created, ' +
        'creature.updated, ' +
        'creature_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM creature ' +
        'LEFT JOIN creature_with_description ON creature_with_description.creature_id = creature.id ' +
        'LEFT JOIN creature_is_copy ON creature_is_copy.creature_id = creature.id ' +
        'LEFT JOIN user ON user.id = creature.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await creatures.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // RELATIONS

    relations.armours(router);
    relations.assets(router);
    relations.attributes(router);
    relations.backgrounds(router);
    relations.bionics(router);
    relations.currencies(router);
    relations.expertises(router);
    relations.forms(router);
    relations.gifts(router);
    relations.imperfections(router);
    relations.languages(router);
    relations.loyalties(router);
    relations.manifestations(router);
    relations.milestones(router);
    relations.primals(router);
    relations.relations(router);
    relations.shields(router);
    relations.skills(router);
    relations.spells(router);
    relations.software(router);
    relations.tactics(router);
    relations.weapons(router);

    // COMBINATIONS

    combinations.corporation(router);
    combinations.country(router);
    combinations.epoch(router);
    combinations.identity(router);
    combinations.nature(router);
    combinations.species(router);
    combinations.wealth(router);
    combinations.world(router);

    // WOUNDS

    wounds.dementations(router);
    wounds.diseases(router);
    wounds.traumas(router);
};
