var sequel = require('./../../lib/sql/sequel'),
    query = require('./../../lib/sql/query');

var unique = require('./../../lib/specific/unique');

module.exports = function(router) {
    'use strict';

    var tableName = 'firstnamegroup';

    unique(router, tableName, true);

    router.route('/:id/firstnames')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM firstnamegroup_has_firstname ' +
                'LEFT JOIN firstname ON firstname.id = firstnamegroup_has_firstname.firstname_id ' +
                'WHERE ' +
                'firstnamegroup_has_firstname.firstnamegroup_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('INSERT INTO firstnamegroup_has_firstname (firstnamegroup_id,firstname_id) VALUES (?,?)', [req.params.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/firstnames/:firstname')
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('DELETE FROM firstnamegroup_has_firstname WHERE firstnamegroup_id = ? AND firstname_id = ?', [req.params.id, req.params.firstname], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
