var sequel = require('./../sql/sequel'),
    relation = require('./../sql/relation');

module.exports = function(router, routeName, tableName) {
    var sql = 'SELECT * ' +
        'FROM ' + tableName + ' ' +
        'LEFT JOIN generic ON generic.id = ' + tableName + '.generic_id ' +
        'LEFT JOIN generic_has_generic ON generic_has_generic.relation_id = generic.id ' +
        'WHERE ' +
        'deleted IS NULL';

    router.route('/:id/' + routeName)
        .get(function(req, res, next) {
            var call = sql + ' AND generic_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, req.params.id, req.body.insert_id, req.body.value, req.body.custom);
        });

    router.route('/:id/' + routeName + '/:relationId')
        .get(function(req, res, next) {
            var call = sql + ' AND ' +
                'generic_has_generic.generic_id = ? AND ' +
                'generic_has_generic.relation_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .put(function(req, res, next) {
            relation.put(req, res, next, req.params.id, req.params.relationId, req.body.value, req.body.custom);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, req.params.id, req.params.relationId);
        });
};