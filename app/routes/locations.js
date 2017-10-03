'use strict';

var generic = require('../../lib/helper/generic'),
    locations = require('../../lib/tables/locations');

module.exports = function(router) {
    var tableName = 'country';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                price = req.body.price,
                countryId = req.body.country_id,
                creatureId = req.body.creature_id,
                locationId = req.body.location_id;

            locations.post(req.user, name, description, price, countryId, creatureId, locationId, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    generic.deleted(router, tableName, sql);
    generic.get(router, tableName, sql);

    router.route('/:id')
        .put(function(req, res, next) {
            var id = req.params.id,
                name = req.body.name,
                description = req.body.description,
                price = req.body.price,
                countryId = req.body.country_id,
                creatureId = req.body.creature_id,
                locationId = req.body.location_id;

            locations.put(req.user, id, name, description, price, countryId, creatureId, locationId, function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    generic.delete(router, tableName, false, true);
    generic.canon(router, tableName);
    generic.clone(router, tableName);
    generic.comments(router, tableName);
    generic.labels(router, tableName);
    generic.ownership(router, tableName);
    generic.revive(router, tableName);
};
