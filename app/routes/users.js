'use strict';

const UserNotLoggedInError = require('../../lib/errors/user-not-logged-in-error');

const sql = require('../../lib/database/sql');
const basics = require('../../lib/routes/generic/generic');
const users = require('../../lib/users/users');
const email = require('../../lib/users/email');
const login = require('../../lib/users/login');
const verify = require('../../lib/users/verify');
const password = require('../../lib/users/password');
const relations = require('../../lib/users/relations');

module.exports = function(router) {
    let query = 'SELECT ' +
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
        .get(async (req, res, next) => {
            try {
                let call = query + ' WHERE deleted is NULL';

                await basics.select(req, res, next, call);
            } catch(e) { return next(e); }
        })
        .post(async (req, res, next) => {
            try {
                let result = await users.insert(req);

                res.status(201).send({id: result.id, token: result.token});
            } catch(e) { return next(e); }
        });

    // List administrators

    router.route('/administrators')
        .get(async (req, res, next) => {
            try {
                let call = query + ' WHERE admin = 1 AND deleted is NULL';

                await basics.select(req, res, next, call);
            } catch(e) { return next(e); }
        });

    // Verifying that a user exists

    router.route('/exists/email/:email')
        .get(async (req, res, next) => {
            try {
                let email = req.params.email.toString().toLowerCase();

                let [rows] = await sql('SELECT id FROM user WHERE LOWER(email) = ?', [email]);
                let exists = rows.length > 0;

                res.status(200).send({exists: exists});
            } catch(e) { return next(e); }
        });

    router.route('/exists/displayname/:name')
        .get(async (req, res, next) => {
            try {
                let name = req.params.name.toString().toLowerCase();

                let [rows] = await sql('SELECT id FROM user WHERE LOWER(displayname) = ?', [name]);
                let exists = rows.length > 0;

                res.status(200).send({exists: exists});
            } catch(e) { return next(e); }
        });

    // Information about current logged in user

    router.route('/info')
        .get(async (req, res, next) => {
            try {
                if (!req.user.id) return next(new UserNotLoggedInError);

                res.status(200).send({
                    id: req.user.id,
                    verified: req.user.verified,
                    admin: req.user.admin
                });
            } catch(e) { return next(e); }
        });

    // Tokens belonging to current logged in user

    router.route('/tokens')
        .get(async (req, res, next) => {
            try {
                if (!req.user.id) return next(new UserNotLoggedInError);

                let [rows, fields] = await sql('SELECT * FROM user_token WHERE user_id = ?', [req.user.id]);

                res.status(200).send({results: rows, fields: fields});
            } catch(e) { return next(e); }
        });

    router.route('/tokens/:id')
        .get(async (req, res, next) => {
            try {
                if (!req.user.id) return next(new UserNotLoggedInError);

                let [rows, fields] = await sql('SELECT * FROM user_token WHERE user_id = ? AND id = ?', [req.user.id, req.params.id]);

                res.status(200).send({result: rows[0], fields: fields});
            } catch(e) { return next(e); }
        })
        .put(async (req, res, next) => {
            try {
                if (!req.user.id) return next(new UserNotLoggedInError);

                await sql('UPDATE user_token SET name = ? WHERE user_id = ? AND id = ?', [req.body.name, req.user.id, req.params.id]);

                res.status(204).send();
            } catch(e) { return next(e); }
        })
        .delete(async (req, res, next) => {
            try {
                if (!req.user.id) return next(new UserNotLoggedInError);

                await sql('DELETE FROM user_token WHERE user_id = ? AND id = ?', [req.user.id, req.params.id]);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    // Login

    router.route('/login/password')
        .post(async (req, res, next) => {
            try {
                let result = await login.password(req);

                res.status(200).send(result);
            } catch(e) { return next(e); }
        });

    router.route('/login/email')
        .post(async (req, res, next) => {
            try {
                await login.email(req);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/login/secret')
        .post(async (req, res, next) => {
            try {
                let result = await login.validate(req);

                res.status(200).send(result);
            } catch(e) { return next(e); }
        });

    // Verifying

    router.route('/verify/email')
        .post(async (req, res, next) => {
            try {
                await verify.email(req);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/verify/secret')
        .post(async (req, res, next) => {
            try {
                await verify.validate(req);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    // Email

    router.route('/email/email')
        .post(async (req, res, next) => {
            try {
                await email.email(req);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/email/secret')
        .post(async (req, res, next) => {
            try {
                let result = await email.validate(req);

                res.status(200).send(result);
            } catch(e) { return next(e); }
        });

    // Password

    router.route('/password/email')
        .post(async (req, res, next) => {
            try {
                await password.email(req);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/password/secret')
        .post(async (req, res, next) => {
            try {
                await password.validate(req);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    // Specific User

    router.route('/:id')
        .get(async (req, res, next) => {
            let call = query + ' WHERE deleted IS NULL AND id = ?';

            await basics.select(req, res, next, call, [req.params.id], true);
        })
        .put(async (req, res, next) => {
            try {
                await users.update(req, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        })
        .delete(async (req, res, next) => {
            try {
                await users.remove(req, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/:id/admin')
        .put(async (req, res, next) => {
            try {
                await users.admin(req, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    router.route('/:id/password/remove')
        .put(async (req, res, next) => {
            try {
                await password.remove(req, req.params.id);

                res.status(204).send();
            } catch(e) { return next(e); }
        });

    // Relations

    relations(router, 'armour', 'armours');
    relations(router, 'asset', 'assets');
    relations(router, 'assettype', 'assettypes');
    relations(router, 'attribute', 'attributes');
    relations(router, 'augmentation', 'augmentations');
    relations(router, 'background', 'backgrounds');
    relations(router, 'bionic', 'bionics');
    relations(router, 'bodypart', 'bodyparts');
    relations(router, 'corporation', 'corporations');
    relations(router, 'country', 'countries');
    relations(router, 'creature', 'creatures');
    relations(router, 'currency', 'currencies');
    relations(router, 'epoch', 'epochs');
    relations(router, 'expertise', 'expertises');
    relations(router, 'focus', 'focuses');
    relations(router, 'form', 'forms');
    relations(router, 'gift', 'gifts');
    relations(router, 'identity', 'identities');
    relations(router, 'imperfection', 'imperfections');
    relations(router, 'language', 'languages');
    relations(router, 'location', 'locations');
    relations(router, 'manifestation', 'manifestations');
    relations(router, 'milestone', 'milestones');
    relations(router, 'nature', 'natures');
    relations(router, 'primal', 'primals');
    relations(router, 'shield', 'shields');
    relations(router, 'skill', 'skills');
    relations(router, 'software', 'software');
    relations(router, 'species', 'species');
    relations(router, 'spell', 'spells');
    relations(router, 'spelltype', 'spelltypes');
    relations(router, 'story', 'stories');
    relations(router, 'tactic', 'tactics');
    relations(router, 'wealth', 'wealth');
    relations(router, 'weapon', 'weapons');
    relations(router, 'weaponmod', 'weaponmods');
    relations(router, 'weapontype', 'weapontypes');
    relations(router, 'world', 'worlds');

    // Friends

    //todo friends(router);
};
