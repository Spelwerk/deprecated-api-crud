'use strict';

let async = require('async'),
    yaml = require('node-yaml');

let generic = require('../../lib/helper/generic'),
    relations = require('../../lib/helper/relations'),
    elemental = require('../../lib/sql/elemental');

let defaults = yaml.readSync('./../../config/defaults.yml');

module.exports = function(router) {
    let tableName = 'manifestation',
        options = { updatedField: true };

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            let attribute = {
                name: req.body.power,
                description: 'Power attribute for: ' + req.body.name,
                icon: req.body.icon,
                attributetype_id: defaults.attributeType.power,
                optional: 1,
                minimum: 0,
                maximum: req.body.maximum
            };

            let manifestation = {
                name: req.body.name,
                description: req.body.description,
                icon: req.body.icon
            };

            let skill = {
                name: req.body.skill,
                description: 'Skill for: ' + req.body.name,
                icon: req.body.icon
            };

            async.series([
                function(callback) {
                    elemental.post(req.user, attribute, 'attribute', {userOwned: true}, function(err, id) {
                        if(err) return callback(err);

                        attribute.id = id;
                        manifestation.attribute_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, manifestation, 'manifestation', {userOwned: true}, function(err, id) {
                        if(err) return callback(err);

                        manifestation.id = id;
                        skill.manifestation_id = id;

                        callback();
                    });
                },
                function(callback) {
                    elemental.post(req.user, skill, 'skill', {userOwned: true, combinations: ['manifestation']}, function(err, id) {
                        if(err) return callback(err);

                        skill.id = id;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: manifestation.id});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);
    generic.put(router, tableName, options);
    generic.delete(router, tableName, options);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.permissions(router, tableName);
    generic.revive(router, tableName);

    // Relations

    relations(router, tableName, 'attributes', 'attribute');
    relations(router, tableName, 'forms', 'form');
    relations(router, tableName, 'spells', 'spell');
};
