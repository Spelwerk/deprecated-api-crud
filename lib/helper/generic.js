var async = require('async');

var ownership = require('../sql/ownership'),
    permissions = require('../sql/permissions'),
    query = require('../sql/query'),
    sequel = require('../sql/sequel');

module.exports.root = function(router, tableName, sql) {
    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.canon = 1';

            sequel.get(req, res, next, call);
        });
};

module.exports.post = function(router, tableName, options) {
    router.route('/')
        .post(function(req, res, next) {
            sequel.post(req, res, next, tableName, options);
        });
};

module.exports.deleted = function(router, tableName, sql) {
    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' + tableName + '.deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });
};

module.exports.get = function(router, tableName, sql) {
    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        });
};

module.exports.put = function(router, tableName, options) {
    router.route('/:id')
        .put(function(req, res, next) {
            sequel.put(req, res, next, tableName, req.params.id, options);
        });
};

module.exports.delete = function(router, tableName, adminRestriction, userOwned) {
    router.route('/:id')
        .delete(function(req, res, next) {
            sequel.delete(req, res, next, tableName, req.params.id, adminRestriction, userOwned);
        });
};

module.exports.canon = function(router, tableName) {
    router.route('/:id/canon/:boolean')
        .put(function(req, res, next) {
            sequel.canon(req, res, next, tableName, req.params.id, req.params.boolean);
        });
};

module.exports.clone = function(router, tableName, options) {
    router.route('/:id/clone')
        .post(function(req, res, next) {
            sequel.clone(req, res, next, tableName, req.params.id, options);
        });
};

module.exports.comments = function(router, tableName) {
    var table_has_comment = tableName + '_has_comment',
        table_id = tableName + '_id';

    var sql = 'SELECT ' +
        'comment.id, ' +
        'comment.user_id, ' +
        'comment.comment, ' +
        'comment.created, ' +
        'comment.updated, ' +
        'comment.deleted, ' +
        'user.displayname ' +
        'FROM ' + table_has_comment + ' ' +
        'LEFT JOIN comment ON comment.id = ' + table_has_comment + '.comment_id ' +
        'LEFT JOIN user ON user.id = comment.user_id ' +
        'WHERE comment.deleted IS NULL AND ' +
        table_has_comment + '.' + table_id + ' = ?';

    router.route('/:id/comments')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql, [req.params.id]);
        })
        .post(function(req, res, next) {
            var id;

            async.series([
                function(callback) {
                    query('INSERT INTO comment (user_id,comment) VALUES (?,?)',[req.user.id, req.body.comment], function(err, result) {
                        if(err) return callback(err);

                        id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO ' + table_has_comment + ' (' + table_id + ',comment_id) VALUES (?,?)', [req.params.id, id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });
};

module.exports.images = function(router, tableName) {
    var table_has_image = tableName + '_has_image',
        table_id = tableName + '_id';

    var sql = 'SELECT * FROM ' + table_has_image + ' ' +
        'LEFT JOIN image ON image.id = ' + table_has_image + '.image_id ' +
        'WHERE image.deleted IS NULL AND ' +
        table_has_image + '.' + table_id + ' = ?';

    router.route('/:id/images')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql, [req.params.id]);
        })
        .post(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, tableName, req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO ' + table_has_image + ' (' + table_id + ',image_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/images/:imageId')
        .get(function(req, res, next) {
            var call = sql + ' AND ' +
                table_has_image + '.image_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.imageId]);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, tableName, req.params.id, callback);
                },
                function(callback) {
                    query('DELETE FROM ' + table_has_image + ' WHERE ' + table_id + ' = ? AND image_id = ?', [req.params.id, req.params.imageId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.labels = function(router, tableName) {
    var table_has_label = tableName + '_has_label',
        table_id = tableName + '_id';

    var sql = 'SELECT * FROM ' + table_has_label + ' ' +
        'LEFT JOIN label ON label.id = ' + table_has_label + '.label_id ' +
        'WHERE ' + table_has_label + '.' + table_id + ' = ?';

    router.route('/:id/labels')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql, [req.params.id]);
        })
        .post(function(req, res, next) {
            var id,
                name = req.body.label.toLowerCase();

            async.series([
                function(callback) {
                    query('SELECT id FROM label WHERE LOWER(name) = ?', [name], function(err, results) {
                        if(err) return callback(err);

                        if(!results[0]) return callback();

                        id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    if(id) return callback();

                    query('INSERT INTO label (name) VALUES (?)', [name], function(err, result) {
                        if(err) return callback(err);

                        id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO ' + table_has_label + ' (' + table_id + ',label_id) VALUES (?,?)', [req.params.id, id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/:id/labels/:labelId')
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req.user, tableName, req.params.id, callback);
                },
                function(callback) {
                    query('DELETE FROM ' + table_has_label + ' WHERE ' + table_id + ' = ? AND label_id = ?', [req.params.id, req.params.labelId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.ownership = function(router, tableName) {
    router.route('/:id/ownership')
        .get(function(req, res, next) {
            permissions(req.user, tableName, req.params.id, function(err, favorite, owner, edit) {
                if(err) return next(err);

                res.status(200).send({favorite: favorite, owner: owner, edit: edit});
            });
        });
};

module.exports.revive = function(router, tableName) {
    router.route('/:id/revive')
        .put(function(req, res, next) {
            sequel.revive(req, res, next, tableName, req.params.id);
        });
};

//todo user set owner
//todo user set edit
//todo user set favorite