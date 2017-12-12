'use strict';

let UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async');

let generic = require('../../lib/helper/generic'),
    elemental = require('../../lib/sql/elemental'),
    relations = require('../../lib/helper/relations'),
    query = require('../../lib/sql/query');

module.exports = function(router) {
    const tableName = 'world';

    let sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let worldId;

            let attributeQuery = 'INSERT INTO world_has_attribute (world_id,attribute_id,value,minimum,maximum) VALUES ';

            async.series([
                function(callback) {
                    elemental.post(req.user, req.body, tableName, function(err, id) {
                        if(err) return callback(err);

                        worldId = id;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT id,minimum,maximum FROM attribute WHERE optional = 0', null, function(err, results) {
                        if(err) return callback(err);

                        for(let i in results) {
                            let attributeId = parseInt(results[i].id),
                                value = parseInt(results[i].minimum),
                                minimum = parseInt(results[i].minimum),
                                maximum = parseInt(results[i].maximum);

                            attributeQuery += '(' + worldId + ',' + attributeId + ',' + value + ',' + minimum + ',' + maximum + '),';
                        }

                        attributeQuery = attributeQuery.slice(0, -1);

                        callback();
                    });
                },
                function(callback) {
                    query(attributeQuery, null, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: worldId});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.schema(router, tableName);
    generic.get(router, tableName, sql);
    generic.put(router, tableName);

    generic.automatic(router, tableName);

    // Relations

    relations.route(router, tableName, 'attributes', 'attribute');
    relations.route(router, tableName, 'countries', 'country');
    relations.route(router, tableName, 'identities', 'identity');
    relations.route(router, tableName, 'locations', 'location');
    relations.route(router, tableName, 'natures', 'nature');
};
