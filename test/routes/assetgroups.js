var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    verifier = require('./../verifier'),
    hasher = require('./../../lib/hasher');

describe('/assetgroups', function() {

    var temporaryId;

    before(function(done) {
        app.login(done);
    });

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
        verifier.generic(item);
    }


    describe('POST', function() {

        it('/ should create a new asset group', function(done) {
            var payload = {name: hasher(20)};

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
            var payload = {name: hasher(20)};

            app.put('/assetgroups/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:assetGroupId/canon should update the asset group canon field', function(done) {
            app.put('/assetgroups/' + temporaryId + '/canon')
                .expect(204)
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

        it('/:assetGroupId/ownership should return ownership status', function(done) {
            app.get('/assetgroups/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

    });

    xdescribe('DELETE', function() {

        it('/:assetGroupId should update the asset group deleted field', function(done) {
            app.delete('/assetgroups/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});