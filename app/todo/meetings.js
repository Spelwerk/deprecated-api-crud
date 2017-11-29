'use strict';

let sequel = require('../../lib/sql/sequel'),
    meetings = require('../../lib/helper/meetings');

module.exports = function(router) {
    let sql = 'SELECT * FROM meeting';

    router.route('/')
        .post(function(req, res, next) {
            meetings.post(req.user, req.body.story_id, req.body.notes, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

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
            meetings.put(req.user, req.params.id, req.body.notes, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
