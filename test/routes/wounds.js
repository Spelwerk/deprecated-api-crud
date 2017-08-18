var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/wounds', function() {

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

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new asset', function(done) {
            var payload = {name: hasher(20)};

            app.post('/wounds', payload)
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

        it('/:woundId should update the item with new values', function(done) {
            var payload = {name: hasher(20)};

            app.put('/wounds/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:woundId/canon should update the asset canon field', function(done) {
            app.put('/wounds/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of wounds', function(done) {
            app.get('/wounds')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:woundId should return one asset', function(done) {
            app.get('/wounds/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:woundId/ownership should return ownership status of the asset if user is logged in', function(done) {
            app.get('/wounds/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('/:woundId should update the asset deleted field', function(done) {
            app.delete('/wounds/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});