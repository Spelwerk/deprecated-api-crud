var sequel = require('./../sql/sequel'),
    relation = require('./../sql/relation');

function GET(router, routeName, tableName) {
    router.route('/:id/' + routeName)
        .get(function(req, res, next) {
            var call = 'SELECT * FROM generic_has_generic ' +
                'LEFT JOIN generic ON generic.id = generic_has_generic.relation_id ' +
                'LEFT JOIN ' + tableName + ' ON ' + tableName + '.generic_id = generic_has_generic.relation_id ' +
                'WHERE ' +
                'generic_has_generic.generic_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        });
}

function POST(router, routeName) {
    router.route('/:id/' + routeName)
        .post(function(req, res, next) {
            relation.post(req, res, next, req.params.id, req.body.insert_id, req.body.value, req.body.custom);
        });
}

function PUT(router, routeName) {
    router.route('/:id/' + routeName + '/:relationId')
        .put(function(req, res, next) {
            relation.put(req, res, next, req.params.id, req.params.relationId, req.body.value, req.body.custom);
        });
}

function CUSTOM(router, routeName) {
    router.route('/:id/' + routeName + '/:relationId')
        .put(function(req, res, next) {
            relation.custom(req, res, next, req.params.id, req.params.relationId, req.body.custom);
        });
}

function VALUE(router, routeName) {
    router.route('/:id/' + routeName + '/:relationId')
        .put(function(req, res, next) {
            relation.value(req, res, next, req.params.id, req.params.relationId, req.body.value);
        });
}

function DELETE(router, routeName) {
    router.route('/:id/' + routeName + '/:relationId')
        .delete(function(req, res, next) {
            relation.delete(req, res, next, req.params.id, req.params.relationId);
        });
}

module.exports = function(router, routeName, tableName, useValue, useCustom) {
    useValue = useValue || false;
    useCustom = useCustom || false;

    GET(router, routeName, tableName);
    POST(router, routeName);
    DELETE(router, routeName);

    if(useValue && useCustom) {
        PUT(router, routeName);
    } else if(useValue && !useCustom) {
        VALUE(router, routeName);
    } else {
        CUSTOM(router, routeName);
    }
};