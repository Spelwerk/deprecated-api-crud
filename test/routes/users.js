var async = require('async'),
    _ = require('underscore'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/users', function() {
    var id,
        token,
        email = hasher(20) + '@fakemail.com',
        password = hasher(20);

    function verifyGET(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        _.each(body.results, function(user) {
            assert.isNumber(user.id);

            assert.isString(user.displayname);
            assert.isString(user.email);

            assert.isBoolean(user.verify);
            assert.isBoolean(user.admin);

            if(user.firstname) assert.isString(user.firstname);
            if(user.surname) assert.isString(user.surname);

            assert.isString(user.created);
            if(user.updated) assert.isString(user.updated);
            if(user.deleted) assert.isString(user.deleted);
        });

        assert.isObject(body.fields);
    }

    it('POST / should create a new user', function(done) {
        this.timeout = 6000;

        var payload = {
            email: email,
            password: password
        };

        app.post('/users', payload)
            .expect(201)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.id);
                assert.isString(res.body.token);

                id = res.body.id;
                token = res.body.token;

                done();
            });
    });

    it('GET /info should return information about current user', function(done) {
        app.get('/users/info', token)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isObject(res.body.user);
                assert.isNumber(res.body.user.id);
                assert.isString(res.body.user.email);
                assert.isBoolean(res.body.user.verify);
                assert.isBoolean(res.body.user.admin);

                done();
            });
    });

    it('GET /tokens should return a list of all current tokens for the user', function(done) {
        app.get('/users/tokens', token)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isArray(res.body.results);

                _.each(res.body.results, function(item) {
                    assert.isNumber(item.id);
                    assert.isNumber(item.user_id);
                    assert.isString(item.token);
                    assert.isString(item.os);
                    assert.isString(item.browser);
                    assert.isString(item.ip);
                    assert.isString(item.created);
                });

                done();
            });

    });

    it('PUT /:userId should change the user information', function(done) {
        var payload = {
            displayname: hasher(20),
            firstname: hasher(20),
            surname: hasher(20)
        };

        app.put('/users/' + id, payload, token)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isNumber(res.body.changed);

                done();
            });
    });

    it('GET / should return a list of users', function(done) {
        app.get('/users')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isTrue(res.body.success);
                assert.isString(res.body.message);

                verifyGET(res.body);

                done();
            });
    });

    it('GET /:userId should return information about the user', function(done) {
        app.get('/users/' + id)
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isTrue(res.body.success);
                assert.isString(res.body.message);

                verifyGET(res.body);

                done();
            });
    });

    describe('/login', function() {

        it('POST /login/password should return a token', function(done) {
            var payload = {
                email: email,
                password: password
            };

            app.post('/users/login/password', payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);
                    assert.isString(res.body.token);

                    token = res.body.token;

                    done();
                });
        });

        it('POST /login/email should return a success message', function(done) {
            app.post('/users/login/email', {email: email})
                .expect(200)
                .end(done);
        });

    });

    describe('/verify', function() {

        it('POST /verify/email should return a success message', function(done) {
            app.post('/users/verify/email', {email: email})
                .expect(200)
                .end(done);
        });

    });

    describe('/email', function() {

        it('POST /email/email should return a success message', function(done) {
            app.post('/users/email/email', {email: email})
                .expect(200)
                .end(done);
        });

    });

    describe('/password', function() {

        it('POST /password/email should return a success message', function(done) {
            app.post('/users/password/email', {email: email})
                .expect(200)
                .end(done);
        });

    });

    describe('ADMIN', function() {

        before(function(done) {
            app.login(done);
        });

        it('PUT /:userId/admin should make the user administrator', function(done) {
            app.put('/users/' + id + '/admin', {admin: 1})
                .expect(200)
                .end(done);
        });

    });

    describe('END', function() {

        it('DELETE /:userId should delete the user', function(done) {
            app.delete('/users/' + id, token)
                .expect(200)
                .end(done);
        });

    })

});