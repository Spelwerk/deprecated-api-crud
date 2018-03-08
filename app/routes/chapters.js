'use strict';

const routes = require('../../lib/generic/routes');
const basic = require('../../lib/generic/basics');
const chapters = require('../../lib/tables/chapters');

module.exports = (router) => {
    const tableName = 'chapter';

    let query = 'SELECT * FROM chapter';

    routes.root(router, tableName, query);

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await chapters.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

    routes.removed(router, tableName, query);
    routes.schema(router, tableName);

    router.route('/story/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE story_id = ?';

            await basic.select(req, res, next, call, [req.params.id]);
        });

    router.route('/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE id = ?';

            await basic.select(req, res, next, call, [req.params.id], true);
        })
        .put(async (req, res, next) => {
            try {
                await chapters.update(req, req.body, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        })
        .delete(async (req, res, next) => {
            try {
                await chapters.remove(req, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    routes.automatic(router, tableName);
};
