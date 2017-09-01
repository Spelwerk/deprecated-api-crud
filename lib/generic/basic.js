var generic = require('./../sql/generic'),
    sequel = require('./../sql/sequel');

module.exports.root = function(router, sql, tableName) {
    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE canon = 1 AND deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            generic.post(req, res, next, tableName);
        });
};

module.exports.id = function(router, sql, tableName) {
    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            generic.put(req, res, next, tableName, req.params.id);
        })
        .delete(function(req, res, next) {
            generic.delete(req, res, next, req.params.id);
        });
};

module.exports.canon = function(router) {
    router.route('/:id/canon')
        .put(function(req, res, next) {
            generic.canon(req, res, next, req.params.id);
        });
};

module.exports.clone = function(router, tableName) {
    router.route('/:id/clone')
        .post(function(req, res, next) {
            generic.clone(req, res, next, tableName, req.params.id);
        });
};

module.exports.comments = function(router) {
    router.route('/:id/comments')
        .get(function(req, res, next) {
            comment.get(req, res, next, req.params.id);
        })
        .post(function(req, res, next) {
            comment.post(req, res, next, req.params.id);
        });
};

module.exports.ownership = function(router) {
    router.route('/:id/ownership')
        .get(function(req, res) {
            ownership(req, req.params.id, function(err) {
                var ownership = true;

                if(err) ownership = false;

                res.status(200).send({ownership: ownership});
            })
        });
};