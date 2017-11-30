'use strict';

let generic = require('../../lib/helper/generic'),
    sequel = require('../../lib/sql/sequel'),
    chapters = require('../../lib/helper/chapters');

module.exports = function(router) {
    const tableName = 'chapter';

    let sql = 'SELECT * FROM chapter';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            chapters.post(req.user, req.body.story_id, req.body.plot, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    generic.deleted(router, tableName, sql);

    router.route('/story/:storyId')
        .get(function(req, res, next) {
            let call = sql + ' WHERE story_id = ?';

            sequel.get(req, res, next, call, [req.params.storyId]);
        });

    router.route('/:id')
        .get(function(req, res, next) {
            let call = sql + ' WHERE id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .put(function(req, res, next) {
            chapters.put(req.user, req.params.id, req.body.plot, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            chapters.delete(req.user, req.params.id, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    generic.revive(router, tableName);
};
