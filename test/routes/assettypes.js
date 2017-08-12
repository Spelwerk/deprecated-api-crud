var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/assettypes', function() {

    before(function(done) {
        app.login(done);
    });

    var temporaryId;

    function verifyGET(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        if(body.length > 0) {
            _.each(body.results, function(item) {
                assert.isBoolean(item.canon);
                assert.isNumber(item.popularity);

                assert.isString(item.name);
                assert.isNumber(item.assetgroup_id);
                if(item.icon) assert.equal(validator.isURL(item.icon), true);

                assert.isString(item.created);
                if(item.updated) assert.isString(item.updated);
                if(item.deleted) assert.isString(item.deleted);
            });
        }

        assert.isObject(body.fields);
    }

    describe('SETUP', function() {

        it('POST / should create a new asset type', function(done) {
            var payload = {
                name: hasher(20),
                assetgroup_id: 1,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/assettypes', payload)
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

        it('GET / should return a list of assettypes', function(done) {
            app.get('/assettypes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyGET(res.body);

                    done();
                });
        });

    });

    describe('/assetTypeId', function() {

        it('GET /:assetTypeId should return a list with one asset type', function(done) {
            app.get('/assettypes/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyGET(res.body);

                    done();
                })
        });

        it('GET /:assetTypeId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/assettypes/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('PUT /:assetTypeId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                assetgroup_id: 1,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.put('/assettypes/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('PUT /:assetTypeId/canon should update the asset canon field', function(done) {
            app.put('/assettypes/' + temporaryId + '/canon')
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

        it('DELETE /:assetTypeId should update the asset deleted field', function(done) {
            app.delete('/assettypes/' + temporaryId)
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