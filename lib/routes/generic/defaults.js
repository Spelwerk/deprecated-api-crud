'use strict';

const getSchema = require('../../../app/initializers/database').getSchema;
const permission = require('../../database/permission');
const sql = require('../../database/sql');
const common = require('./generic');
const comments = require('./comments/comments');
const images = require('./images/images');
const labels = require('./labels/labels');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

function schema(router, tableName) {
    router.get('/schema', (req, res, next) => {
        try {
            let schema = getSchema(tableName);

            delete schema.fields.all;

            res.status(200).send(schema);
        } catch(e) { return next(e); }
    });
}

function removed(router, tableName, query) {
    router.get('/deleted', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NOT NULL';

            await common.select(req, res, next, call);
        } catch(e) { return next(e); }
    });
}

function remove(router, tableName) {
    router.delete('/:id', async (req, res, next) => {
        try {
            await common.remove(req, res, next, tableName, req.params.id);
        } catch(e) { return next(e); }
    });
}

function revive(router, tableName) {
    router.put('/:id/revive', async (req, res, next) => {
        try {
            await common.revive(req, res, next, tableName, req.params.id);
        } catch(e) { return next(e); }
    });
}

function canon(router, tableName) {
    router.put('/:id/canon/:boolean', async (req, res, next) => {
        try {
            await common.canon(req, res, next, tableName, req.params.id, req.params.boolean);
        } catch(e) { return next(e); }
    });
}

function clone(router, tableName) {
    router.post('/:id/clone', async (req, res, next) => {
        try {
            await common.clone(req, res, next, tableName, req.params.id);
        } catch(e) { return next(e); }
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
            await common.select(req, res, next, query, [req.params.id]);
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
                await common.select(req, res, next, query, [req.params.id]);
            } catch(e) { return next(e); }
        })
        .post(async (req, res, next) => {
            try {
                await images.insert(req, req, next, tableName);
            } catch(e) { return next(e); }
        });

    router.route('/:id/images/:image')
        .get(async (req, res, next) => {
            try {
                let call = sql + ' AND ' +
                    table_has_image + '.image_id = ?';

                await common.select(req, res, next, call, [req.params.id, req.params.image], true);
            } catch(e) { return next(e); }
        })
        .delete(async (req, res, next) => {
            try {
                await images.remove(req, res, next, tableName);
            } catch(e) { return next(e); }
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
                await common.select(req, res, next, query, [req.params.id]);
            } catch(e) { return next(e); }
        })
        .post(async (req, res, next) => {
            try {
                await labels.insert(req, res, next, tableName);
            } catch(e) { return next(e); }
        });

    router.route('/:id/labels/:labelId')
        .delete(async (req, res, next) => {
            try {
                await labels.remove(req, res, next, tableName);
            } catch(e) { return next(e); }
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
            } catch(e) { return next(e); }
        })
        .post(async (req, res, next) => {
            try {
                await permission.keep(req, tableName, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/:id/permissions/favorite/:boolean')
        .put(async (req, res, next) => {
            try {
                await permission.favorite(req, tableName, req.params.id, req.params.boolean);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/:id/permissions/user/:user/edit/:boolean')
        .put(async (req, res, next) => {
            try {
                await permission.edit(req, tableName, req.params.id, req.params.user, req.params.boolean);

                res.status(204).send();
            } catch(e) { return next(e); }
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
