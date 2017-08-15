var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/weapontypes', function() {

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

        it('POST / should create a new weapon type', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                damage_dice: 10,
                critical_dice: 10,
                hand: 1,
                initiative: 10,
                hit: 10,
                distance: 10,
                weapongroup_id: 1
            };

            app.post('/weapontypes', payload)
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

        it('GET / should return a list of weapon types', function(done) {
            app.get('/weapontypes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /special should return a list of weapon types', function(done) {
            app.get('/weapontypes/special')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('GET /group/:groupId should return a list of weapon types', function(done) {
            app.get('/weapontypes/group/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

    });

    describe('/:weaponGroupId', function() {

        it('GET /:weaponGroupId should return a list with one weapon type', function(done) {
            app.get('/weapontypes/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('GET /:weaponGroupId/ownership should return ownership status of the weapon type if user is logged in', function(done) {
            app.get('/weapontypes/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('PUT /:weaponGroupId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/weapontypes/' + temporaryId, payload)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.changed);
                    assert.notEqual(res.body.changed, 0);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

        it('PUT /:weaponGroupId/canon should update the weapon type canon field', function(done) {
            app.put('/weapontypes/' + temporaryId + '/canon')
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

    describe('/:weaponGroupId/comments', function() {

        it('POST /:weaponGroupId/comments should create a new comment for the asset', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/weapontypes/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.affected);
                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('GET /:weaponGroupId/comments should get all available comments for the asset', function(done) {
            app.get('/weapontypes/' + temporaryId + '/comments')
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

        it('DELETE /:weaponGroupId should update the weapon deleted field', function(done) {
            app.delete('/weapontypes/' + temporaryId)
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