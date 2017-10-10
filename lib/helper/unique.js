let UserNotAdministratorError = require('../errors/user-not-administrator-error');

var sequel = require('../sql/sequel'),
    query = require('../sql/query'),
    unique = require('../sql/unique');

module.exports = function(router, tableName, adminRestriction) {
    adminRestriction = adminRestriction || false;

    var sql = 'SELECT * FROM ' + tableName;

    router.route('/')
        .get(function(req, res, next) {
            sequel.get(req, res, next, sql);
        })
        .post(function(req, res, next) {
            unique.post(req.user, tableName, req.body.name, adminRestriction, function(err, id) {
                if(err) return next(err);

                res.status(201).send({id: id});
            });
        });

    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .delete(function(req, res, next) {
            if(!req.user.admin) return next(new UserNotAdministratorError);

            query('DELETE FROM ' + tableName + ' WHERE id = ?', [req.params.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });
};
