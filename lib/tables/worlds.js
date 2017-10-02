'use strict';

var async = require('async'),
    query = require('../sql/query');

/**
 * Creates a world in table
 *
 * @param user Object
 * @param name String
 * @param description String
 * @param augmentation Boolean
 * @param bionic Boolean
 * @param corporation Boolean
 * @param manifestation Boolean
 * @param software Boolean
 * @param maxDoctrine Integer
 * @param maxExpertise Integer
 * @param maxSkill Integer
 * @param splitDoctrine Integer
 * @param splitExpertise Integer
 * @param splitMilestone Integer
 * @param splitSkill Integer
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, name, description, augmentation, bionic, corporation, manifestation, software, maxDoctrine, maxExpertise, maxSkill, splitDoctrine, splitExpertise, splitMilestone, splitSkill, callback) {
    if(!user.id) return callback({status: 403, message: 'Forbidden', error: 'User is not logged in'});

    description = name || null;
    augmentation = !!augmentation;
    bionic = !!bionic;
    corporation = !!corporation;
    manifestation = !!manifestation;
    software = !!software;
    maxDoctrine = parseInt(maxDoctrine) || 32;
    maxExpertise = parseInt(maxExpertise) || 32;
    maxSkill = parseInt(maxSkill) || 32;
    splitDoctrine = parseInt(splitDoctrine) || 1;
    splitExpertise = parseInt(splitExpertise) || 1;
    splitMilestone = parseInt(splitMilestone) || 5;
    splitSkill = parseInt(splitSkill) || 1;

    var id;

    async.series([
        function(callback) {
            var sql = 'INSERT INTO world (user_id,name,description,augmentation,bionic,corporation,manifestation,' +
                'software,max_doctrine,max_expertise,max_skill,split_doctrine,split_expertise,' +
                'split_milestone,split_skill) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';

            var array = [user.id, name, description, augmentation, bionic, corporation, manifestation, software,
                maxDoctrine, maxExpertise, maxSkill, splitDoctrine, splitExpertise, splitMilestone,
                splitSkill];

            query(sql, array, function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        },

        function(callback) {
            query('INSERT INTO user_has_world (user_id,world_id,owner) VALUES (?,?,1)', [user.id, id], callback);
        }
    ], function(err) {
        callback(err, id);
    });
};
