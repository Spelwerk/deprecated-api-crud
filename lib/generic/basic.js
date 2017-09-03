var async = require('async');

var comment = require('./../sql/comment'),
    generic = require('./../sql/generic'),
    ownership = require('./../sql/ownership'),
    query = require('./../sql/query'),
    sequel = require('./../sql/sequel');

module.exports.root = function(router, sql, tableName) {
    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            generic.post(req, res, next, tableName);
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });
};

module.exports.id = function(router, sql, tableName) {
    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            generic.put(req, res, next, tableName, req.params.id);
        })
        .delete(function(req, res, next) {
            generic.delete(req, res, next, req.params.id);
        });
};

module.exports.canon = function(router) {
    router.route('/:id/canon/:boolean')
        .put(function(req, res, next) {
            generic.canon(req, res, next, req.params.id, req.params.boolean);
        });
};

module.exports.clone = function(router, tableName) {
    router.route('/:id/clone')
        .post(function(req, res, next) {
            generic.clone(req, res, next, tableName, req.params.id);
        });
};

module.exports.comments = function(router) {
    router.route('/:id/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, req.params.id);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, req.params.id);
        });
};

module.exports.images = function(router) {
    router.route('/:id/images')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_image ' +
                'LEFT JOIN image ON image.id = generic_has_image.image_id ' +
                'WHERE ' +
                'image.deleted IS NULL AND ' +
                'generic_has_image.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req, req.params.id, callback);
                },
                function(callback) {
                    query('INSERT INTO generic_has_image (generic_id,image_id) VALUES (?,?)', [req.params.id, req.body.insert_id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/images/:imageId')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_image ' +
                'LEFT JOIN image ON image.id = generic_has_image.image_id ' +
                'WHERE ' +
                'image.deleted IS NULL AND ' +
                'generic_has_image.generic_id = ? AND ' +
                'generic_has_image.image_id = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.imageId]);
        })
        .delete(function(req, res, next) {
            async.series([
                function(callback) {
                    ownership(req, req.params.id, callback);
                },
                function(callback) {
                    query('DELETE FROM generic_has_image WHERE generic_id = ? AND image_id = ?', [req.params.id, req.params.imageId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.labels = function(router) {
    router.route('/:id/labels')
        .get(function(req, res, next) {
            var call = 'SELECT label.id, label.label FROM generic_has_label ' +
                'LEFT JOIN label ON label.id = generic_has_label.label_id ' +
                'WHERE ' +
                'generic_has_label.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            var id,
                name = req.body.label;

            async.series([
                function(callback) {
                    query('SELECT id FROM label WHERE UPPER(name) = ?', [name.toUpperCase()], function(err, results) {
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
                    query('INSERT INTO generic_has_label (generic_id,label_id) VALUES (?,?)', [req.params.id, id], callback);
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
                    ownership(req, req.params.id, callback);
                },
                function(callback) {
                    query('DELETE FROM generic_has_label WHERE generic_id = ? AND label_id = ?', [req.params.id, req.params.labelId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};

module.exports.ownership = function(router) {
    router.route('/:id/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};

module.exports.revive = function(router) {
    router.route('/:id/revive')
        .put(function(req, res, next) {
            generic.revive(req, res, next, req.params.id);
        });
};