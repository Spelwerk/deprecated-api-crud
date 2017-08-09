var async = require('async'),
    _ = require('underscore'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/users', function() {

    it('should return a list of users', function(done) {
        app.get('/assets')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                assert.isTrue(res.body.success);
                assert.isString(res.body.message);

                assert.isArray(res.body.data);
                expect(res.body.data, 'Data array is empty').to.have.length.of.at.least(1);

                _.each(res.body.data, function(user) {
                    assert.isNumber(user.id);

                    assert.isString(user.displayname);
                    assert.isString(user.email);

                    assert.isBoolean(user.verify);
                    assert.isBoolean(user.admin);

                    assert.isString(user.firstname);
                    assert.isString(user.surname);

                    assert.isString(user.created);
                });

                done();
            });
    });

});