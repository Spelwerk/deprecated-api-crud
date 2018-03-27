'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'gift';
    const query = 'SELECT ' +
        'gift.id, ' +
        'gift.name, ' +
        'gift.description, ' +
        'gift.icon, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id,' +
        'species.name AS species_name ' +
        'FROM epoch_has_gift ' +
        'LEFT JOIN gift ON gift.id = epoch_has_gift.gift_id ' +
        'LEFT JOIN gift_is_manifestation ON gift_is_manifestation.gift_id = gift.id ' +
        'LEFT JOIN gift_is_species ON gift_is_species.gift_id = gift.id ' +
        'LEFT JOIN manifestation ON manifestation.id = gift_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = gift_is_species.species_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/gifts/default', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_gift.epoch_id = ? AND ' +
            'gift_is_manifestation.manifestation_id IS NULL AND ' +
            'gift_is_species.species_id IS NULL AND ' +
            'gift.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id]);
    });

    router.get('/:id/gifts/manifestation/:manifestation', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_gift.epoch_id = ? AND ' +
            'gift_is_manifestation.manifestation_id = ? AND ' +
            'gift.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.manifestation]);
    });

    router.get('/:id/gifts/species/:species', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_gift.epoch_id = ? AND ' +
            'gift_is_species.species_id = ? AND ' +
            'gift.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.species]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};