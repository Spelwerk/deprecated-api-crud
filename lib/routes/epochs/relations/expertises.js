'use strict';

const basic = require('../../generic/generic');
const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'expertise';
    const query = 'SELECT ' +
        'expertise.id, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'expertise.maximum, ' +
        'expertise.skill_requirement, ' +
        'skill.icon AS skill_icon ' +
        'FROM epoch_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = epoch_has_expertise.expertise_id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id ' +
        'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
        'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
        'LEFT JOIN manifestation ON manifestation.id = expertise_is_manifestation.manifestation_id ' +
        'LEFT JOIN species ON species.id = expertise_is_species.species_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/expertises/skill/:skill', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_expertise.epoch_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise_is_manifestation.manifestation_id IS NULL AND ' +
            'expertise_is_species.species_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.skill]);
    });

    router.get('/:id/expertises/skill/:skill/manifestation/:manifestation', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_expertise.epoch_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise_is_manifestation.manifestation_id = ? AND ' +
            'expertise.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.skill, req.params.manifestation]);
    });

    router.get('/:id/expertises/skill/:skill/species/:species', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'epoch_has_expertise.epoch_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise_is_species.species_id = ? AND ' +
            'expertise.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.skill, req.params.species]);
    });

    defaults.itemGet(router, 'epoch', table, query);
    defaults.itemPut(router, 'epoch', table);
    defaults.itemDelete(router, 'epoch', table);
};