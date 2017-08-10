var async = require('async'),
    _ = require('underscore'),
    chai = require('chai');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/assets', function() {

    describe('/', function() {

        it('GET should return a list of assets', function(done) {
            app.get('/assets')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isTrue(res.body.success);
                    assert.isString(res.body.message);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);
                    assert.lengthOf(res.body.results, res.body.length);

                    assert.isObject(res.body.fields);

                    done();
                });
        });

        it('POST should create a new asset', function(done) {
            var payload = {
                "name": hasher(20),
                "description": hasher(20),
                "price": 10,
                "legal": 1
            };

            app.post('/assets', payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isTrue(res.body.success);
                    assert.isString(res.body.message);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);
                });
        });

        it('DELETE should update the asset deleted field');

    });

    describe('/:assetId', function() {

        describe('/canon', function() {

            it('PUT should update the asset canon field');

        });

        describe('/clone', function() {

            it('POST should create a new asset with the same content as original');

        });

        describe('/comment', function() {

            it('GET should return a list of comments for the asset');

            it('POST should create a comment for the asset');

        });

        describe('/ownership', function() {

            it('GET should return ownership status of the asset if user is logged in');

        });

        describe('/revive', function() {

            it('PUT should update the asset deleted field');

        });

    });

    describe('/:assetId/:relation', function() {

        describe('/attributes', function() {

            it('GET should return a list of attributes');

            it('POST should add an attribute to the asset');

            it('PUT should change the attribute value for the asset');

            it('DELETE should remove the attribute from the asset');

        });

    });

});