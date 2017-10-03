'use strict';

var async = require('async'),
    yaml = require('node-yaml');

var generic = require('../../lib/helper/generic'),
    attributes = require('./../../lib/tables/attributes'),
    manifestations = require('./../../lib/tables/manifestations'),
    skills = require('./../../lib/tables/skills');

var defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    var tableName = 'manifestation';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
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
                aMinimum = 0,
                aMaximum = req.body.maximum;

            var sName = req.body.skill,
                sDescription = 'Skill for: ' + req.body.name,
                sIcon = req.body.icon;

            async.series([
                function(callback) {
                    attributes.post(req.user, aName, aDescription, aIcon, aType, aOptional, aMinimum, aMaximum, function(err, id) {
                        if(err) return callback(err);

                        aId = id;

                        callback();
                    });
                },
                function(callback) {
                    manifestations.post(req.user, mName, mDescription, mIcon, aId, function(err, id) {
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

    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);

    router.route('/:id')
        .put(function(req, res, next) {
            var id = req.params.id,
                name = req.body.name,
                description = req.body.description,
                icon = req.body.icon;

            manifestations.put(req.user, id, name, description, icon, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
