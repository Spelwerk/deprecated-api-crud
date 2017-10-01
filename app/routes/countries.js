'use strict';

var generic = require('../../lib/helper/generic');

var sequel = require('../../lib/sql/sequel');

var countries = require('../../lib/tables/countries');

module.exports = function(router) {
    var tableName = 'focus';

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
                languageId = req.body.language_id,
                nickNameGroupId = req.body.nicknamegroup_id,
                firstNameGroupId = req.body.firstnamegroup_id,
                lastNameGroupId = req.body.lastnamegroup_id;

            countries(req.user, name, description, languageId, nickNameGroupId, firstNameGroupId, lastNameGroupId, function(err, id) {
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
