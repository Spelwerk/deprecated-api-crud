'use strict';

const UserNotAdministratorError = require('../../errors/user-not-administrator-error');

const getSchema = require('../../../app/initializers/database').getSchema;
const sql = require('../../database/sql');
const dbUnique = require('../../database/unique');
const common = require('./generic');

const defaults = require('./defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

function automatic(router, tableName) {
    let schema = getSchema(tableName);

    if (schema.fields.deleted) defaults.remove(router, tableName);
    if (schema.fields.canon) defaults.canon(router, tableName);

    if (schema.supports.copies) defaults.clone(router, tableName);
    if (schema.supports.comments) defaults.comment(router, tableName);
    if (schema.supports.images) defaults.image(router, tableName);
    if (schema.supports.labels) defaults.label(router, tableName);

    if (schema.security.user) defaults.count(router, tableName);
    if (schema.security.user) defaults.permissions(router, tableName);

    if (schema.fields.deleted) defaults.revive(router, tableName);
}

function root(router, tableName, query) {
    router.get('/', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.canon = 1';

            await common.select(req, res, next, call);
        } catch(e) {
            return next(e);
        }
    });
}

function single(router, tableName, query) {
    router.get('/:id', async (req, res, next) => {
        try {
            let call = query + ' WHERE ' + tableName + '.deleted IS NULL AND ' + tableName + '.id = ?';

            await common.select(req, res, next, call, [req.params.id], true);
        } catch(e) {
            return next(e);
        }
    });
}

function insert(router, tableName) {
    router.post('/', async (req, res, next) => {
        try {
            await common.insert(req, res, next, tableName);
        } catch(e) {
            return next(e);
        }
    });
}

function update(router, tableName) {
    router.put('/:id', async (req, res, next) => {
        try {
            await common.update(req, res, next, tableName, req.params.id);
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
            await common.select(req, res, next, query);
        })
        .post(async (req, res, next) => {
            try {
                let id = await dbUnique.insert(req, tableName, req.body.name, adminRestriction);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    router.route('/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE id = ?';

            await common.select(req, res, next, call, [req.params.id], true);
        })
        .delete(async (req, res, next) => {
            try {
                if (!req.user.admin) return next(new UserNotAdministratorError);

                await sql('DELETE FROM ' + tableName + ' WHERE id = ?', [req.params.id]);

                res.status(204).send();
            } catch(e) { return next(e); }
        });
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.schema = defaults.schema;
module.exports.removed = defaults.removed;
module.exports.remove = defaults.remove;
module.exports.revive = defaults.revive;
module.exports.canon = defaults.canon;
module.exports.clone = defaults.clone;
module.exports.comment = defaults.comment;
module.exports.image = defaults.image;
module.exports.label = defaults.label;
module.exports.count = defaults.count;
module.exports.permissions = defaults.permissions;

module.exports.automatic = automatic;

module.exports.root = root;
module.exports.single = single;
module.exports.insert = insert;
module.exports.update = update;

module.exports.unique = unique;