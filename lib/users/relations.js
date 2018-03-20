'use strict';

const permission = require('../database/permission');
const basics = require('../routes/generic/generic');

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC/EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router, table, route) => {
    let user_has_table = 'user_has_' + table;
    let table_id = table + '_id';

    let query = 'SELECT * ' +
        'FROM ' + user_has_table + ' ' +
        'LEFT JOIN ' + table + ' ON ' + table + '.id = ' + user_has_table + '.' + table_id;

    router.route('/:id/' + route)
        .get(async (req, res, next) => {
            try {
                let call = query + ' WHERE ' + user_has_table + '.user_id = ?';

                await basics.select(req, res, next, call, [req.params.id]);
            } catch(e) {
                next(e);
            }
        })
        .post(async (req, res, next) => {
            try {
                await permission.keep(req, table, req.params.id);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        });

    router.route('/:id/' + route + '/:item')
        .get(async (req, res, next) => {
            try {
                let call = query + ' WHERE ' +
                    user_has_table + '.user_id = ? AND ' +
                    user_has_table + '.' + table_id + ' = ?';

                await basics.select(req, res, next, call, [req.params.id, req.params.item], true);
            } catch(e) {
                next(e);
            }
        })
        .delete(async (req, res, next) => {
            try {
                await permission.remove(req, table, req.params.id);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        });

    router.route('/:id/' + route + '/:item/edit')
        .post(async (req, res, next) => {
            try {
                await permission.edit(req, table, req.params.id, req.body.user_id, req.body.edit);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        });

    router.route('/:id/' + route + '/:item/favorite/:fav')
        .post(async (req, res, next) => {
            try {
                await permission.favorite(req, table, req.params.id, req.params.fav);

                res.status(204).send();
            } catch(e) {
                next(e);
            }
        });
};