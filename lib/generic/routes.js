'use strict';

const permissions = require('../database/permissions');
const sql = require('../database/sql');
const basic = require('./basic');
const comments = require('./comments');
const images = require('./images');
const labels = require('./labels');
const getSchema = require('../../app/initializers/database').getSchema;

function schema(router, tableName) {
    router.get('/schema', (req, res, next) => {
        try {
            let schema = getSchema(tableName);

            delete schema.fields.all;

            res.status(200).send(schema);
        } catch(e) {
            next(e);
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
            try {
                await basic.select(req, res, next, query, [req.params.id]);
            } catch(e) {
                return next(e);
            }
        })
        .post(async (req, res, next) => {
            try {
                await comments.insert(req, res, next, tableName);
            } catch(e) {
                return next(e);
            }
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
    let table_has_label = tableName + '_has_label',
        table_id = tableName + '_id';

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

function permission(router, tableName) {
    router.route('/:id/permissions')
        .get(async (req, res, next) => {
            try {
                let data = await permissions.get(req.user, tableName, req.params.id);

                res.status(200).send(data);
            } catch(e) {
                next(e);
            }
        })
        .post(async (req, res, next) => {
            try {
                await permissions.keep(req.user, tableName, req.params.id);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        });

    router.route('/:id/permissions/favorite/:boolean')
        .put(async (req, res, next) => {
            try {
                await permissions.favorite(req.user, tableName, req.params.id, req.params.boolean);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        });

    router.route('/:id/permissions/user/:user/edit/:boolean')
        .put(async (req, res, next) => {
            try {
                await permissions.edit(req.user, tableName, req.params.id, req.params.user, req.params.boolean);

                res.status(204).send();
            } catch(e) {
                next(e);
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

    if(schema.security.user) permission(router, tableName);

    if(schema.fields.deleted) revive(router, tableName);
}


function root(router, tableName, query) {
    router.get('/', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.canon = 1';

            await basic.select(req, res, next, call);
        } catch(e) {
            next(e);
        }
    });
}

function single(router, tableName, query) {
    router.get('/:id', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.id = ?';

            await basic.select(req, res, next, call, [req.params.id], true);
        } catch(e) {
            next(e);
        }
    });
}

function insert(router, tableName) {
    router.post('/', async (req, res, next) => {
        try {
            await basic.insert(req, res, next, tableName);
        } catch(e) {
            next(e);
        }
    });
}

function update(router, tableName) {
    router.put('/:id', async (req, res, next) => {
        try {
            await basic.update(req, res, next, tableName, req.params.id);
        } catch(e) {
            next(e);
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
module.exports.permission = permission;

module.exports.automatic = automatic;

module.exports.root = root;
module.exports.single = single;
module.exports.insert = insert;
module.exports.update = update;