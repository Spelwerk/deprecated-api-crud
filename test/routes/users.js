var async = require('async'),
    _ = require('underscore'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/users', function() {

    var baseRoute = '/users',
        id,
        token,
        email = hasher(20) + '@fakemail.com',
        password = hasher(20);

    function verifyList(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        _.each(body.results, function(item) {
            verifyItem(item);
        });

        assert.isObject(body.fields);
    }

    function verifyItem(item) {
        assert.isNumber(item.id);

        assert.isString(item.displayname);
        assert.isString(item.email);

        assert.isBoolean(item.verify);
        assert.isBoolean(item.admin);

        if(item.firstname) assert.isString(item.firstname);
        if(item.surname) assert.isString(item.surname);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            this.timeout = 6000;

            var payload = {
                email: email,
                password: password
            };

            app.post(baseRoute, payload)
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

    });

    xdescribe('LOGIN', function() {

        it('/login/password should return a token', function(done) {
            var payload = {
                email: email,
                password: password
            };

            app.post(baseRoute + '/login/password', payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);
                    assert.isString(res.body.token);

                    token = res.body.token;

                    done();
                });
        });

        it('/login/email should return a success message', function(done) {
            app.post('/users/login/email', {email: email})
                .expect(204)
                .end(done);
        });

        it('/verify/email should return a success message', function(done) {
            app.post('/users/verify/email', {email: email})
                .expect(204)
                .end(done);
        });

        it('/email/email should return a success message', function(done) {
            app.post('/users/email/email', {email: email})
                .expect(204)
                .end(done);
        });

        it('/password/email should return a success message', function(done) {
            app.post('/users/password/email', {email: email})
                .expect(204)
                .end(done);
        });

    });

    xdescribe('ADMIN', function() {

        before(function(done) {
            app.login(done);
        });

        it('/:userId/admin should make the user administrator', function(done) {
            app.put('/users/' + id + '/admin', {admin: 1})
                .expect(204)
                .end(done);
        });

    });

    xdescribe('PUT', function() {

        it('/:userId should change the user information', function(done) {
            var payload = {
                displayname: hasher(20),
                firstname: hasher(20),
                surname: hasher(20)
            };

            app.put('/users/' + id, payload, token)
                .expect(204)
                .end(done);
        });

    });

    xdescribe('GET', function() {

        it('/info should return information about current user', function(done) {
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

        it('/tokens should return a list', function(done) {
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

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:userId should return information about the user', function(done) {
            app.get('/users/' + id)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                });
        });

    });

    xdescribe('DELETE', function() {

        it('/:userId should delete the user', function(done) {
            app.delete('/users/' + id, token)
                .expect(204)
                .end(done);
        });

    });

});