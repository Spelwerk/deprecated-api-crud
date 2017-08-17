var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/weapongroups', function() {

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
        if(item.description) assert.isString(item.description);

        assert.isBoolean(item.special);
        assert.isNumber(item.skill_id);
        assert.isNumber(item.expertise_id);
        assert.isNumber(item.damage_id);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new weapon group', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                special: true,
                skill_id: 1,
                damage_id: 1,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/weapongroups', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:weaponGroupId/comments should create a new comment for the asset', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/weapongroups/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:weaponGroupId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/weapongroups/' + temporaryId, payload)
                .expect(200)
                .end(done);
        });

        it('/:weaponGroupId/canon should update the weapon group canon field', function(done) {
            app.put('/weapongroups/' + temporaryId + '/canon')
                .expect(200)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of weapon groups', function(done) {
            app.get('/weapongroups')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/special should return a list of weapon groups', function(done) {
            app.get('/weapongroups/special')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/damage/:damageId should return a list of weapon groups', function(done) {
            app.get('/weapongroups/damage/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/skill/:skillId should return a list of weapon groups', function(done) {
            app.get('/weapongroups/skill/1')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:weaponGroupId should return one weapon group', function(done) {
            app.get('/weapongroups/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:weaponGroupId/ownership should return ownership status of the weapon group if user is logged in', function(done) {
            app.get('/weapongroups/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:weaponGroupId/comments should get all available comments for the asset', function(done) {
            app.get('/weapongroups/' + temporaryId + '/comments')
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

    describe('DELETE', function() {

        it('/:weaponGroupId should update the weapon deleted field', function(done) {
            app.delete('/weapongroups/' + temporaryId)
                .expect(200)
                .end(done);
        });

    });

});