var async = require('async'),
    _ = require('underscore'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/users', function() {

    describe('/', function() {

        it('GET should return a list of users', function(done) {
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

    });

});