'use strict';

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
        'shame, ' +
        'point_expertise, ' +
        'point_gift, ' +
        'point_imperfection, ' +
        'point_milestone, ' +
        'point_primal, ' +
        'point_skill ' +
        'FROM creature ' +
        'LEFT JOIN creature_age ON creature_age.creature_id = creature.id ' +
        'LEFT JOIN creature_gender ON creature_gender.creature_id = creature.id ' +
        'LEFT JOIN creature_occupation ON creature_occupation.creature_id = creature.id ' +
        'LEFT JOIN creature_appearance ON creature_appearance.creature_id = creature.id ' +
        'LEFT JOIN creature_biography ON creature_biography.creature_id = creature.id ' +
        'LEFT JOIN creature_description ON creature_description.creature_id = creature.id ' +
        'LEFT JOIN creature_personality ON creature_personality.creature_id = creature.id ' +
        'LEFT JOIN creature_drive ON creature_drive.creature_id = creature.id ' +
        'LEFT JOIN creature_pride ON creature_pride.creature_id = creature.id ' +
        'LEFT JOIN creature_problem ON creature_problem.creature_id = creature.id ' +
        'LEFT JOIN creature_shame ON creature_shame.creature_id = creature.id ' +
        'LEFT JOIN creature_points ON creature_points.creature_id = creature.id ' +
        'LEFT JOIN creature_is_copy ON creature_is_copy.creature_id = creature.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let firstName = req.body.firstname,
                worldId = req.body.world_id,
                speciesId = req.body.species_id;

            let optional = {
                nickName: req.body.nickname,
                middleName: req.body.middlename,
                lastName: req.body.lastname,
                description: req.body.description
            };

            creatures.post(req.user, firstName, worldId, speciesId, optional, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);

    router.route('/:id')
        .put(function(req, res, next) {
            let id = req.params.id;

            let optional = {
                firstName: req.body.firstname,
                nickName: req.body.nickname,
                middleName: req.body.middlename,
                lastName: req.body.lastname,

                calculated: req.body.calculated,
                manifestation: req.body.manifestation,
                appearance: req.body.appearance,

                age: req.body.age,

                biography: req.body.biography,
                description: req.body.description,
                drive: req.body.drive,
                gender: req.body.gender,
                occupation: req.body.occupation,
                personality: req.body.personality,
                pride: req.body.pride,
                problem: req.body.problem,
                shame: req.body.shame,

                corporationId: req.body.corporation_id,
                countryId: req.body.country_id,
                identityId: req.body.identity_id,
                natureId: req.body.nature_id,
                wealthId: req.body.wealth_id,

                pointDoctrine: req.body.point_primal,
                pointExpertise: req.body.point_expertise,
                pointGift: req.body.point_gift,
                pointImperfection: req.body.point_imperfection,
                pointMilestone: req.body.point_milestone,
                pointSkill: req.body.point_skill
            };

            creatures.put(req.user, id, optional, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    generic.automatic(router, tableName);

    // RELATIONS

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
    creatures.protection(router);
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
    creatures.identity(router);
    creatures.nature(router);
    creatures.wealth(router);
    creatures.world(router);

    // WOUNDS

    creatures.dementations(router);
    creatures.diseases(router);
    creatures.traumas(router);

};
