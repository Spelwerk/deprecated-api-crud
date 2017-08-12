var async = require('async');

var query = require('./query');

module.exports.get = function(req, res, next, tableName, tableId) {
    var tName = tableName + '_has_comment',
        tId = tableName + '_id';

    var call = 'SELECT ' +
        'comment.id, ' +
        'comment.content, ' +
        'comment.user_id, ' +
        'user.displayname, ' +
        'comment.created, ' +
        'comment.updated, ' +
        'comment.deleted ' +
        'FROM ' + tName + ' ' +
        'LEFT JOIN comment ON comment.id = ' + tName + '.comment_id ' +
        'LEFT JOIN user ON user.id = comment.user_id ' +
        'WHERE ' + tName + '.' + tId + ' = ?';

    query(call, [tableId], function(err, results, fields) {
        if(err) return next(err);

        var message = environment === 'development' ? 'Comment query successful' : null;

        res.status(200).send({success: true, message: message, results: results, fields: fields});
    });
};

module.exports.post = function(req, res, next, tableName, tableId) {
    var tName = tableName + '_has_comment',
        tId = tableName + '_id';

    var insert = {};

    insert.content = req.body.content;

    async.series([
        function(callback) {
            query('INSERT INTO comment (content,user_id) VALUES (?,?)',[insert.content, req.user.id], function(err, result) {
                insert.id = result.insertId;
                insert.affected = result.affectedRows;

                callback(err);
            });
        },
        function(callback) {
            query('INSERT INTO ' + tName + ' (' + tId + ',comment_id) VALUES (?,?)', [tableId, insert.id], callback);
        }
    ],function(err) {
        if(err) return next(err);

        var message = environment === 'development' ? 'Created new comment for ' + tableName : null;

        res.status(201).send({success: true, message: message, affected: insert.affected, id: insert.id});
    })
};