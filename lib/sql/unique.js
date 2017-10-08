var Err = require('../errors/index');

var async = require('async'),
    query = require('./query');

/**
 * Creates a unique name in the table. Verifies if the name already exists and returns that ID if UQ is true.
 *
 * @param user Object
 * @param tableName String
 * @param name String
 * @param adminRestriction Boolean
 * @param callback
 * @returns callback(err, id)
 */

module.exports.post = function(user, tableName, name, adminRestriction, callback) {
    name = name.toLowerCase();
    adminRestriction = !!adminRestriction;

    if(!user.id) return callback(Err.User.NotLoggedInError());

    if(adminRestriction && !user.admin) return callback(Err.User.NotAdministratorError());

    var id;

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
};
