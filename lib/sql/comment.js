var async = require('async');

var logger = require(appRoot + '/lib/logger'),
    sequel = require(appRoot + '/lib/sql/sequel');

exports.get = function(req, tableName, tableId, callback) {
    var tName = tableName + '_has_comment',
        tId = tableName + '_id';

    var call = 'SELECT ' +
        'comment.id, ' +
        'comment.content, ' +
        'comment.user_id, ' +
        'user.displayname, ' +
        'comment.created, ' +
        'comment.updated ' +
        'FROM ' + tName + ' ' +
        'LEFT JOIN comment ON comment.id = ' + tName + '.comment_id ' +
        'LEFT JOIN user ON user.id = comment.user_id ' +
        'WHERE ' + tableName + '.' + tId + ' = ?';

    sequel.query(call, [tableId], callback);
};

exports.post = function(req, tableName, tableId, callback) {
    var tName = tableName + '_has_comment',
        tId = tableName + '_id';

    var insert = {};

    insert.content = req.body.content;

    async.series([
        function(callback) {
            sequel.query('INSERT INTO comment (content,user_id) VALUES (?,?)',[insert.content, req.user.id], function(err, result) {
                insert.id = result.insertId;

                callback(err);
            });
        },
        function(callback) {
            sequel.query('INSERT INTO ' + tName + ' (' + tId + ',comment_id) VALUES (?,?)', [tableId, insert.id], callback);
        }
    ],function(err) {
        callback(err);
    })
};