'use strict';

const UserNotAdministratorError = require('../errors/user-not-administrator-error');

const getSchema = require('../../app/initializers/database').getSchema;
const permission = require('../database/permission');
const sql = require('../database/sql');
const uniques = require('../database/unique');
const basic = require('./basics');
const comments = require('./comments');
const images = require('./images');
const labels = require('./labels');

function schema(router, tableName) {
    router.get('/schema', (req, res, next) => {
        try {
            let schema = getSchema(tableName);

            delete schema.fields.all;

            res.status(200).send(schema);
        } catch(e) {
            return next(e);
        }
    });
}

function removed(router, tableName, query) {
    router.get('/deleted', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NOT NULL';

            await basic.select(req, res, next, call);
        } catch(e) {
            return next(e);
        }
    });
}

function remove(router, tableName) {
    router.delete('/:id', async (req, res, next) => {
        try {
            await basic.remove(req, res, next, tableName, req.params.id);
        } catch(e) {
            return next(e);
        }
    });
}

function revive(router, tableName) {
    router.put('/:id/revive', async (req, res, next) => {
        try {
            await basic.revive(req, res, next, tableName, req.params.id);
        } catch(e) {
            return next(e);
        }
    });
}

function canon(router, tableName) {
    router.put('/:id/canon/:boolean', async (req, res, next) => {
        try {
            await basic.canon(req, res, next, tableName, req.params.id, req.params.boolean);
        } catch(e) {
            return next(e);
        }
    });
}

function clone(router, tableName) {
    router.post('/:id/clone', async (req, res, next) => {
        try {
            await basic.clone(req, res, next, tableName, req.params.id);
        } catch(e) {
            return next(e);
        }
    });
}

function comment(router, tableName) {
    let table_has_comment = tableName + '_has_comment',
        table_id = tableName + '_id';

    let query = 'SELECT ' +
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
        .get(async (req, res, next) => {
            await basic.select(req, res, next, query, [req.params.id]);
        })
        .post(async (req, res, next) => {
            await comments.insert(req, res, next, tableName);
        });
}

function image(router, tableName) {
    let table_has_image = tableName + '_has_image',
        table_id = tableName + '_id';

    let query = 'SELECT * FROM ' + table_has_image + ' ' +
        'LEFT JOIN image ON image.id = ' + table_has_image + '.image_id ' +
        'WHERE image.deleted IS NULL AND ' +
        table_has_image + '.' + table_id + ' = ?';

    router.route('/:id/images')
        .get(async (req, res, next) => {
            try {
                await basic.select(req, res, next, query, [req.params.id]);
            } catch(e) {
                return next(e);
            }
        })
        .post(async (req, res, next) => {
            try {
                await images.insert(req, req, next, tableName);
            } catch(e) {
                return next(e);
            }
        });

    router.route('/:id/images/:image')
        .get(async (req, res, next) => {
            try {
                let call = sql + ' AND ' +
                    table_has_image + '.image_id = ?';

                await basic.select(req, res, next, call, [req.params.id, req.params.image], true);
            } catch(e) {
                return next(e);
            }
        })
        .delete(async (req, res, next) => {
            try {
                await images.remove(req, res, next, tableName);
            } catch(e) {
                return next(e);
            }
        });
}

function label(router, tableName) {
    let table_has_label = tableName + '_has_label';
    let table_id = tableName + '_id';

    let query = 'SELECT label.id, label.name FROM ' + table_has_label + ' ' +
        'LEFT JOIN label ON label.id = ' + table_has_label + '.label_id ' +
        'WHERE ' + table_has_label + '.' + table_id + ' = ?';

    router.route('/:id/labels')
        .get(async (req, res, next) => {
            try {
                await basic.select(req, res, next, query, [req.params.id]);
            } catch(e) {
                return next(e);
            }
        })
        .post(async (req, res, next) => {
            try {
                await labels.insert(req, res, next, tableName);
            } catch(e) {
                return next(e);
            }
        });

    router.route('/:id/labels/:labelId')
        .delete(async (req, res, next) => {
            try {
                await labels.remove(req, res, next, tableName);
            } catch(e) {
                return next(e);
            }
        });
}

