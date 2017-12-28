'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basic');
const elemental = require('../../lib/database/elemental');

module.exports = (router) => {
    const tableName = 'skill';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id ' +
        'LEFT JOIN skill_is_manifestation ON skill_is_manifestation.skill_id = skill.id ' +
        'LEFT JOIN skill_is_species ON skill_is_species.skill_id = skill.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let skill = {
                    name: req.body.name,
                    description: req.body.description,
                    icon: req.body.icon,
                    manifestation_id: req.body.manifestation_id,
                    species_id: req.body.species_id
                };

                let expertise = {
                    name: req.body.name,
                    description: 'Generic expertise used where the other expertises do not fit, and you still want to show you are extra good at something. You can use the Custom Description field to explain where this is applicable for your character. Remember that if you have a suggestion for a new expertise you can easily add it to the game system and your own created worlds. If the new expertise is of great quality it may even be adopted as canon by Spelwerk.',
                    manifestation_id: req.body.manifestation_id,
                    species_id: req.body.species_id
                };

                expertise.skill_id = await elemental.insert(req, skill, 'skill');

                await elemental.insert(req, expertise, 'expertise');

                res.status(201).send({id: skillId});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND ' +
                'species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
