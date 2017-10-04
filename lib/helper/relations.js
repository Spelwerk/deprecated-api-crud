var sequel = require('../sql/sequel'),
    relation = require('../sql/relation');

module.exports = function(router, tableName, routeName, relationName) {
    var table_has_relation = tableName + '_has_' + relationName,
        table_id = tableName + '_id',
        relation_id = relationName + '_id';

    var sql = 'SELECT * ' +
        'FROM ' + table_has_relation + ' ' +
        'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + table_has_relation + '.' + relation_id  + ' ' +
        'WHERE deleted IS NULL';

    router.route('/:id/' + routeName)
        .get(function(req, res, next) {
            var call = sql + ' AND ' + table_has_relation + '.' + table_id  + ' = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            relation.post(req, res, next, tableName, req.params.id, relationName, req.body.insert_id, req.body.value);
        });

    router.route('/:id/' + routeName + '/:relationId')
        .get(function(req, res, next) {
            var call = sql + ' AND ' +
                table_has_relation + '.' + table_id  + ' = ? AND ' +
                table_has_relation + '.' + relation_id + ' = ?';

            sequel.get(req, res, next, call, [req.params.id, req.params.relationId]);
        })
        .put(function(req, res, next) {
            relation.value(req, res, next, tableName, req.params.id, relationName, req.params.relationId, req.body.value);
        })
        .delete(function(req, res, next) {
            relation.delete(req, res, next, tableName, req.params.id, relationName, req.params.relationId);
        });
};