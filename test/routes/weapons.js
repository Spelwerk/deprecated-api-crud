var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/weapons', function() {

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
        assert.isBoolean(item.canon);
        assert.isNumber(item.popularity);

        assert.isString(item.name);
        if(item.description) assert.isString(item.description);

        assert.isBoolean(item.species);
        assert.isBoolean(item.augmentation);
        assert.isNumber(item.damage_bonus);
        assert.isNumber(item.price);
        assert.isBoolean(item.legal);
        assert.isNumber(item.weapontype_id);

        assert.isNumber(item.damage_dice);
        assert.isNumber(item.critical_dice);
        assert.isNumber(item.hand);
        assert.isNumber(item.initiative);
        assert.isNumber(item.hit);
        assert.isNumber(item.distance);
        assert.isNumber(item.weapongroup_id);

        assert.isBoolean(item.special);
        assert.isNumber(item.skill_id);
        assert.isNumber(item.expertise_id);
        assert.isNumber(item.damage_id);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }

    describe('/', function() {

        it('POST / should create a new weapon', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                species: 1,
                augmentation: 1,
                damage_bonus: 10,
                price: 10,
                legal: true,
                weapontype_id: 1
            };

            app.post('/weapons', payload)
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

        it('GET / should return a list of weapons', function(done) {
            app.get('/weapons')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /augmentation should return a list of weapons', function(done) {
            app.get('/weapons/augmentation')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /species should return a list of weapons', function(done) {
            app.get('/weapons/species')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /type/:typeId should return a list of weapons', function(done) {
            app.get('/weapons/type/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

    });

    describe('/:weaponId', function() {

        it('GET /:weaponId should return a list with one weapon', function(done) {
            app.get('/weapons/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('GET /:weaponId/ownership should return ownership status of the weapon if user is logged in', function(done) {
            app.get('/weapons/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('PUT /:weaponId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/weapons/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('PUT /:weaponId/canon should update the weapon canon field', function(done) {
            app.put('/weapons/' + temporaryId + '/canon')
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

    describe('/:weaponId/comments', function() {

        it('POST /:weaponId/comments should create a new comment for the weapon', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/weapons/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('GET /:weaponId/comments should get all available comments for the weapon', function(done) {
            app.get('/weapons/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    _.each(res.body.results, function(comment) {
                        assert.isNumber(comment.id);
                        assert.isString(comment.content);

                        assert.isNumber(comment.user_id);
                        assert.isString(comment.displayname);

                        assert.isString(comment.created);
                        if(comment.updated) assert.isString(comment.updated);
                        assert.isNull(comment.deleted);
                    });

                    done();
                })
        });

    });

    describe('END', function() {

        it('POST /:weaponId/clone should create a copy of the weapon', function(done) {
            app.post('/weapons/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('DELETE /:weaponId should update the weapon deleted field', function(done) {
            app.delete('/weapons/' + temporaryId)
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