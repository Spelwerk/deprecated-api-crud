var async = require('async');

var query = require('./query');

module.exports.get = function(req, res, next, tableId) {
    var sql = 'SELECT ' +
        'comment.id, ' +
        'comment.user_id, ' +
        'comment.comment, ' +
        'comment.created, ' +
        'comment.updated, ' +
        'comment.deleted, ' +
        'user.displayname ' +
        'FROM generic_has_comment ' +
        'LEFT JOIN comment ON comment.id = generic_has_comment.comment_id ' +
        'LEFT JOIN user ON user.id = comment.user_id ' +
        'WHERE ' +
        'generic_has_comment.generic_id = ?';

    query(sql, [tableId], function(err, results, fields) {
        if(err) return next(err);

        res.status(200).send({results: results, fields: fields});
    });
};

module.exports.post = function(req, res, next, tableId) {
    var insert = {};

    insert.comment = req.body.comment;

    async.series([
        function(callback) {
            query('INSERT INTO comment (user_id,comment) VALUES (?,?)',[req.user.id, insert.comment], function(err, result) {
                if(err) return callback(err);

                insert.id = result.insertId;

                callback();
            });
        },
        function(callback) {
            query('INSERT INTO generic_has_comment (generic_id,comment_id) VALUES (?,?)', [tableId, insert.id], callback);
        }
    ], function(err) {
        if(err) return next(err);

        res.status(201).send({id: insert.id});
    })
};