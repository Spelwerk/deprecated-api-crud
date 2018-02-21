'use strict';

const sql = require('../database/sql');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.corporation = (router) => {
    router.get('/:id/corporation', async (req, res, next) => {
        let call = 'SELECT ' +
            'corporation.id, ' +
            'corporation.name, ' +
            'corporation.description ' +
            'FROM creature_is_corporation ' +
            'LEFT JOIN corporation ON corporation.id = creature_is_corporation.corporation_id ' +
            'WHERE creature_is_corporation.creature_id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            return next(e);
        }
    });
};

module.exports.country = (router) => {
    router.get('/:id/country', async (req, res, next) => {
        let call = 'SELECT ' +
            'country.id, ' +
            'country.name, ' +
            'country.description ' +
            'FROM creature_is_country ' +
            'LEFT JOIN country ON country.id = creature_is_country.country_id ' +
            'WHERE creature_is_country.creature_id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            return next(e);
        }
    });
};

module.exports.epoch = (router) => {
    router.get('/:id/epoch', async (req, res, next) => {
        let call = 'SELECT ' +
            'epoch.id, ' +
            'epoch.name, ' +
            'epoch.description ' +
            'FROM creature ' +
            'LEFT JOIN epoch ON epoch.id = creature.epoch_id ' +
            'WHERE creature.id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            next(e);
        }
    });
};

module.exports.identity = (router) => {
    router.get('/:id/identity', async (req, res, next) => {
        let call = 'SELECT ' +
            'identity.id, ' +
            'identity.name, ' +
            'identity.description, ' +
            'identity.icon ' +
            'FROM creature_is_identity ' +
            'LEFT JOIN identity ON identity.id = creature_is_identity.identity_id ' +
            'WHERE creature_is_identity.creature_id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            next(e);
        }
    });
};

module.exports.nature = (router) => {
    router.get('/:id/nature', async (req, res, next) => {
        let call = 'SELECT ' +
            'nature.id, ' +
            'nature.name, ' +
            'nature.description, ' +
            'nature.icon ' +
            'FROM creature_is_nature ' +
            'LEFT JOIN nature ON nature.id = creature_is_nature.nature_id ' +
            'WHERE creature_is_nature.creature_id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            next(e);
        }
    });
};

module.exports.species = (router) => {
    router.get('/:id/species', async (req, res, next) => {
        let call = 'SELECT ' +
            'species.id, ' +
            'species.name, ' +
            'species.description, ' +
            'species.icon, ' +
            'species.manifestation, ' +
            'species.max_age, ' +
            'species.multiply_points ' +
            'FROM creature_is_species ' +
            'LEFT JOIN species ON species.id = creature_is_species.species_id ' +
            'WHERE creature_is_species.creature_id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            next(e);
        }
    });
};

module.exports.wealth = (router) => {
    router.get('/:id/wealth', async (req, res, next) => {
        let call = 'SELECT ' +
            'wealth.id, ' +
            'wealth.name, ' +
            'wealth.description, ' +
            'wealth.icon ' +
            'FROM creature_is_wealth ' +
            'LEFT JOIN wealth ON wealth.id = creature_is_wealth.wealth_id ' +
            'WHERE creature_is_wealth.creature_id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            next(e);
        }
    });
};

module.exports.world = (router) => {
    router.get('/:id/world', async (req, res, next) => {
        let call = 'SELECT ' +
            'world.id, ' +
            'world.name, ' +
            'world.description ' +
            'FROM creature ' +
            'LEFT JOIN epoch ON epoch.id = creature.epoch_id ' +
            'LEFT JOIN world ON world.id = epoch.world_id ' +
            'WHERE creature.id = ?';

        try {
            let [rows] = await sql(call, [req.params.id]);
            let result = rows.length !== 0 ? rows[0] : null;

            res.status(200).send({result: result});
        } catch(e) {
            next(e);
        }
    });
};
