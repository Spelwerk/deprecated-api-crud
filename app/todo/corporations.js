'use strict';

var generic = require('../../lib/helper/generic');

var sequel = require('../../lib/sql/sequel');

var corporations = require('../../lib/tables/corporations');

module.exports = function(router) {
    var tableName = 'corporation';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                countryId = req.body.country_id,
                locationId = req.body.location_id;

            corporations.post(req.user, name, description, countryId, locationId, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/deleted')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NOT NULL';

            sequel.get(req, res, next, call);
        });

    // ID

    generic.id(router, sql, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
