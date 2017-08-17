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
        assert.isBoolean(item.equippable);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new asset group', function(done) {
            var payload = {
                name: hasher(20)
            };

            app.post('/assetgroups', payload)
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

        it('/:assetGroupId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20)
            };

            app.put('/assetgroups/' + temporaryId, payload)
                .expect(200)
                .end(done);
        });

        it('/:assetGroupId/canon should update the asset group canon field', function(done) {
            app.put('/assetgroups/' + temporaryId + '/canon')
                .expect(200)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of asset groups', function(done) {
            app.get('/assetgroups')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:assetGroupId should return one asset group', function(done) {
            app.get('/assetgroups/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:assetGroupId/ownership should return ownership status of the asset group if user is logged in', function(done) {
            app.get('/assetgroups/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('/:assetGroupId should update the asset group deleted field', function(done) {
            app.delete('/assetgroups/' + temporaryId)
                .expect(200)
                .end(done);
        });

    });

});