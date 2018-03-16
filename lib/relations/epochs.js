'use strict';

const basic = require('../generic/basics');
const defaults = require('./utilities/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.backgrounds = (router) => {
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

module.exports.expertises = (router) => {
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
        'LEFT JOIN skill ON skill.id = expertise.skill_id';

    defaults.rootGet(router, 'epoch', table, query);
    defaults.rootPost(router, 'epoch', table);

    router.get('/:id/expertises/skill/:skill', async (req, res, next) => {
        let call = query + ' ' +
            'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
            'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
            'WHERE ' +
            'epoch_has_expertise.epoch_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise_is_manifestation.manifestation_id IS NULL AND ' +
            'expertise_is_species.species_id IS NULL AND ' +
            'expertise.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.skill]);
    });

    router.get('/:id/expertises/skill/:skill/manifestation/:manifestation', async (req, res, next) => {
        let call = query + ' ' +
            'LEFT JOIN expertise_is_manifestation ON expertise_is_manifestation.expertise_id = expertise.id ' +
            'WHERE ' +
            'epoch_has_expertise.epoch_id = ? AND ' +
            'expertise.skill_id = ? AND ' +
            'expertise_is_manifestation.manifestation_id = ? AND ' +
            'expertise.deleted IS NULL';

        await basic.select(req, res, next, call, [req.params.id, req.params.skill, req.params.manifestation]);
    });

    router.get('/:id/expertises/skill/:skill/species/:species', async (req, res, next) => {
        let call = query + ' ' +
            'LEFT JOIN expertise_is_species ON expertise_is_species.expertise_id = expertise.id ' +
            'WHERE ' +
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

module.exports.gifts = (router) => {
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

module.exports.imperfections = (router) => {
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

module.exports.manifestations = (router) => {
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

module.exports.milestones = (router) => {
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
