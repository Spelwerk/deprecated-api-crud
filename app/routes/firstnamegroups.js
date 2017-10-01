'use strict';

var sequel = require('../../lib/sql/sequel'),
    query = require('../../lib/sql/query');

var unique = require('../../lib/helper/unique');

module.exports = function(router) {
    var tableName = 'firstnamegroup',
        relationName = 'firstname';

    unique(router, tableName, true);

    router.route('/:id/firstnames')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM ' + tableName + '_has_' + relationName + ' ' +
                'LEFT JOIN ' + relationName + ' ON ' + relationName + '.id = ' + tableName + '_has_' + relationName + '.' + relationName + '_id ' +
                'WHERE ' +
                tableName + '_has_' + relationName + '.' + tableName + '_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('INSERT INTO ' + tableName + '_has_' + relationName + ' (' + tableName + '_id,' + relationName + '_id) VALUES (?,?)', [req.params.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/firstnames/:name')
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('DELETE FROM ' + tableName + '_has_' + relationName + ' WHERE ' + tableName + '_id = ? AND ' + relationName + '_id = ?', [req.params.id, req.params.name], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
