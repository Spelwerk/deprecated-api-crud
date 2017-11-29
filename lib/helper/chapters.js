'use strict';

let UserNotLoggedInError = require('../errors/user-not-logged-in-error');

let async = require('async'),
    query = require('../sql/query'),
    ownership = require('../sql/ownership');

module.exports.post = function(user, storyId, plot, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    storyId = parseInt(storyId);

    let id;

    async.series([
        function(callback) {
            ownership(user, 'story', storyId, callback);
        },
        function(callback) {
            query('INSERT INTO chapter (story_id,plot) VALUES (?,?)', [storyId, plot], function(err, result)  {
                if(err) return callback(err);

                id = parseInt(result.insertId);

                callback();
            });
        },
    ], function(err) {
        callback(err, id);
    });
};

module.exports.put = function(user, id, plot, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let id = parseInt(id);

    let storyId;

    async.series([
        function(callback) {
            query('SELECT story_id AS id FROM chapter WHERE id = ?', [id], function(err, results) {
                if(err) return callback(err);

                storyId = results[0].id;

                callback();
            })
        },
        function(callback) {
            ownership(user, 'story', storyId, callback);
        },
        function(callback) {
            query('UPDATE chapter SET plot = ?, updated = CURRENT_TIMESTAMP WHERE id = ?', [plot, id], callback);
        },
    ], function(err) {
        callback(err);
    });
};

module.exports.delete = function(user, id, callback) {
    if(!user.id) return callback(new UserNotLoggedInError);

    let id = parseInt(id);

    let storyId;

    async.series([
        function(callback) {
            query('SELECT story_id AS id FROM chapter WHERE id = ?', [id], function(err, results) {
                if(err) return callback(err);

                storyId = results[0].id;

                callback();
            })
        },
        function(callback) {
            ownership(user, 'story', storyId, callback);
        },
        function(callback) {
            query('UPDATE chapter SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [id], callback);
        },
    ], function(err) {
        callback(err);
    });
};