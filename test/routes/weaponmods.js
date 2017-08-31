var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('../app'),
    verifier = require('../verifier'),
    hasher = require('../../lib/hasher');

describe('/weaponmods', function() {

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

        assert.isString(item.short);
        assert.isNumber(item.price);
        assert.isNumber(item.damage_dice);
        assert.isNumber(item.damage_bonus);
        assert.isNumber(item.critical_dice);
        assert.isNumber(item.critical_bonus);
        assert.isNumber(item.hand);
        assert.isNumber(item.initiative);
        assert.isNumber(item.hit);
        assert.isNumber(item.distance);
    }


    describe('POST', function() {

        it('/ should create a new weapon mod', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                short: hasher(2),
                price: 1,
                damage_dice: 2,
                damage_bonus: 3,
                critical_dice: 4,
                critical_bonus: 5,
                hand: -1,
                initiative: 6,
                hit: 7,
                distance: 50
            };

            app.post('/weaponmods', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:weaponId/clone should create a copy of the weapon mod', function(done) {
            app.post('/weaponmods/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:weaponModId/comments should create a new comment for the asset', function(done) {
            app.post('/weaponmods/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:weaponModId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/weaponmods/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:weaponModId/canon should update the weapon mod canon field', function(done) {
            app.put('/weaponmods/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of weapon mods', function(done) {
            app.get('/weaponmods')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:weaponModId should return one weapon mod', function(done) {
            app.get('/weaponmods/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:weaponModId/ownership should return ownership status of the weapon mod if user is logged in', function(done) {
            app.get('/weaponmods/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:weaponModId/comments should get all available comments for the asset', function(done) {
            app.get('/weaponmods/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

    xdescribe('DELETE', function() {

        it('/:weaponModId should update the weapon deleted field', function(done) {
            app.delete('/weaponmods/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});