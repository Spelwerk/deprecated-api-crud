var async = require('async');

var comment = require('./../../lib/sql/comment'),
    ownership = require('./../../lib/sql/ownership'),
    query = require('./../../lib/sql/query'),
    sequel = require('./../../lib/sql/sequel');

module.exports = function(router) {
    'use strict';

    var tableName = 'weapongroup',
        userContent = true,
        adminRestriction = false,
        useUpdateColumn = true;

    var sql = 'SELECT * FROM weapongroup';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapongroup.canon = 1 AND ' +
                'weapongroup.special = 0 AND ' +
                'weapongroup.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var skill = {},
                expertise = {},
                damage = {},
                insert = {};

            skill.id = req.body.skill_id;

            expertise.name = req.body.name + ' Mastery';

            damage.id = req.body.damage_id;

            insert.name = req.body.name;
            insert.description = req.body.description;
            insert.special = req.body.special;
            insert.icon = req.body.icon;
            insert.affected = 0;

            async.series([
                function(callback) {
                    query('INSERT INTO expertise (name,description,skill_id) VALUES (?,?,?)', [expertise.name, insert.description, skill.id], function(err, result) {
                        if(err) return callback(err);

                        expertise.id = result.insertId;
                        insert.affected += result.affectedRows;

                        callback();
                    })
                },
                function(callback) {
                    query('INSERT INTO user_has_expertise (user_id,expertise_id,owner) VALUES (?,?,1)', [req.user.id, expertise.id], callback);
                },
                function(callback) {
                    query('INSERT INTO weapongroup (name,description,special,skill_id,expertise_id,damage_id,icon) VALUES (?,?,?,?,?,?,?)', [insert.name, insert.description, insert.special, skill.id, expertise.id, damage.id, insert.icon], function(err, result) {
                        if(err) return callback(err);

                        insert.id = result.insertId;
                        insert.affected += result.affectedRows;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_has_weapongroup (user_id,weapongroup_id,owner) VALUES (?,?,1)', [req.user.id, insert.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send({success: true, message: 'Weapon group successfully created', affected: insert.affected, id: insert.id});
            });
        });

    router.route('/special')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapongroup.canon = 1 AND ' +
                'weapongroup.special = 1 AND ' +
                'weapongroup.deleted IS NULL';

            sequel.get(req, res, next, call);
        });

    router.route('/damage/:damageId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapongroup.canon = 1 AND ' +
                'weapongroup.damage_id = ? AND ' +
                'weapongroup.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.damageId]);
        });

    router.route('/skill/:skillId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' +
                'weapongroup.canon = 1 AND ' +
                'weapongroup.skill_id = ? AND ' +
                'weapongroup.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.skillId]);
        });

    // ID

    router.route('/:weaponGroupId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE weapongroup.id = ? AND weapongroup.deleted IS NULL';

            sequel.get(req, res, next, call, [req.params.weaponGroupId], true);
        })
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.weaponGroupId, adminRestriction, useUpdateColumn);
        })
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.weaponGroupId, adminRestriction);
        });

    router.route('/:weaponGroupId/canon')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.weaponGroupId, useUpdateColumn);
        });

    router.route('/:weaponGroupId/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, tableName, req.params.weaponGroupId);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, tableName, req.params.weaponGroupId);
        });

    router.route('/:weaponGroupId/ownership')
        .get(function(req, res) {
            ownership(req, tableName, req.params.weaponGroupId, adminRestriction, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({success: true, message: 'Ownership verified', ownership: ownership});
            })
        });

};
