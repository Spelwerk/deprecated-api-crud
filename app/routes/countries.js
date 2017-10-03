'use strict';

var generic = require('../../lib/helper/generic'),
    countries = require('../../lib/tables/countries');

module.exports = function(router) {
    var tableName = 'country';

    var sql = 'SELECT * FROM ' + tableName + ' ' +
        'LEFT JOIN ' + tableName + '_is_copy ON ' + tableName + '_is_copy.' + tableName + '_id = ' + tableName + '.id';

    generic.root(router, tableName, sql);

    router.route('/')
        .post(function(req, res, next) {
            var name = req.body.name,
                description = req.body.description,
                languageId = req.body.language_id,
                nickNameGroupId = req.body.nicknamegroup_id,
                firstNameGroupId = req.body.firstnamegroup_id,
                lastNameGroupId = req.body.lastnamegroup_id;

            countries.post(req.user, name, description, languageId, nickNameGroupId, firstNameGroupId, lastNameGroupId, function(err, id) {
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
                languageId = req.body.language_id,
                nickNameGroupId = req.body.nicknamegroup_id,
                firstNameGroupId = req.body.firstnamegroup_id,
                lastNameGroupId = req.body.lastnamegroup_id;

            countries.put(req.user, id, name, description, languageId, nickNameGroupId, firstNameGroupId, lastNameGroupId, function(err, id) {
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
