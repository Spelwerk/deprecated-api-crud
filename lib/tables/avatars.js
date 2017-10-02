'use strict';

var async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

/**
 * Creates an avatar in table based on individualId
 *
 * @param user Object
 * @param individualId Integer
 * @param identityId Integer
 * @param natureId Integer
 * @param pointDoctrine Integer
 * @param pointExpertise Integer
 * @param pointGift Integer
 * @param pointImperfection Integer
 * @param pointMilestone Integer
 * @param pointSkill Integer
 * @param callback
 * @returns callback(err)
 */

module.exports.post = function(user, individualId, identityId, natureId, pointDoctrine, pointExpertise, pointGift, pointImperfection, pointMilestone, pointSkill, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    individualId = parseInt(individualId);
    identityId = parseInt(identityId) || null;
    natureId = parseInt(natureId) || null;
    pointDoctrine = parseInt(pointDoctrine) || 0;
    pointExpertise = parseInt(pointExpertise) || 0;
    pointGift = parseInt(pointGift) || 0;
    pointImperfection = parseInt(pointImperfection) || 0;
    pointMilestone = parseInt(pointMilestone) || 0;
    pointSkill = parseInt(pointSkill) || 0;

    var id = individualId,
        worldId,
        attributeArray = [],
        attributeQuery = 'INSERT INTO creature_has_attribute (creature_id,attribute_id,value) VALUES ';

    async.series([
        function(callback) {
            ownership(user, 'creature', individualId, callback);
        },
        function(callback) {
            query('INSERT INTO avatar (individual_id,identity_id,nature_id,point_doctrine,point_expertise,point_gift,point_imperfection,point_milestone,point_skill) VALUES (?,?,?,?,?,?,?)',
                [individualId, identityId, natureId, pointDoctrine, pointExpertise, pointExpertise, pointGift, pointImperfection, pointMilestone, pointSkill], callback);
        },

        function(callback) {
            query('SELECT world_id AS id FROM creature WHERE id = ?', [individualId], function(err, results) {
                if(err) return callback(err);

                worldId = results[0].id;

                callback();
            });
        },

        function(callback) {
            var sql = 'SELECT ' +
                'attribute.id, ' +
                'world_has_attribute.value ' +
                'FROM world_has_attribute ' +
                'LEFT JOIN attribute ON attribute.id = world_has_attribute.attribute_id ' +
                'WHERE ' +
                'world_has_attribute.world_id = ? AND ' +
                'attribute.creature = 0 AND ' +
                'attribute.avatar = 1';

            query(sql, [worldId], function(err, results) {
                if(err) return callback(err);

                // Loop through results from world list and push the values into our new attribute array
                for(var i in results) {
                    var id = parseInt(results[i].id),
                        value = parseInt(results[i].value);

                    attributeArray.push({id: id, value: value});
                }

                callback();
            });
        },

        function(callback) {
            // Create the query
            for(var x in attributeArray) {
                attributeQuery += '(' + id + ',' + attributeArray[x].id + ',' + attributeArray[x].value + '),';
            }

            attributeQuery = attributeQuery.slice(0, -1);

            callback();
        },
        function(callback) {
            query(attributeQuery, null, callback);
        }
    ], function(err) {
        callback(err);
    });
};
