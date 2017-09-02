var sequel = require('./../../lib/sql/sequel'),
    query = require('./../../lib/sql/query');

var unique = require('./../../lib/specific/unique');

module.exports = function(router) {
    'use strict';

    var tableName = 'surnamegroup';

    unique(router, tableName, true);

    router.route('/:id/surnames')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM surnamegroup_has_surname ' +
                'LEFT JOIN surname ON surname.id = surnamegroup_has_surname.surname_id ' +
                'WHERE ' +
                'surnamegroup_has_surname.surnamegroup_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('INSERT INTO surnamegroup_has_surname (surnamegroup_id,surname_id) VALUES (?,?)', [req.params.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/surnames/:surname')
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('DELETE FROM surnamegroup_has_surname WHERE surnamegroup_id = ? AND surname_id = ?', [req.params.id, req.params.surname], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
