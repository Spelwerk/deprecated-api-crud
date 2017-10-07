'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership'),
    sequel = require('../sql/sequel');

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
