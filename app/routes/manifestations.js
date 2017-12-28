'use strict';

const routes = require('../../lib/generic/routes');
const relations = require('../../lib/generic/relations');
const elemental = require('../../lib/database/elemental');

const yaml = require('node-yaml');
const defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = (router) => {
    const tableName = 'manifestation';

    let query = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let attribute = {
                    name: req.body.power,
                    description: 'Power attribute for: ' + req.body.name,
                    icon: req.body.icon,
                    attributetype_id: defaults.attributeType.power,
                    optional: 1,
                    minimum: 0,
                    maximum: req.body.maximum
                };

                let manifestation = {
                    name: req.body.name,
                    description: req.body.description,
                    icon: req.body.icon
                };

                let skill = {
                    name: req.body.skill,
                    description: 'Skill for: ' + req.body.name,
                    icon: req.body.icon
                };

                manifestation.attribute_id = await elemental.insert(req, attribute, 'attribute');

                let id = await elemental.insert(req, manifestation, 'manifestation');
                skill.manifestation_id = id;

                await elemental.insert(req, skill, 'skill');

                res.status(201).send({id: id});
            } catch(e) {
                next(e);
            }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);
    routes.single(router, tableName, query);
    routes.update(router, tableName);

    routes.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
};