function count(router, tableName) {
    let user_has_table = 'user_has_' + tableName;
    let table_id = tableName + '_id';

    router.get('/:id/count/saved', async (req, res, next) => {
        try {
            let query = 'SELECT COUNT(user_id) AS total FROM ' + user_has_table + ' WHERE ' + table_id + ' = ?';
            let array = [req.params.id];

            let [rows] = await sql(query, array);
            let object = rows[0] ? rows[0] : { total: 0 };

            res.status(200).send(object);
        } catch(e) {
            return next(e);
        }
    });

    router.get('/:id/count/favorite', async (req, res, next) => {
        try {
            let query = 'SELECT COUNT(user_id) AS total FROM ' + user_has_table + ' WHERE ' + table_id + ' = ? AND favorite = ?';
            let array = [req.params.id, 1];

            let [rows] = await sql(query, array);
            let object = rows[0] ? rows[0] : { total: 0 };

            res.status(200).send(object);
        } catch(e) {
            return next(e);
        }
    });
}

function permissions(router, tableName) {
    router.route('/:id/permissions')
        .get(async (req, res, next) => {
            try {
                let data = await permission.get(req, tableName, req.params.id);

                res.status(200).send(data);
            } catch(e) {
                return next(e);
            }
        })
        .post(async (req, res, next) => {
            try {
                await permission.keep(req, tableName, req.params.id);

                res.status(204).send();
            } catch(e) {
                return next(e);
            }
        });

    router.route('/:id/permissions/favorite/:boolean')
        .put(async (req, res, next) => {
            try {
                await permission.favorite(req, tableName, req.params.id, req.params.boolean);

                res.status(204).send();
            } catch(e) {
                return next(e);
            }
        });

    router.route('/:id/permissions/user/:user/edit/:boolean')
        .put(async (req, res, next) => {
            try {
                await permission.edit(req, tableName, req.params.id, req.params.user, req.params.boolean);

                res.status(204).send();
            } catch(e) {
                return next(e);
            }
        });
}


function automatic(router, tableName) {
    let schema = getSchema(tableName);

    if(schema.fields.deleted) remove(router, tableName);
    if(schema.fields.canon) canon(router, tableName);

    if(schema.supports.copies) clone(router, tableName);
    if(schema.supports.comments) comment(router, tableName);
    if(schema.supports.images) image(router, tableName);
    if(schema.supports.labels) label(router, tableName);

    if(schema.security.user) count(router, tableName);
    if(schema.security.user) permissions(router, tableName);

    if(schema.fields.deleted) revive(router, tableName);
}


function root(router, tableName, query) {
    router.get('/', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.canon = 1';

            await basic.select(req, res, next, call);
        } catch(e) {
            return next(e);
        }
    });
}

function single(router, tableName, query) {
    router.get('/:id', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.id = ?';

            await basic.select(req, res, next, call, [req.params.id], true);
        } catch(e) {
            return next(e);
        }
    });
}

function insert(router, tableName) {
    router.post('/', async (req, res, next) => {
        try {
            await basic.insert(req, res, next, tableName);
        } catch(e) {
            return next(e);
        }
    });
}

function update(router, tableName) {
    router.put('/:id', async (req, res, next) => {
        try {
            await basic.update(req, res, next, tableName, req.params.id);
        } catch(e) {
            return next(e);
        }
    });
}


function unique(router, tableName, adminRestriction) {
    adminRestriction = adminRestriction || false;

    let query = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(async (req, res, next) => {
            await basic.select(req, res, next, query);
        })
        .post(async (req, res, next) => {
            try {
                let id = await uniques.insert(req, tableName, req.body.name, adminRestriction);

                res.status(201).send({id: id});
            } catch(e) {
                return next(e);
            }
        });

    router.route('/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE id = ?';

            await basic.select(req, res, next, call, [req.params.id], true);
        })
        .delete(async (req, res, next) => {
            try {
                if(!req.user.admin) return next(new UserNotAdministratorError);

                await sql('DELETE FROM ' + tableName + ' WHERE id = ?', [req.params.id]);

                res.status(204).send();
            } catch(e) {
                return next(e);
            }
        });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.schema = schema;
module.exports.removed = removed;
module.exports.remove = remove;
module.exports.revive = revive;
module.exports.canon = canon;
module.exports.clone = clone;
module.exports.comment = comment;
module.exports.image = image;
module.exports.label = label;
module.exports.count = count;
module.exports.permissions = permissions;

module.exports.automatic = automatic;

module.exports.root = root;
module.exports.single = single;
module.exports.insert = insert;
module.exports.update = update;

module.exports.unique = unique;