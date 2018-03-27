'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'background';
    const query = 'SELECT ' +
        'background.id, ' +
        'background.name, ' +
        'background.description, ' +
        'background.icon, ' +
        'manifestation.id AS manifestation_id,' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name ' +
        'FROM epoch_has_background ' +
        'LEFT JOIN background ON background.id = epoch_has_background.background_id ' +
        'LEFT JOIN background_is_manifestation ON background_is_manifestation.background_id = background.id ' +
        'LEFT JOIN background_is_species ON background_is_species.background_id = background.id ' +
        'LEFT JOIN manifestation ON manifestation.id = background_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = background_is_species.species_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/backgrounds/default', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_background.epoch_id = ? AND ' +
            'background_is_manifestation.manifestation_id IS NULL AND ' +
            'background_is_species.species_id IS NULL AND ' +
            'background.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id]);
    });

    router.get('/:id/backgrounds/manifestation/:manifestation', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_background.epoch_id = ? AND ' +
            'background_is_manifestation.manifestation_id = ? AND ' +
            'background.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.manifestation]);
    });

    router.get('/:id/backgrounds/species/:species', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_background.epoch_id = ? AND ' +
            'background_is_species.species_id = ? AND ' +
            'background.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.species]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};