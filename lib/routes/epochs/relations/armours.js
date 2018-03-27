'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'armour';
    const query = 'SELECT ' +
        'armour.id, ' +
        'armour.name, ' +
        'armour.description, ' +
        'armour.icon, ' +
        'armour.price, ' +
        'bodypart.id AS bodypart_id, ' +
        'bodypart.name AS bodypart_name ' +
        'FROM epoch_has_armour ' +
        'LEFT JOIN armour ON armour.id = epoch_has_armour.armour_id ' +
        'LEFT JOIN bodypart ON bodypart.id = armour.bodypart_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/armours/bodypart/:bodypart', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_armour.epoch_id = ? AND ' +
            'armour.bodypart_id = ? AND ' +
            'armour.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.bodypart]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};