'use strict';

var async = require('async'),
    nconf = require('nconf'),
    moment = require('moment'),
    uuid = require('uuid/v4');

var query = require('../../lib/sql/query'),
    sequel = require('../../lib/sql/sequel'),
    hasher = require('../../lib/hasher'),
    mailer = require('../../lib/mailer'),
    onion = require('../../lib/onion'),
    users = require('../../lib/helper/users');

module.exports = function(router) {
    var sql = 'SELECT ' +
        'id, ' +
        'email, ' +
        'verified, ' +
        'admin, ' +
        'displayname, ' +
        'firstname, ' +
        'lastname, ' +
        'created, ' +
        'updated, ' +
        'deleted ' +
        'FROM user';

    // Basic user routes

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted is NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var user = {
                email: req.body.email.toLowerCase(),
                secret: uuid(),
                timeout: moment().add(nconf.get('timeouts:users:verify:amount'), nconf.get('timeouts:users:verify:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('INSERT INTO user (email) VALUES (?)', [user.email], function(err, result) {
                        if(err) return callback(err);

                        user.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_verification (user_id,secret,timeout) VALUES (?,?,?)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to verify your account creation: ' +
                        '<br/>' +
                        '<a href="' + nconf.get('links:base') + nconf.get('links:user:create') + user.secret + '">' + user.secret + '</a>' +
                        '<br/>' +
                        'This code will expire on : ' + user.timeout + ' or until it is used.' +
                        '<br/>';

                    mailer(user.email, 'User Verification', text, callback);
                },
                function(callback) {
                    users.token(req, user.id, function(err, result) {
                        if(err) return callback(err);

                        user.token = result;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(201).send({id: user.id, token: user.token});
            });
        });

    // Verifying that a user exists

    router.route('/exists/email/:email')
        .get(function(req, res, next) {
            var email = req.params.email.toUpperCase(),
                exists = false;

            query('SELECT id FROM user WHERE UPPER(email) = ? AND deleted IS NULL', [email], function(err, results) {
                if(err) return next(err);

                if(results[0].id) exists = true;

                res.status(200).send({existence: exists});
            });
        });

    router.route('/exists/name/:name')
        .get(function(req, res, next) {
            var displayName = req.params.name.toUpperCase(),
                exists = false;

            query('SELECT id FROM user WHERE UPPER(displayname) = ? AND deleted IS NULL', [displayName], function(err, results) {
                if(err) return next(err);

                if(results[0].id) exists = true;

                res.status(200).send({existence: exists});
            });
        });

    // Information about current user

    router.route('/info')
        .get(function(req, res, next) {
            if(!req.user) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            res.status(200).send({
                id: req.user.id,
                email: req.user.email,
                verified: req.user.verified,
                admin: req.user.admin
            });
        });

    // Tokens belonging to current user

    router.route('/tokens')
        .get(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            query('SELECT * FROM user_token WHERE user_id = ?', [req.user.id], function(err, results, fields) {
                if(err) return next(err);

                res.status(200).send({results: results, fields: fields});
            });
        });

    router.route('/tokens/:tokenId')
        .get(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            query('SELECT * FROM user_token WHERE user_id = ? AND id = ?', [req.user.id, req.params.tokenId], function(err, results, fields) {
                if(err) return next(err);

                if(!results[0]) return next({status: 404, message: 'Not Found', error: 'The requested object was not found.'});

                res.status(200).send({result: results[0], fields: fields});
            })
        })
        .delete(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            query('DELETE FROM user_token WHERE user_id = ? AND id = ?', [req.user.id, req.params.tokenId], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Logging in

    router.route('/login/password')
        .post(function(req, res, next) {
            var user = {},
                insert = {
                    email: req.body.email,
                    password: req.body.password
                };

            async.series([
                function(callback) {
                    query('SELECT id, password FROM user WHERE email = ? AND deleted IS NULL', [insert.email], function(err, result) {
                        if(err) return callback(err);

                        if(result.length === 0) return callback({status: 403, message: 'Forbidden', error: 'Missing Email'});

                        user.id = result[0].id;
                        user.password = result[0].password;

                        if(user.password === null) return callback({status: 403, message: 'Forbidden', error: 'Password not set, verify your account.'});

                        callback();
                    });
                },
                function(callback) {
                    onion.decrypt(insert.password, user.password, function(err, result) {
                        if(err) return callback(err);

                        if(!result) return callback({message: 'Wrong Password'});

                        callback();
                    });
                },
                function(callback) {
                    users.token(req, user.id, function(err, result) {
                        if(err) return callback(err);

                        user.token = result;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(200).send({id: user.id, token: user.token});
            });
        });

    router.route('/login/email')
        .post(function(req, res, next) {
            var user = {
                email: req.body.email.toUpperCase(),
                secret: uuid(),
                timeout: moment().add(nconf.get('timeouts:users:login:amount'), nconf.get('timeouts:users:login:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE UPPER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_login (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to login to your account: ' +
                        '<br/>' +
                        '<a href="' + nconf.get('links:base') + nconf.get('links:user:login') + user.secret + '">' + user.secret + '</a>' +
                        '<br/>' +
                        'This code will expire on : ' + user.timeout + ' or until it is used.' +
                        '<br/>';

                    mailer(user.email, 'User Verification', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/login/verify')
        .post(function(req, res, next) {
            var user = {
                secret: req.body.secret
            };

            async.series([
                function(callback) {
                    query('SELECT user_id AS id, timeout FROM user_login WHERE secret = ?', [user.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback({status: 403, message: 'Forbidden', error: 'The secret provided was not correct'});

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback({status: 403, message: 'Forbidden', error: 'Timeout Expired'});

                    callback();
                },
                function(callback) {
                    users.token(req, user.id, function(err, result) {
                        if(err) return callback(err);

                        user.token = result;

                        callback();
                    });
                },
                function(callback) {
                    query('DELETE FROM user_login WHERE user_id = ?', [user.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(200).send({id: user.id, token: user.token});
            });
        });

    // Verifying user

    router.route('/verify/email')
        .post(function(req, res, next) {
            var user = {
                email: req.body.email.toUpperCase(),
                secret: uuid(),
                timeout: moment().add(nconf.get('timeouts:users:verify:amount'), nconf.get('timeouts:users:verify:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE UPPER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_verification (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to verify your account creation: ' +
                        '<br/>' +
                        '<a href="' + nconf.get('links:base') + nconf.get('links:user:create') + user.secret + '">' + user.secret + '</a>' +
                        '<br/>' +
                        'This code will expire on : ' + user.timeout + ' or until it is used.' +
                        '<br/>';

                    mailer(user.email, 'User Verification', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/verify/verify')
        .post(function(req, res, next) {
            var user = {
                secret: req.body.secret,
                displayname: req.body.displayname.toLowerCase(),
                password: req.body.password,
                firstname: req.body.firstname || null,
                lastname: req.body.lastname || null,
                timeout: moment().format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT user_id AS id, timeout FROM user_verification WHERE secret = ?', [user.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback({status: 403, message: 'Forbidden', error: 'The secret provided was not correct'});

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback({status: 403, message: 'Forbidden', error: 'Timeout Expired'});

                    callback();
                },
                function(callback) {
                    onion.encrypt(user.password, function(err, result) {
                        if(err) return callback(err);

                        user.encrypted = result;

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE user SET displayname = ?, password = ?, firstname = ?, lastname = ?, verified = 1 WHERE id = ?', [user.displayname, user.encrypted, user.firstname, user.lastname], callback);
                },
                function(callback) {
                    query('DELETE FROM user_verification WHERE user_id = ?', [user.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Changing email

    router.route('/email/email')
        .post(function(req, res, next) {
            var user = {
                email: req.body.email.toUpperCase(),
                secret: uuid(),
                timeout: moment().add(nconf.get('timeouts:users:email:amount'), nconf.get('timeouts:users:email:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE UPPER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_email (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to change your email: ' +
                        '<br/>' +
                        '<a href="' + nconf.get('links:base') + nconf.get('links:user:email') + user.secret + '">' + user.secret + '</a>' +
                        '<br/>' +
                        'This code will expire on : ' + user.timeout + ' or until it is used.' +
                        '<br/>';

                    mailer(user.email, 'Email Change', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/email/verify')
        .post(function(req, res, next) {
            var user = {
                secret: req.body.secret,
                email: req.body.email.toLowerCase()
            };

            async.series([
                function(callback) {
                    query('SELECT user_id AS id, timeout FROM user_email WHERE secret = ?', [user.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback({status: 403, message: 'Forbidden', error: 'The secret provided was not correct'});

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT email FROM user WHERE id = ?', [user.id], function(err, results) {
                        if(err) return callback(err);

                        user.old = results[0].email;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback({status: 403, message: 'Forbidden', error: 'Timeout Expired'});

                    callback();
                },
                function(callback) {
                    query('UPDATE user SET email = ? WHERE id = ?', [user.email, user.id], callback);
                },
                function(callback) {
                    query('DELETE FROM user_email WHERE user_id = ?', [user.id], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Your email has now been changed to ' + user.email + '.' +
                        '<br/>';

                    mailer(user.old, 'Email Changed', text, callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Your email has now been changed to ' + user.email + '.' +
                        '<br/>';

                    mailer(user.email, 'Email Changed', text, callback);
                },
                function(callback) {
                    users.token(req, user.id, function(err, result) {
                        if(err) return callback(err);

                        user.token = result;

                        callback();
                    });
                }
            ], function(err) {
                if(err) return next(err);

                res.status(200).send({id: user.id, token: user.token});
            });
        });

    // Changing password

    router.route('/password/email')
        .post(function(req, res, next) {
            var user = {
                email: req.body.email.toUpperCase(),
                secret: uuid(),
                timeout: moment().add(nconf.get('timeouts:users:password:amount'), nconf.get('timeouts:users:password:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE UPPER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_reset (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to reset your password: ' +
                        '<br/>' +
                        '<a href="' + nconf.get('links:base') + nconf.get('links:user:password') + user.secret + '">' + user.secret + '</a>' +
                        '<br/>' +
                        'This code will expire on : ' + user.timeout + ' or until it is used.' +
                        '<br/>';

                    mailer(user.email, 'Password Reset', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/password/verify')
        .post(function(req, res, next) {
            var user = {
                secret: req.body.secret,
                password: req.body.password
            };

            async.series([
                function(callback) {
                    query('SELECT user_id AS id, timeout FROM user_reset WHERE secret = ?', [user.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback({status: 403, message: 'Forbidden', error: 'The secret provided was not correct'});

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT email FROM user WHERE id = ?', [user.id], function(err, results) {
                        if(err) return callback(err);

                        user.email = results[0].email;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback({status: 403, message: 'Forbidden', error: 'Timeout Expired'});

                    callback();
                },
                function(callback) {
                    onion.encrypt(user.password, function(err, result) {
                        if(err) return callback(err);

                        user.encrypted = result;

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE user SET password = ? WHERE id = ?', [user.encrypted, user.id], callback);
                },
                function(callback) {
                    query('DELETE FROM user_reset WHERE user_id = ?', [user.id], callback);
                },
                function(callback) {
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Your password has now been reset.' +
                        '<br/>';

                    mailer(user.email, 'Password Reset', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // User helper

    router.route('/:id')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted IS NULL AND id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User is not logged in'});

            var user = {};

            user.id = parseInt(req.params.id);
            user.firstname = req.body.firstname;
            user.lastname = req.body.lastname;

            if(!req.user.admin && req.user.id !== user.id) return next({status: 403, message: 'Forbidden', error: 'User is not administrator and may not edit other users'});

            query('UPDATE user SET firstname = ?, lastname = ? WHERE id = ? AND deleted IS NULL', [user.displayname, user.firstname, user.lastname, user.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            var user = {
                id: parseInt(req.params.id),
                email: 'DELETED {{' + req.params.id + '}}'
            };

            if(!req.user.admin && req.user.id !== user.id) return next({status: 403, message: 'Forbidden', error: 'User is not administrator and may not remove other users'});

            query('UPDATE user SET email = ?, admin = 0, verified = 0, displayname = NULL, password = NULL, firstname = NULL, surname = NULL, deleted = CURRENT_TIMESTAMP WHERE id = ?', [user.email, user.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/admin')
        .put(function(req, res, next) {
            if(!req.user.admin) return next({status: 403, message: 'Forbidden.', error: 'User is not administrator'});

            var user = {
                id: parseInt(req.params.id),
                admin: parseInt(req.body.admin)
            };

            query('UPDATE user SET admin = ? WHERE id = ? AND deleted IS NULL', [user.admin, user.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Relations

    users.relation(router, 'assetgroups', 'assetgroup');
    users.relation(router, 'assets', 'asset');
    users.relation(router, 'assettypes', 'assettype');
    users.relation(router, 'attributes', 'attribute');
    users.relation(router, 'augmentations', 'augmentation');
    users.relation(router, 'backgrounds', 'background');
    users.relation(router, 'bionics', 'bionic');
    users.relation(router, 'bodyparts', 'bodypart');
    users.relation(router, 'countries', 'country');
    users.relation(router, 'doctrines', 'doctrine');
    users.relation(router, 'expertises', 'expertise');
    users.relation(router, 'focuses', 'focus');
    users.relation(router, 'gifts', 'gift');
    users.relation(router, 'identities', 'identity');
    users.relation(router, 'imperfections', 'imperfection');
    users.relation(router, 'languages', 'language');
    users.relation(router, 'loyalties', 'loyalty');
    users.relation(router, 'manifestations', 'manifestation');
    users.relation(router, 'milestones', 'milestone');
    users.relation(router, 'natures', 'nature');
    users.relation(router, 'protection', 'protection');
    users.relation(router, 'skills', 'skill');
    users.relation(router, 'software', 'software');
    users.relation(router, 'species', 'species');
    users.relation(router, 'weaponmods', 'weaponmod');
    users.relation(router, 'weapons', 'weapon');
    users.relation(router, 'weapontypes', 'weapontype');
};