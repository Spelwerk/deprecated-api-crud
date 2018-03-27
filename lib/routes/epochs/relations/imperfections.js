'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'imperfection';
    const query = 'SELECT ' +
        'imperfection.id, ' +
        'imperfection.name, ' +
        'imperfection.description, ' +
        'imperfection.icon, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id,' +
        'species.name AS species_name ' +
        'FROM epoch_has_imperfection ' +
        'LEFT JOIN imperfection ON imperfection.id = epoch_has_imperfection.imperfection_id ' +
        'LEFT JOIN imperfection_is_manifestation ON imperfection_is_manifestation.imperfection_id = imperfection.id ' +
        'LEFT JOIN imperfection_is_species ON imperfection_is_species.imperfection_id = imperfection.id ' +
        'LEFT JOIN manifestation ON manifestation.id = imperfection_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = imperfection_is_species.species_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/imperfections/default', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_imperfection.epoch_id = ? AND ' +
            'imperfection_is_manifestation.manifestation_id IS NULL AND ' +
            'imperfection_is_species.species_id IS NULL AND ' +
            'imperfection.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id]);
    });

    router.get('/:id/imperfections/manifestation/:manifestation', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_imperfection.epoch_id = ? AND ' +
            'imperfection_is_manifestation.manifestation_id = ? AND ' +
            'imperfection.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.manifestation]);
    });

    router.get('/:id/imperfections/species/:species', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_imperfection.epoch_id = ? AND ' +
            'imperfection_is_species.species_id = ? AND ' +
            'imperfection.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.species]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};