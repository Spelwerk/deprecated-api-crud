'use strict';

let UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

let async = require('async'),
    query = require('./query');

/**
 * Creates a unique name in the table. Verifies if the name already exists and returns that ID if UQ is true.
 * @deprecated
 * @param user Object
 * @param tableName String
 * @param name String
 * @param adminRestriction Boolean
 * @param callback
 * @returns callback(err, id)
 */
function post(user, tableName, name, adminRestriction, callback) {
    name = name.toString().toLowerCase();
    adminRestriction = !!adminRestriction;

    if(!user.id) return callback(new UserNotLoggedInError);

    if(adminRestriction && !user.admin) return callback(new UserNotAdministratorError);

    let id;

    async.series([
        function(callback) {
            query('SELECT id FROM ' + tableName + ' WHERE LOWER(name) = ?', [name], function(err, results) {
                if(err) return callback(err);

                if(!results[0]) return callback();

                id = results[0].id;

                callback();
            });
        },
        function(callback) {
            if(id) return callback();

            query('INSERT INTO ' + tableName + ' (name) VALUES (?)', [name], function(err, result) {
                if(err) return callback(err);

                id = result.insertId;

                callback();
            });
        }
    ], function(err) {
        callback(err, id);
    });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.post = post;