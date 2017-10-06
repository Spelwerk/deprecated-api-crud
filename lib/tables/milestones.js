'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership'),
    sequel = require('../sql/sequel');

/**
 * Creates a milestone in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param backgroundId Integer
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, backgroundId, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = description || null;
    backgroundId = parseInt(backgroundId) || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    var id;

    async.series([
        function(callback) {
            query('INSERT INTO milestone (user_id,name,description) VALUES (?,?,?)', [user.id, name, description], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            if(!backgroundId) return callback();

            query('INSERT INTO milestone_is_background (milestone_id,background_id) VALUES (?,?)', [id, backgroundId], callback);
        },
        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO milestone_is_manifestation (milestone_id,manifestation_id) VALUES (?,?)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO milestone_is_species (milestone_id,species_id) VALUES (?,?)', [id, speciesId], callback);
        },

        function(callback) {
            query('INSERT INTO user_has_milestone (user_id,milestone_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};

/**
 * Updates a milestone with new values
 *
 * @param user Object
 * @param id Integer
 * @param name String
 * @param description String
 * @param backgroundId Integer
 * @param manifestationId Integer
 * @param speciesId Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.put = function(user, id, name, description, backgroundId, manifestationId, speciesId, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    id = parseInt(id);

    var update = {
        name: name || null,
        description: description || null
    };

    backgroundId = parseInt(backgroundId) || null;
    manifestationId = parseInt(manifestationId) || null;
    speciesId = parseInt(speciesId) || null;

    async.series([
        function(callback) {
            ownership(user, 'background', id, callback);
        },

        function(callback) {
            var sql = 'UPDATE background SET ',
                values = [];

            for(var i in update) {
                if(update[i] !== null && update.hasOwnProperty(i)) {
                    sql += i + ' = ?,';
                    values.push(update[i]);
                }
            }

            if(values.length === 0) return callback();

            sql += 'updated = CURRENT_TIMESTAMP,';

            sql = sql.slice(0, -1) + ' WHERE id = ?';
            values.push(id);

            query(sql, values, callback);
        },

        function(callback) {
            if(!backgroundId) return callback();

            query('INSERT INTO milestone_is_background (milestone_id,background_id) VALUES (?,?) ON DUPLICATE KEY UPDATE background_id = VALUES(background_id)', [id, backgroundId], callback);
        },
        function(callback) {
            if(!manifestationId) return callback();

            query('INSERT INTO milestone_is_manifestation (milestone_id,manifestation_id) VALUES (?,?) ON DUPLICATE KEY UPDATE manifestation_id = VALUES(manifestation_id)', [id, manifestationId], callback);
        },
        function(callback) {
            if(!speciesId) return callback();

            query('INSERT INTO milestone_is_species (milestone_id,species_id) VALUES (?,?) ON DUPLICATE KEY UPDATE species_id = VALUES(species_id)', [id, speciesId], callback);
        }
    ], function(err) {
        callback(err);
    });
};

// RELATIONS

module.exports.loyalties = function(router) {
    var sql = 'SELECT ' +
        'milestone_has_loyalty.id, ' +
        'milestone_has_loyalty.milestone_id, ' +
        'milestone_has_loyalty.loyalty_id, ' +
        'milestone_has_loyalty.wealth_id, ' +
        'milestone_has_loyalty.occupation, ' +
        'loyalty.name AS loyalty_name, ' +
        'wealth.name AS wealth_name ' +
        'FROM milestone_has_loyalty ' +
        'LEFT JOIN loyalty ON loyalty.id = milestone_has_loyalty.loyalty_id ' +
        'LEFT JOIN wealth ON wealth.id = milestone_has_loyalty.wealth_id';

    router.route('/:id/loyalties')
        .get(function(req, res, next) {
            var call = sql + ' WHERE milestone_has_loyalty.milestone_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            var milestoneId = parseInt(req.params.id),
                loyaltyId = parseInt(req.body.insert_id),
                wealthId = parseInt(req.body.wealth_id),
                occupation = req.body.occupation || null,
                uqId;

            async.series([
                function(callback) {
                    ownership(req.user, 'milestone', milestoneId, callback);
                },
                function(callback) {
                    query('INSERT INTO milestone_has_loyalty (milestone_id,loyalty_id,wealth_id,occupation) VALUES (?,?,?,?)', [milestoneId, loyaltyId, wealthId, occupation], function(err, result) {
                        if(err) return callback(err);

                        uqId = result.insertId;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: uqId});
            });
        });

    router.route('/:id/loyalties/:uqId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'milestone_has_loyalty.milestone_id = ? AND ' +
                'milestone_has_loyalty.id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.uqId], true);
        })
        .put(function(req, res, next) {
            var milestoneId = parseInt(req.params.id),
                loyaltyId = parseInt(req.params.uqId),
                wealthId = parseInt(req.body.wealth_id) || null,
                occupation = req.body.occupation || null;

            async.series([
                function(callback) {
                    ownership(req.user, 'milestone', milestoneId, callback);
                },
                function(callback) {
                    query('UPDATE milestone_has_loyalty SET wealth_id = ?, occupation = ? WHERE milestone_id = ? AND loyalty_id = ?', [wealthId, occupation, milestoneId, loyaltyId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            var milestoneId = parseInt(req.params.id),
                loyaltyId = parseInt(req.params.uqId);

            async.series([
                function(callback) {
                    ownership(req.user, 'milestone', milestoneId, callback);
                },
                function(callback) {
                    query('DELETE FROM milestone_has_loyalty WHERE milestone_id = ? AND loyalty_id = ?', [milestoneId, loyaltyId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};