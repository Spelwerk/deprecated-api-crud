var async = require('async');

var sequel = require('./../sql/sequel'),
    ownership = require('./../sql/ownership');

module.exports = function(router) {
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
                    query('DELETE FROM generic_has_generic WHERE generic_id = ? AND relation_id = ?', [req.params.id, req.params.imageId], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};