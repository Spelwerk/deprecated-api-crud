'use strict';

let UserNotLoggedInError = require('../errors/user-not-logged-in-error');

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

module.exports.post = function(user, storyId, notes, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    storyId = parseInt(storyId);

    let id;

    async.series([
        function(callback) {
            ownership(user, 'story', storyId, callback);
        },
        function(callback) {
            query('INSERT INTO meeting (story_id,notes) VALUES (?,?)', [storyId, notes], function(err, result)  {
                if(err) return callback(err);

                id = parseInt(result.insertId);

                callback();
            });
        },
    ], function(err) {
        callback(err, id);
    });
};

module.exports.put = function(user, id, notes, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let id = parseInt(id);

    let storyId;

    async.series([
        function(callback) {
            query('SELECT story_id AS id FROM meeting WHERE id = ?', [id], function(err, results) {
                if(err) return callback(err);

                storyId = results[0].id;

                callback();
            })
        },
        function(callback) {
            ownership(user, 'story', storyId, callback);
        },
        function(callback) {
            query('UPDATE meeting SET notes = ? WHERE id = ?', [notes, id], callback);
        },
    ], function(err) {
        callback(err);
    });
};