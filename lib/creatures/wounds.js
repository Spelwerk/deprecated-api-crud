'use strict';

const basic = require('../generic/basics');
const wounds = require('../relations/creatures/wounds');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

function woundRoute(router, table, route) {
    const query = 'SELECT ' +
        'creature_has_' + table + '.id, ' +
        'creature_has_' + table + '.value, ' +
        'creature_has_' + table + '.healed, ' +
        table + '.name ' +
        'FROM creature_has_' + table + ' ' +
        'LEFT JOIN ' + table + ' ON ' + table + '.id = creature_has_' + table + '.' + table + '_id';

    router.route('/:id/' + route)
        .get(async (req, res, next) => {
            let call = query + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        })
        .post(async (req, res, next) => {
            await wounds.insert(req, res, next, table, req.params.id);
        });

    router.route('/:id/' + route + '/:item')
        .get(async (req, res, next) => {
            let call = query + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.id = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.item], true);
        })
        .put(async (req, res, next) => {
            await wounds.update(req, res, next, table, req.params.id, req.params.item);
        })
        .delete(async (req, res, next) => {
            await wounds.remove(req, res, next, table, req.params.id, req.params.item);
        });

    router.route('/:id/' + route + '/:item/heal/:healed')
        .put(async (req, res, next) => {
            await wounds.heal(req, res, next, table, req.params.id, req.params.item, req.params.healed);
        });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.dementations = (router) => {
    woundRoute(router, 'dementation', 'dementations');
};

module.exports.diseases = (router) => {
    woundRoute(router, 'disease', 'diseases');
};

module.exports.traumas = (router) => {
    woundRoute(router, 'trauma', 'traumas');
};
