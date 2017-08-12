var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/assetgroups', function() {

    before(function(done) {
        app.login(done);
    });

    var temporaryId;

    function verifyGET(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        if(body.length > 0) {
            _.each(body.results, function(result) {
                assert.isBoolean(result.canon);
                assert.isNumber(result.popularity);

                assert.isString(result.name);
                assert.isBoolean(result.equippable);

                assert.isString(result.created);
                if(result.updated) assert.isString(result.updated);
                if(result.deleted) assert.isString(result.deleted);
            });
        }

        assert.isObject(body.fields);
    }

    describe('SETUP', function() {

        it('POST / should create a new asset group', function(done) {
            var payload = {
                name: hasher(20)
            };

            app.post('/assetgroups', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('GET / should return a list of assetgroups', function(done) {
            app.get('/assetgroups')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyGET(res.body);

                    done();
                });
        });

    });

    describe('/:assetGroupId', function() {

        it('GET /:assetGroupId should return a list with one asset group', function(done) {
            app.get('/assetgroups/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyGET(res.body);

                    done();
                })
        });

        it('GET /:assetGroupId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/assetgroups/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('PUT /:assetGroupId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20)
            };

            app.put('/assetgroups/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('PUT /:assetGroupId/canon should update the asset canon field', function(done) {
            app.put('/assetgroups/' + temporaryId + '/canon')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('END', function() {

        it('DELETE /:assetGroupId should update the asset deleted field', function(done) {
            app.delete('/assetgroups/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.notEqual(res.body.affected, 0);

                    done();
                })
        });

    });

});