'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'manifestation';
    const query = 'SELECT ' +
        'manifestation.id, ' +
        'manifestation.name, ' +
        'manifestation.description, ' +
        'manifestation.icon,' +
        'species.id AS species_id,' +
        'species.name AS species_name ' +
        'FROM epoch_has_manifestation ' +
        'LEFT JOIN manifestation ON manifestation.id = epoch_has_manifestation.manifestation_id ' +
        'LEFT JOIN manifestation_is_species ON manifestation_is_species.manifestation_id = manifestation.id ' +
        'LEFT JOIN species ON species.id = manifestation_is_species.species_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/manifestations/default', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_manifestation.epoch_id = ? AND ' +
            'manifestation_is_species.species_id IS NULL AND ' +
            'manifestation.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id]);
    });

    router.get('/:id/manifestations/species/:species', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_manifestation.epoch_id = ? AND ' +
            'manifestation_is_species.species_id = ? AND ' +
            'manifestation.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.species]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};