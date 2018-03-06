'use strict';

const routes = require('../../lib/generic/routes');
const spells = require('../../lib/tables/spells');

module.exports = (router) => {
    const tableName = 'spell';

    const rootQuery = 'SELECT id, canon, name, icon, created FROM ' + tableName;

    const singleQuery = 'SELECT ' +
        'spell.id, ' +
        'spell.canon, ' +
        'spell.name, ' +
        'spell.description, ' +
        'spell.effects, ' +
        'spell.icon, ' +
        'spell.cost, ' +
        'spell.effect_dice, ' +
        'spell.effect_bonus, ' +
        'spell.created, ' +
        'spell.updated, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'spelltype.id AS type_id, ' +
        'spelltype.name AS type_name, ' +
        'attribute.id AS damage_id, ' +
        'attribute.name AS damage_name, ' +
        'spell.damage_dice, ' +
        'spell.damage_bonus, ' +
        'spell.critical_dice, ' +
        'spell.critical_bonus, ' +
        'spell.distance, ' +
        'spell_is_copy.copy_id, ' +
        'user.id AS user_id, ' +
        'user.displayname AS user_name ' +
        'FROM spell ' +
        'LEFT JOIN spell_is_copy ON spell_is_copy.spell_id = spell.id ' +
        'LEFT JOIN manifestation ON manifestation.id = spell.manifestation_id ' +
        'LEFT JOIN spelltype ON spelltype.id = spell.spelltype_id ' +
        'LEFT JOIN attribute ON attribute.id = spell.attribute_id ' +
        'LEFT JOIN user ON user.id = spell.user_id';

    routes.root(router, tableName, rootQuery);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await spells.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) {
                return next(e);
            }
        });

    routes.removed(router, tableName, rootQuery);
    routes.schema(router, tableName);
    routes.single(router, tableName, singleQuery);
    routes.update(router, tableName);

    routes.automatic(router, tableName);
};
