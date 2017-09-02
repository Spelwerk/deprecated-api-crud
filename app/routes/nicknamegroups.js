var sequel = require('./../../lib/sql/sequel'),
    query = require('./../../lib/sql/query');

var unique = require('./../../lib/specific/unique');

module.exports = function(router) {
    'use strict';

    var tableName = 'nicknamegroup';

    unique(router, tableName, true);

    router.route('/:id/nicknames')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM nicknamegroup_has_nickname ' +
                'LEFT JOIN nickname ON nickname.id = nicknamegroup_has_nickname.nickname_id ' +
                'WHERE ' +
                'nicknamegroup_has_nickname.nicknamegroup_id = ?';

            sequel.get(req, res, next, call, [req.params.id]);
        })
        .post(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('INSERT INTO nicknamegroup_has_nickname (nicknamegroup_id,nickname_id) VALUES (?,?)', [req.params.id, req.body.insert_id], function(err) {
                if(err) return next(err);

                res.status(201).send();
            });
        });

    router.route('/:id/nicknames/:nickname')
        .delete(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            query('DELETE FROM nicknamegroup_has_nickname WHERE nicknamegroup_id = ? AND nickname_id = ?', [req.params.id, req.params.nickname], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

};
