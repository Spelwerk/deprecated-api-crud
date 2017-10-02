'use strict';

var async = require('async'),
    yaml = require('node-yaml');

var generic = require('../../lib/helper/generic');

var sequel = require('./../../lib/sql/sequel');

var attributes = require('./../../lib/tables/attributes'),
    manifestations = require('./../../lib/tables/manifestations'),
    skills = require('./../../lib/tables/skills');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    var tableName = 'manifestation';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var mId,
                mName = req.body.name,
                mDescription = req.body.description,
                mIcon = req.body.icon;

            var aId,
                aName = req.body.power,
                aDescription = 'Power attribute for: ' + req.body.name,
                aIcon = req.body.icon,
                aType = defaults.attributeType.power,
                aOptional = 1,
                aCreature = 0,
                aAvatar = 0,
                aMinimum = 0,
                aMaximum = req.body.maximum;

            var sName = req.body.skill,
                sDescription = 'Skill for: ' + req.body.name,
                sIcon = req.body.icon;

            async.series([
                function(callback) {
                    attributes.post(req.user, aName, aDescription, aIcon, aType, aAvatar, aCreature, aOptional, aMinimum, aMaximum, function(err, id) {
                        if(err) return callback(err);

                        aId = id;

                        callback();
                    });
                },
                function(callback) {
                    manifestation.post(req.user, mName, mDescription, mIcon, aId, function(err, id) {
                        if(err) return callback(err);

                        mId = id;

                        callback();
                    });
                },
                function(callback) {
                    skills.post(req.user, sName, sDescription, sIcon, mId, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: mId});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // ID

    generic.id(router, sql, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
