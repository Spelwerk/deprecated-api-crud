'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'milestone';
    const query = 'SELECT ' +
        'milestone.id, ' +
        'milestone.name, ' +
        'milestone.description, ' +
        'background.id AS background_id, ' +
        'background.name AS background_name, ' +
        'manifestation.id AS manifestation_id, ' +
        'manifestation.name AS manifestation_name, ' +
        'species.id AS species_id, ' +
        'species.name AS species_name ' +
        'FROM epoch_has_milestone ' +
        'LEFT JOIN milestone ON milestone.id = epoch_has_milestone.milestone_id ' +
        'LEFT JOIN milestone_is_background ON milestone_is_background.milestone_id = milestone.id ' +
        'LEFT JOIN milestone_is_manifestation ON milestone_is_manifestation.milestone_id = milestone.id ' +
        'LEFT JOIN milestone_is_species ON milestone_is_species.milestone_id = milestone.id ' +
        'LEFT JOIN background ON background.id = milestone_is_background.background_id ' +
        'LEFT JOIN manifestation ON manifestation.id = milestone_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = milestone_is_species.species_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/milestones/default', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_milestone.epoch_id = ? AND ' +
            'milestone_is_manifestation.manifestation_id IS NULL AND ' +
            'milestone_is_species.species_id IS NULL AND ' +
            'milestone.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id]);
    });

    router.get('/:id/milestones/background/:background', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_milestone.epoch_id = ? AND ' +
            'milestone_is_background.background_id = ? AND ' +
            'milestone.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.background]);
    });

    router.get('/:id/milestones/manifestation/:manifestation', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_milestone.epoch_id = ? AND ' +
            'milestone_is_manifestation.manifestation_id = ? AND ' +
            'milestone.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.manifestation]);
    });

    router.get('/:id/milestones/species/:species', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_milestone.epoch_id = ? AND ' +
            'milestone_is_species.species_id = ? AND ' +
            'milestone.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.species]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};