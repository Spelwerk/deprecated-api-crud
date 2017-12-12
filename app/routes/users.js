'use strict';

let UserDisplaynameAlreadyExistsError = require('../../lib/errors/user-displayname-already-exists-error'),
    UserEmailAlreadyExistsError = require('../../lib/errors/user-email-already-exists-error'),
    UserExpiredTimeoutError = require('../../lib/errors/user-expired-timeout-error'),
    UserInvalidEmailError = require('../../lib/errors/user-invalid-email-error'),
    UserInvalidPasswordError = require('../../lib/errors/user-invalid-password-error'),
    UserInvalidSecretError = require('../../lib/errors/user-invalid-secret-error'),
    UserInvalidTokenError = require('../../lib/errors/user-invalid-token-error'),
    UserNotAdministratorError = require('../../lib/errors/user-not-administrator-error'),
    UserNotFoundError = require('../../lib/errors/user-not-found-error'),
    UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error'),
    UserPasswordNotSetError = require('../../lib/errors/user-password-not-set-error');

let async = require('async'),
    nconf = require('nconf'),
    moment = require('moment');

let query = require('../../lib/sql/query'),
    sequel = require('../../lib/helper/sequel'),
    mailer = require('../../lib/mailer'),
    onion = require('../../lib/onion'),
    hasher = require('../../lib/hasher'),
    users = require('../../lib/helper/users');

