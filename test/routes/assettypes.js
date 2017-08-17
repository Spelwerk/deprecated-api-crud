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

    function verifyList(body) {
        assert.isNumber(body.length);

        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        if(body.length > 0) {
            _.each(body.results, function(item) {
                verifyItem(item);
            });
        }

        assert.isObject(body.fields);
    }

    function verifyItem(item) {
        assert.isNumber(item.id);
        assert.isBoolean(item.canon);
        assert.isNumber(item.popularity);

        assert.isString(item.name);
        assert.isNumber(item.assetgroup_id);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new asset type', function(done) {
            var payload = {
                name: hasher(20),
                assetgroup_id: 1,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/assettypes', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:assetTypeId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20)
            };

            app.put('/assettypes/' + temporaryId, payload)
                .expect(200)
                .end(done);
        });

        it('/:assetTypeId/canon should update the asset canon field', function(done) {
            app.put('/assettypes/' + temporaryId + '/canon')
                .expect(200)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of assettypes', function(done) {
            app.get('/assettypes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/group/:assetGroupId should return a list of assettypes', function(done) {
            app.get('/assettypes/group/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:assetTypeId should return one asset type', function(done) {
            app.get('/assettypes/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:assetTypeId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/assettypes/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('/:assetTypeId should update the asset deleted field', function(done) {
            app.delete('/assettypes/' + temporaryId)
                .expect(200)
                .end(done);
        });

    });

});