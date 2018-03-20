'use strict';

const routes = require('../../lib/routes/generic/routes');
const basic = require('../../lib/routes/generic/generic');
const skills = require('../../lib/routes/skills/skills');

module.exports = (router) => {
    const tableName = 'skill';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'skill.id, ' +
        'skill.canon, ' +
        'skill.name, ' +
        'skill.description, ' +
        'skill.icon, ' +
        'skill.optional, ' +
        'skill.maximum, ' +
        'skill.created, ' +
        'skill.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name, ' +
        'skill_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM skill ' +
        'LEFT JOIN skill_is_manifestation ON skill_is_manifestation.skill_id = skill.id ' +
        'LEFT JOIN skill_is_species ON skill_is_species.skill_id = skill.id ' +
        'LEFT JOIN skill_is_copy ON skill_is_copy.skill_id = skill.id ' +
        'LEFT JOIN manifestation ON manifestation.id = skill_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = skill_is_species.species_id ' +
        'LEFT JOIN user ON user.id = skill.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await skills.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);

    router.route('/manifestation/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN skill_is_manifestation ON skill_is_manifestation.skill_id = skill.id ' +
                'WHERE ' +
                'skill.deleted IS NULL AND ' +
                'skill_is_manifestation.manifestation_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/species/:id')
        .get(async (req, res, next) => {
            let call = rootQuery + ' ' +
                'LEFT JOIN skill_is_species ON skill_is_species.skill_id = skill.id ' +
                'WHERE ' +
                'skill.deleted IS NULL AND ' +
                'skill_is_species.species_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
