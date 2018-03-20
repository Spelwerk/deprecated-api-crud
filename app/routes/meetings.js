'use strict';

const basic = require('../../lib/routes/generic/generic');
const meetings = require('../../lib/routes/meetings/meetings');

module.exports = function(router) {
    let query = 'SELECT * FROM meeting';

    router.route('/')
        .post(async (req, res, next) => {
            try {
                let id = await meetings.insert(req, req.body);

                res.status(201).send({id: id});
            } catch(e) { return next(e); }
        });

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
                await meetings.update(req, req.body, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        });
};
