var async = require('async'),
    _ = require('underscore'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/users', function() {

    it('GET / should return a list of users', function(done) {
        app.get('/users')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isTrue(res.body.success);
                assert.isString(res.body.message);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);
                assert.lengthOf(res.body.results, res.body.length);

                _.each(res.body.results, function(user) {
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

                done();
            });
    });

    it('GET /info should return information about current user');

    it('GET /tokens should return a list of all current tokens for the user');

    describe('/login', function() {

        it('POST /login/password should return a token');

        it('POST /login/email should return a success message');

    });

    describe('/verify', function() {

        it('POST /verify/email should return a success message');

    });

    describe('/email', function() {

        it('POST /email/email should return a success message');

    });

    describe('/password', function() {

        it('POST /password/email should return a success message');

    });

    describe('/:userId', function() {

        it('GET /:userId should return information about the user');

        it('PUT /:userId should change the user information');

        it('DELETE /:userId should delete the user');

        it('PUT /:userId/admin should make the user administrator');

    });

});