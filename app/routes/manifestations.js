var async = require('async');

var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    query = require('./../../lib/sql/query'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'manifestation',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM manifestation';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'manifestation.canon = 1 AND ' +
                'manifestation.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var power = {},
                skill = {},
                insert = {};

            insert.name = req.body.name;
            insert.description = req.body.description;
            insert.icon = req.body.icon;
            insert.affected = 0;

            power.name = req.body.power;
            skill.name = req.body.skill;

            async.series([
                function(callback) {
                    query('INSERT INTO skill (name,manifestation) VALUES (?,1)', [skill.name], function(err, result) {
                        if(err) return callback(err);

                        skill.id = result.insertId;
                        insert.affected += result.affectedRows;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_has_skill (user_id,skill_id,owner) VALUES (?,?,1)', [req.user.id, skill.id], callback);
                },
                function (callback) {
                    query('INSERT INTO attribute (name,attributetype_id) VALUES (?,9)', [power.name], function(err, result) {
                        if(err) return callback(err);

                        power.id = result.insertId;
                        insert.affected += result.affectedRows;

                        callback();
                    })
                },
                function(callback) {
                    query('INSERT INTO user_has_attribute (user_id,attribute_id,owner) VALUES (?,?,1)', [req.user.id, power.id], callback);
                },
                function (callback) {
                    query('INSERT INTO manifestation (name,description,icon,power_id,skill_id) VALUES (?,?,?,?,?)', [insert.name, insert.description, insert.icon, power.id, skill.id], function(err, result) {
                        if(err) return callback(err);

                        insert.id = result.insertId;
                        insert.affected += result.affectedRows;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_has_manifestation (user_id,manifestation_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                var message = 'Created new row in manifestation, skill, attribute';

                res.status(201).send({success: true, message: message, affected: insert.affected, id: insert.id});
            });
        });

    // ID

    router.route('/:manifestationId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE manifestation.id = ? AND manifestation.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.manifestationId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.manifestationId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.manifestationId, adminRestriction);
        });

    router.route('/:manifestationId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.manifestationId, useUpdateColumn);
        });

    router.route('/:manifestationId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.manifestationId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.manifestationId);
        });

    router.route('/:manifestationId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.manifestationId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });
};
