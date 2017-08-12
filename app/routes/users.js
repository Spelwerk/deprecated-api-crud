'use strict';

var async = require('async'),
    nconf = require('nconf'),
    moment = require('moment');

var query = require('./../../lib/sql/query'),
    sequel = require('./../../lib/sql/sequel'),
    hasher = require('./../../lib/hasher'),
    mailer = require('./../../lib/mailer'),
    onion = require('./../../lib/onion'),
    tokens = require('./../../lib/tokens');

module.exports = function(router) {
    var sql = 'SELECT ' +
        'id, ' +
        'displayname, ' +
        'email, ' +
        'verify, ' +
        'admin, ' +
        'firstname, ' +
        'surname, ' +
        'created, ' +
        'updated, ' +
        'deleted ' +
        'FROM user';

    function relationPost(req, res, next, userId, relationName, relationId) {
        if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User ID missing.'});

        if(req.user.id !== userId && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator and may not edit other users.'});

        query('INSERT INTO user_has_' + relationName + ' (user_id,' + relationName + '_id) VALUES (?,?)', [userId, relationId], function(err) {
            if(err) return next(err);

            res.status(200).send({success: true, message: 'Successfully added the table row to the current user'});
        });
    }

    function relationDelete(req, res, next, userId, relationName, relationId) {
        if(!req.user.id) return next({status: 403, message: 'Forbidden', error: 'User ID missing.'});

        if(req.user.id !== userId && !req.user.admin) return next({status: 403, message: 'Forbidden', error: 'User is not administrator and may not edit other users.'});

        query('DELETE FROM user_has_' + relationName + ' WHERE user_id = ? AND ' + relationName + '_id = ?', [userId, relationId], function(err) {
            if(err) return next(err);

            res.status(200).send({success: true, message: 'Successfully removed the table row from the current user'});
        });
    }

    function loginToken(req, userId, callback) {
        var user = {};

        user.id = userId;
        user.os = req.body.os || '';
        user.browser = req.body.browser || '';
        user.ip = req.body.ip || '';

        async.series([
            function(callback) {
                query('SELECT email FROM user WHERE id = ? AND deleted IS NULL', [user.id], function(err, result) {
                    if(err) return callback({status: 500, message: 'Database error', error: err.error, query: err.query});

                    if(!result[0]) return callback({status: 404, message: 'Not found', error: 'User not found on successful database request'});

                    user.email = result[0].email;

                    callback();
                });
            },
            function(callback) {
                user.token = tokens.encode(user.email);

                callback();
            },
            function(callback) {
                query('INSERT INTO usertoken (user_id,token,os,browser,ip) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE token = VALUES (token)', [user.id, user.token, user.os, user.browser, user.ip], callback);
            }
        ],function(err) {
            callback(err, user.token);
        });
    }

    router.route('/')
        .get(function(req, res, next) {
            var call = sql + ' WHERE deleted is NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.email = req.body.email;
            insert.password = req.body.password || hasher(128);
            insert.displayname = req.body.displayname || req.body.email;

            async.series([
                function(callback) {
                    onion.encrypt(insert.password, function(err, result) {
                        insert.encrypted = result;

                        callback(err);
                    });
                },
                function(callback) {
                    insert.verify = {};
                    insert.verify.secret = hasher(128);
                    insert.verify.timeout = moment().add(nconf.get('timeouts:users:verify:amount'), nconf.get('timeouts:users:verify:time')).format("YYYY-MM-DD HH:mm:ss");

                    query('INSERT INTO user (email,password,displayname,verify_secret,verify_timeout) VALUES (?,?,?,?,?)', [insert.email, insert.encrypted, insert.displayname, insert.verify.secret, insert.verify.timeout], function(err, result) {
                        user.id = result.insertId;

                        callback(err);
                    });
                },
                function(callback) {
                    var subject = 'User Verification';
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to verify your account creation: <a href="' + nconf.get('links:base') + nconf.get('links:users:create') + insert.verify.secret + '">' + insert.verify.secret + '</a>' +
                        '<br/>'
                    ;

                    mailer(insert.email, subject, text, callback);
                },
                function(callback) {
                    loginToken(req, user.id, function(err, result) {
                        user.token = result;

                        callback(err);
                    });
                }
            ],function(err) {
                if(err) return next(err);

                res.status(201).send({success: true, message: '', id: user.id, token: user.token});
            });
        });

    // Information about current user

    router.route('/info')
        .get(function(req, res, next) {
            if(!req.user) return next('Forbidden');

            res.status(200).send({success: true, message: '', data: req.user.select});
        });

    // Tokens belonging to current user

    router.route('/tokens')
        .get(function(req, res, next) {
            query('SELECT * FROM usertoken WHERE user_id = ?', [req.user.id], function(err, result) {
                if(err) return next(err);

                res.status(200).send({success: true, message: '', data: result});
            });
        });

    // Logging in

    router.route('/login/password')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.email = req.body.email;
            insert.password = req.body.password;

            async.series([
                function(callback) {
                    query('SELECT id,password FROM user WHERE email = ? AND deleted IS NULL', [insert.email], function(err, result) {
                        if(!result[0]) return callback({message: 'Missing Email'});

                        user.id = result[0].id;
                        user.password = result[0].password;

                        callback(err);
                    });
                },
                function(callback) {
                    onion.decrypt(insert.password, user.password, function(err, result) {
                        if(!result) return callback({message: 'Wrong Password'});

                        callback(err);
                    });
                },
                function(callback) {
                    loginToken(req, user.id, function(err, result) {
                        user.token = result;

                        callback(err);
                    });
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: '', id: user.id, token: user.token});
            });
        });

    router.route('/login/email')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.email = req.body.email;

            insert.login = {};
            insert.login.secret = hasher(128);
            insert.login.timeout = moment().add(nconf.get('timeouts:users:login:amount'), nconf.get('timeouts:users:login:time')).format("YYYY-MM-DD HH:mm:ss");

            async.series([
                function(callback) {
                    query('UPDATE user SET login_secret = ?, login_timeout = ? WHERE email = ? AND deleted IS NULL', [insert.login.secret, insert.login.timeout, insert.email], callback);
                },
                function (callback) {
                    var subject = 'User Verification';
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to login to your account: <a href="' + nconf.get('links:base') + nconf.get('links:users:login') + insert.login.secret + '">' + insert.login.secret + '</a>' +
                        '<br/>'
                    ;

                    mailer(insert.email, subject, text, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    router.route('/login/verify')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.secret = req.body.secret;

            async.series([
                function(callback) {
                    query('SELECT id, login_timeout AS timeout FROM user WHERE login_secret = ?', [insert.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback('Wrong Secret.');

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback('Timeout Expired.');

                    callback();
                },
                function(callback) {
                    query('UPDATE user SET login_secret = NULL, login_timeout = NULL WHERE id = ?', [user.id], callback);
                },
                function(callback) {
                    loginToken(req, user.id, function(err, result) {
                        user.token = result;

                        callback(err);
                    });
                },
                function(callback) {
                    query('UPDATE user SET login_secret = NULL, login_timeout = NULL WHERE id = ?', [user.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: '', id: user.id, token: user.token});
            });
        });

    // Verifying user

    router.route('/verify/email')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.email = req.body.email;

            insert.verify = {};
            insert.verify.secret = hasher(128);
            insert.verify.timeout = moment().add(nconf.get('timeouts:users:verify:amount'), nconf.get('timeouts:users:verify:time')).format("YYYY-MM-DD HH:mm:ss");

            async.series([
                function(callback) {
                    query('UPDATE user SET verify_secret = ?, verify_timeout = ? WHERE email = ?', [insert.verify.secret, insert.verify.timeout, insert.email], callback);
                },
                function(callback) {
                    var subject = 'User Verification';
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to verify your account creation: <a href="' + nconf.get('links:base') + nconf.get('links:users:create') + insert.verify.secret + '">' + insert.verify.secret + '</a>' +
                        '<br/>'
                    ;

                    mailer(insert.email, subject, text, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send();
            });
        });

    router.route('/verify/verify')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.secret = req.body.secret;
            insert.displayname = req.body.displayname;
            insert.firstname = req.body.firstname;
            insert.surname = req.body.surname;
            insert.password = req.body.password;
            insert.timeout = moment().format("YYYY-MM-DD HH:mm:ss");

            async.series([
                function(callback) {
                    query('SELECT id, verify_timeout AS timeout FROM user WHERE verify_secret = ?', [insert.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback('Wrong Secret.');

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback('Timeout Expired.');

                    callback();
                },
                function(callback) {
                    onion.encrypt(insert.password, function(err, result) {
                        insert.encrypted = result;

                        callback(err);
                    });
                },
                function(callback) {
                    query('UPDATE user SET password = ?, displayname = ?, firstname = ?, surname = ?, verify = 1, verify_secret = NULL, verify_timeout = NULL WHERE id = ?', [insert.encrypted, insert.displayname, insert.firstname, insert.surname, user.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    // Changing email

    router.route('/email/email')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.email = req.body.email;

            insert.reset = {};
            insert.reset.secret = hasher(128);
            insert.reset.timeout = moment().add(nconf.get('timeouts:users:email:amount'), nconf.get('timeouts:users:email:time')).format("YYYY-MM-DD HH:mm:ss");

            async.series([
                function(callback) {
                    query('UPDATE user SET reset_secret = ?, reset_timeout = ? WHERE email = ? AND deleted IS NULL', [insert.reset.secret, insert.reset.timeout, insert.email], callback);
                },
                function(callback) {
                    var subject = 'Email Change';
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to change your email: <a href="' + nconf.get('links:base') + nconf.get('links:users:email') + insert.reset.secret + '">' + insert.reset.secret + '</a>' +
                        '<br/>'
                    ;

                    mailer(insert.email, subject, text, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    router.route('/email/verify')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.secret = req.body.secret;
            insert.email = req.body.email;

            async.series([
                function(callback) {
                    query('SELECT id, reset_timeout AS timeout FROM user WHERE reset_secret = ?', [insert.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback('Wrong Secret.');

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback('Timeout Expired.');

                    callback();
                },
                function(callback) {
                    query('UPDATE user SET email = ?, reset_secret = NULL, reset_timeout = NULL WHERE id = ?', [insert.email, user.id], callback);
                },
                function(callback) {
                    loginToken(req, user.id, function(err, result) {
                        user.token = result;

                        callback(err);
                    });
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: '', id: user.id, token: user.token});
            });
        });

    // Changing password

    router.route('/password/email')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.email = req.body.email;

            insert.reset = {};
            insert.reset.secret = hasher(128);
            insert.reset.timeout = moment().add(nconf.get('timeouts:users:password:amount'), nconf.get('timeouts:users:password:time')).format("YYYY-MM-DD HH:mm:ss");

            async.series([
                function(callback) {
                    query('UPDATE user SET reset_secret = ?, reset_timeout = ? WHERE email = ? AND deleted IS NULL', [insert.reset.secret, insert.reset.timeout, insert.email], callback);
                },
                function(callback) {
                    var subject = 'Password Reset';
                    var text =
                        '<b>Hello!</b>' +
                        '<br/>' +
                        'Use the following verification code to reset your password: <a href="' + nconf.get('links:base') + nconf.get('links:users:password') + insert.reset.secret + '">' + insert.reset.secret + '</a>' +
                        '<br/>'
                    ;

                    mailer(insert.email, subject, text, callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    router.route('/password/verify')
        .post(function(req, res, next) {
            var user = {},
                insert = {};

            insert.secret = req.body.secret;
            insert.password = req.body.password;

            async.series([
                function(callback) {
                    query('SELECT id, reset_timeout AS timeout FROM user WHERE reset_secret = ?', [insert.secret], function(err, result) {
                        if(err) return callback(err);

                        if(!result[0]) return callback('Wrong Secret.');

                        user.id = result[0].id;
                        user.timeout = result[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    if(moment(user.timeout).isBefore(moment())) return callback('Timeout Expired.');

                    callback();
                },
                function(callback) {
                    onion.encrypt(insert.password, function(err, result) {
                        insert.encrypted = result;

                        callback(err);
                    });
                },
                function(callback) {
                    query('UPDATE user SET password = ?, reset_secret = NULL, reset_timeout = NULL WHERE id = ?', [insert.encrypted, user.id], callback);
                }
            ],function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    // User specific

    router.route('/:userId')
        .get(function(req, res, next) {
            var call = sql + ' WHERE user.id = ?';

            sequel.get(req, res, next, call, [req.params.userId]);
        })
        .put(function(req, res, next) {
            var insert = {};

            insert.id = req.params.userId;
            insert.displayname = req.body.displayname;
            insert.firstname = req.body.firstname;
            insert.surname = req.body.surname;

            if(!req.user.token || (!req.user.admin && req.user.id !== insert.id)) return next('Forbidden.');

            query('INSERT INTO user (displayname,firstname,surname) VALUES (?,?,?) WHERE id = ?', [insert.displayname, insert.firstname, insert.surname, insert.id], function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        })
        .delete(function(req, res, next) {
            var insert = {};

            insert.id = req.params.id;

            if(!req.user.admin && req.user.id !== insert.id) return next('Forbidden');

            query('UPDATE user SET deleted = CURRENT_TIMESTAMP WHERE id = ?', [insert.id], function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    router.route('/:userId/admin')
        .put(function(req, res, next) {
            var insert = {};

            insert.id = req.params.userId;
            insert.admin = req.body.admin;

            if(!req.user.admin) return next('Forbidden.');

            query('UPDATE user SET admin = ? WHERE id = ?', [insert.admin, insert.id], function(err) {
                if(err) return next(err);

                res.status(200).send({success: true, message: ''});
            });
        });

    // User owned assets

    router.route('/:userId/assets')
        .get(function(req, res, next) {
            var call = 'SELECT * FROM user_has_asset ' +
                'LEFT JOIN asset ON asset.id = user_has_asset.asset_id ' +
                'WHERE ' +
                'user_has_asset.user_id = ? AND ' +
                'asset.deleted IS NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            relationPost(req, res, next, req.params.userId, 'asset', req.body.insert_id);
        });

    router.route('/:userId/assets/:assetId')
        .delete(function(req, res, next) {
            relationDelete(req, res, next, req.params.userId, 'asset', req.body.insert_id);
        });

};