module.exports = function(router) {
    let sql = 'SELECT ' +
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
            let call = sql + ' WHERE deleted is NULL';

            sequel.get(req, res, next, call);
        })
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                displayname: req.body.displayname || null,
                password: req.body.password || null,
                encrypted: null,
                firstname: req.body.firstname || null,
                lastname: req.body.lastname || null,
                secret: hasher(256),
                timeout: moment().add(nconf.get('timeouts:user:verify:amount'), nconf.get('timeouts:user:verify:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            let object = {
                browser: req.body.browser,
                ip: req.body.ip || req.connection.remoteAddress,
                os: req.body.os
            };

            async.series([
                function(callback) {
                    if(!user.password) return callback();

                    onion.encrypt(user.password, function(err, result) {
                        if(err) return callback(err);

                        user.encrypted = result;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user (email,displayname,password,firstname,lastname) VALUES (?,?,?,?,?)', [user.email, user.displayname, user.encrypted, user.firstname, user.lastname], function(err, result) {

                        // If there's an error, and the code is DUP_ENTRY we probably have an issue with email or displayname
                        if(err && err.uniqueKey === 'email') {
                            return callback(new UserEmailAlreadyExistsError)

                        } else if(err && err.uniqueKey === 'displayname') {
                            return callback(new UserDisplaynameAlreadyExistsError)

                        } else if(err) {
                            return callback(err);
                        }

                        if(err) return callback(err);

                        user.id = result.insertId;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_verification (user_id,secret,timeout) VALUES (?,?,?)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-post')(user.secret, user.timeout);

                    mailer(user.email, 'User Verification', text, callback);
                },
                function(callback) {
                    users.token(user.id, object, function(err, result) {
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

    // List administrators

    router.route('/administrators')
        .get(function(req, res, next) {
            let call = sql + ' WHERE admin = 1 AND deleted is NULL';

            sequel.get(req, res, next, call);
        });

    // Verifying that a user exists

    router.route('/exists/email/:email')
        .get(function(req, res, next) {
            let email = req.params.email.toLowerCase(),
                exists = false;

            query('SELECT id FROM user WHERE LOWER(email) = ?', [email], function(err, results) {
                if(err) return next(err);

                exists = !!results[0];

                res.status(200).send({exists: exists});
            });
        });

    router.route('/exists/name/:name')
        .get(function(req, res, next) {
            let displayName = req.params.name.toLowerCase(),
                exists = false;

            query('SELECT id FROM user WHERE LOWER(displayname) = ?', [displayName], function(err, results) {
                if(err) return next(err);

                exists = !!results[0];

                res.status(200).send({exists: exists});
            });
        });

    // Information about current logged in user

    router.route('/info')
        .get(function(req, res, next) {
            if(!req.user) return next(new UserNotLoggedInError);

            res.status(200).send({
                id: req.user.id,
                verified: req.user.verified,
                admin: req.user.admin
            });
        });

    // Tokens belonging to current logged in user

    router.route('/tokens')
        .get(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            query('SELECT * FROM user_token WHERE user_id = ?', [req.user.id], function(err, results, fields) {
                if(err) return next(err);

                res.status(200).send({results: results, fields: fields});
            });
        });

    router.route('/tokens/:tokenId')
        .get(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            query('SELECT * FROM user_token WHERE user_id = ? AND id = ?', [req.user.id, req.params.tokenId], function(err, results, fields) {
                if(err) return next(err);

                if(results.length === 0) return next(new UserInvalidTokenError);

                res.status(200).send({result: results[0], fields: fields});
            })
        })
        .put(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let tokenId = parseInt(req.params.tokenId),
                tokenName = req.body.name || null;

            query('UPDATE user_token SET name = ? WHERE user_id = ? AND id = ?', [tokenName, req.user.id, tokenId], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let tokenId = parseInt(req.params.tokenId);

            query('DELETE FROM user_token WHERE user_id = ? AND id = ?', [req.user.id, tokenId], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Login

    router.route('/login/password')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                password: req.body.password,
                passwordError: false
            };

            let object = {
                browser: req.body.browser,
                ip: req.body.ip || req.connection.remoteAddress,
                os: req.body.os
            };

            async.series([
                function(callback) {
                    query('SELECT id, password FROM user WHERE LOWER(email) = ? AND deleted IS NULL', [user.email], function(err, result) {
                        if(err) return callback(err);

                        if(result.length === 0) return callback(new UserInvalidEmailError);

                        user.id = result[0].id;
                        user.select = result[0].password;

                        if(user.select === null) return callback(new UserPasswordNotSetError);

                        callback();
                    });
                },
                function(callback) {
                    onion.decrypt(user.password, user.select, function(err, result) {
                        if(err) return callback(err);

                        if(!result) user.passwordError = true;

                        callback();
                    });
                },
                function(callback) {
                    if(!user.passwordError) return callback();

                    let text = require('../../lib/templates/user-login-password-error')();

                    mailer(user.email, 'Erroneous User Login Notification', text, callback);
                },
                function(callback) {
                    if(!user.passwordError) return callback();

                    callback(new UserInvalidPasswordError);
                },
                function(callback) {
                    users.token(user.id, object, function(err, result) {
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
            let user = {
                email: req.body.email.toLowerCase(),
                secret: hasher(256),
                timeout: moment().add(nconf.get('timeouts:user:login:amount'), nconf.get('timeouts:user:login:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_login (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-login')(user.secret, user.timeout);

                    mailer(user.email, 'User Verification', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/login/secret')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                secret: req.body.secret
            };

            let object = {
                browser: req.body.browser,
                ip: req.body.ip || req.connection.remoteAddress,
                os: req.body.os
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ?', [user.email], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserNotFoundError);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT timeout FROM user_login WHERE user_id = ? AND secret = ?', [user.id, user.secret], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserInvalidSecretError(user.secret));

                        user.timeout = results[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    let timeout = moment(user.timeout),
                        now = moment();

                    if(timeout.isBefore(now)) return callback(new UserExpiredTimeoutError(now, timeout));

                    callback();
                },
                function(callback) {
                    users.token(user.id, object, function(err, result) {
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

    // Verifying

    router.route('/verify/email')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                secret: hasher(256),
                timeout: moment().add(nconf.get('timeouts:user:verify:amount'), nconf.get('timeouts:user:verify:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_verification (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-verify')(user.secret, user.timeout);

                    mailer(user.email, 'User Verification', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/verify/secret')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                displayname: req.body.displayname.toLowerCase(),
                password: req.body.password || null,
                encrypted: null,
                firstname: req.body.firstname || null,
                lastname: req.body.lastname || null,
                secret: req.body.secret,
                timeout: null
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ?', [user.email], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserNotFoundError);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT timeout FROM user_verification WHERE user_id = ? AND secret = ?', [user.id, user.secret], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserInvalidSecretError(user.secret));

                        user.timeout = results[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    let timeout = moment(user.timeout),
                        now = moment();

                    if(timeout.isBefore(now)) return callback(new UserExpiredTimeoutError(now, timeout));

                    callback();
                },
                function(callback) {
                    if(!user.password) return callback();

                    onion.encrypt(user.password, function(err, result) {
                        if(err) return callback(err);

                        user.encrypted = result;

                        callback();
                    });
                },
                function(callback) {
                    query('UPDATE user SET displayname = ?, password = ?, firstname = ?, lastname = ?, verified = 1 WHERE id = ?', [user.displayname, user.encrypted, user.firstname, user.lastname, user.id], callback);
                },
                function(callback) {
                    query('DELETE FROM user_verification WHERE user_id = ?', [user.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Email

    router.route('/email/email')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                secret: hasher(256),
                timeout: moment().add(nconf.get('timeouts:user:email:amount'), nconf.get('timeouts:user:email:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_email (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-reset-email')(user.secret, user.timeout);

                    mailer(user.email, 'Email Change', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/email/secret')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                secret: req.body.secret,
                newEmail: req.body.newEmail.toLowerCase()
            };

            let object = {
                browser: req.body.browser,
                ip: req.body.ip || req.connection.remoteAddress,
                os: req.body.os
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ?', [user.email], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserNotFoundError);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT timeout FROM user_email WHERE user_id = ? AND secret = ?', [user.id, user.secret], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserInvalidSecretError(user.secret));

                        user.timeout = results[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    let timeout = moment(user.timeout),
                        now = moment();

                    if(timeout.isBefore(now)) return callback(new UserExpiredTimeoutError(now, timeout));

                    callback();
                },
                function(callback) {
                    query('UPDATE user SET email = ? WHERE id = ?', [user.newEmail, user.id], callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-reset-email-confirmation')(user.newEmail);

                    mailer(user.email, 'Email Changed', text, callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-reset-email-confirmation')(user.newEmail);

                    mailer(user.newEmail, 'Email Changed', text, callback);
                },
                function(callback) {
                    users.token(user.id, object, function(err, result) {
                        if(err) return callback(err);

                        user.token = result;

                        callback();
                    });
                },
                function(callback) {
                    query('DELETE FROM user_email WHERE user_id = ?', [user.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(200).send({id: user.id, token: user.token});
            });
        });

    // Password

    router.route('/password/email')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                secret: hasher(256),
                timeout: moment().add(nconf.get('timeouts:user:password:amount'), nconf.get('timeouts:user:password:time')).format("YYYY-MM-DD HH:mm:ss")
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ? AND deleted IS NULL', [user.email], function(err, results) {
                        if(err) return callback(err);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('INSERT INTO user_reset (user_id,secret,timeout) VALUES (?,?,?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), timeout = VALUES(timeout)', [user.id, user.secret, user.timeout], callback);
                },
                function(callback) {
                    let text = require('../../lib/templates/user-reset-password')(user.secret, user.timeout);

                    mailer(user.email, 'Password Reset', text, callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/password/secret')
        .post(function(req, res, next) {
            let user = {
                email: req.body.email.toLowerCase(),
                secret: req.body.secret,
                password: req.body.password
            };

            async.series([
                function(callback) {
                    query('SELECT id FROM user WHERE LOWER(email) = ?', [user.email], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserNotFoundError);

                        user.id = results[0].id;

                        callback();
                    });
                },
                function(callback) {
                    query('SELECT timeout FROM user_reset WHERE user_id = ? AND secret = ?', [user.id, user.secret], function(err, results) {
                        if(err) return callback(err);

                        if(results.length === 0) return callback(new UserInvalidSecretError(user.secret));

                        user.timeout = results[0].timeout;

                        callback();
                    });
                },
                function(callback) {
                    let timeout = moment(user.timeout),
                        now = moment();

                    if(timeout.isBefore(now)) return callback(new UserExpiredTimeoutError(now, timeout));

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
                    let text = require('../../lib/templates/user-reset-password-confirmation')();

                    mailer(user.email, 'Password Reset', text, callback);
                },
                function(callback) {
                    query('DELETE FROM user_reset WHERE user_id = ?', [user.id], callback);
                }
            ], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Specific User

    router.route('/:id')
        .get(function(req, res, next) {
            let call = sql + ' WHERE deleted IS NULL AND id = ?';

            sequel.get(req, res, next, call, [req.params.id], true);
        })
        .put(function(req, res, next) {
            if(!req.user.id) return next(new UserNotLoggedInError);

            let user = {
                id: parseInt(req.params.id),
                displayname: req.body.displayname,
                firstname: req.body.firstname,
                lastname: req.body.lastname
            };

            if(!req.user.admin && req.user.id !== user.id) return next(new UserNotAdministratorError);

            query('UPDATE user SET firstname = ?, lastname = ? WHERE id = ? AND deleted IS NULL', [user.displayname, user.firstname, user.lastname, user.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        })
        .delete(function(req, res, next) {
            let user = {
                id: parseInt(req.params.id),
                email: 'DELETED{{' + req.params.id + '}}'
            };

            if(!req.user.admin && req.user.id !== user.id) return next(new UserNotAdministratorError);

            query('UPDATE user SET email = ?, admin = 0, verified = 0, displayname = NULL, password = NULL, firstname = NULL, surname = NULL, deleted = CURRENT_TIMESTAMP WHERE id = ?', [user.email, user.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/admin')
        .put(function(req, res, next) {
            if(!req.user.admin) return next(new UserNotAdministratorError);

            let user = {
                id: parseInt(req.params.id),
                admin: parseInt(req.body.admin)
            };

            query('UPDATE user SET admin = ? WHERE id = ? AND deleted IS NULL', [user.admin, user.id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    router.route('/:id/password/reset')
        .put(function(req, res, next) {
            if(!req.user.admin) return next(new UserNotAdministratorError);

            let id = parseInt(req.params.id);

            query('UPDATE user SET password = NULL WHERE id = ?', [id], function(err) {
                if(err) return next(err);

                res.status(204).send();
            });
        });

    // Relations

    users.relation(router, 'assets', 'asset');
    users.relation(router, 'assettypes', 'assettype');
    users.relation(router, 'attributes', 'attribute');
    users.relation(router, 'augmentations', 'augmentation');
    users.relation(router, 'backgrounds', 'background');
    users.relation(router, 'bionics', 'bionic');
    users.relation(router, 'bodyparts', 'bodypart');
    users.relation(router, 'corporations', 'corporation');
    users.relation(router, 'countries', 'country');
    users.relation(router, 'creatures', 'creature');
    users.relation(router, 'currencies', 'currency');
    users.relation(router, 'primals', 'primal');
    users.relation(router, 'expertises', 'expertise');
    users.relation(router, 'focuses', 'focus');
    users.relation(router, 'forms', 'form');
    users.relation(router, 'gifts', 'gift');
    users.relation(router, 'identities', 'identity');
    users.relation(router, 'imperfections', 'imperfection');
    users.relation(router, 'languages', 'language');
    users.relation(router, 'locations', 'location');
    users.relation(router, 'manifestations', 'manifestation');
    users.relation(router, 'milestones', 'milestone');
    users.relation(router, 'natures', 'nature');
    users.relation(router, 'armour', 'armour');
    users.relation(router, 'skills', 'skill');
    users.relation(router, 'software', 'software');
    users.relation(router, 'species', 'species');
    users.relation(router, 'spells', 'spell');
    users.relation(router, 'tactics', 'tactic');
    users.relation(router, 'wealth', 'wealth');
    users.relation(router, 'weaponmods', 'weaponmod');
    users.relation(router, 'weapons', 'weapon');
    users.relation(router, 'weapontypes', 'weapontype');
    users.relation(router, 'worlds', 'world');
};