'use strict';

const routes = require('../../lib/generic/routes');
const creatures = require('../../lib/creatures/creatures');
const relations = require('../../lib/creatures/relations');
const combinations = require('../../lib/creatures/combinations');
const wounds = require('../../lib/creatures/wounds');

module.exports = (router) => {
    const tableName = 'creature';
    const queryList = 'SELECT ' +
        'id,' +
        'canon,' +
        'calculated,' +
        'firstname,' +
        'nickname,' +
        'middlename,' +
        'lastname,' +
        'age,' +
        'gender,' +
        'occupation ' +
        'FROM creature ' +
        'LEFT JOIN creature_with_description ON creature_with_description.creature_id = creature.id ' +
        'LEFT JOIN creature_with_extra ON creature_with_extra.creature_id = creature.id';
    const querySingle = 'SELECT ' +
        'id, ' +
        'copy_id, ' +
        'user_id, ' +
        'canon, ' +
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
        'shame, ' +
        'created, ' +
        'updated, ' +
        'deleted ' +
        'FROM creature ' +
        'LEFT JOIN creature_with_description ON creature_with_description.creature_id = creature.id ' +
        'LEFT JOIN creature_with_drive ON creature_with_drive.creature_id = creature.id ' +
        'LEFT JOIN creature_with_extra ON creature_with_extra.creature_id = creature.id ' +
        'LEFT JOIN creature_is_copy ON creature_is_copy.creature_id = creature.id';

    routes.root(router, tableName, queryList);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await creatures.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, queryList);
    routes.schema(router, tableName);
    routes.single(router, tableName, querySingle);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // RELATIONS

    relations.armours(router);
    relations.assets(router);
    relations.attributes(router);
    relations.backgrounds(router);
    relations.bionics(router);
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
    relations.species(router);
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
    combinations.wealth(router);
    combinations.world(router);

    // WOUNDS

    wounds.dementations(router);
    wounds.diseases(router);
    wounds.traumas(router);
};
