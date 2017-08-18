var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/species', function() {

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
        assert.isBoolean(item.playable);
        assert.isNumber(item.max_age);
        assert.isNumber(item.multiply_skill);
        assert.isNumber(item.multiply_expertise);
        if(item.icon) assert.equal(validator.isURL(item.icon), true);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        if(item.deleted) assert.isString(item.deleted);
    }


    describe('POST', function() {

        it('/ should create a new species', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                playable: true,
                max_age: 10,
                multiply_skill: 10,
                multiply_expertise: 10,
                icon: 'http://fakeicon.com/' + hasher(20) + '.png'
            };

            app.post('/species', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:speciesId/clone should create a copy of the species', function(done) {
            app.post('/species/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:speciesId/comments should create a new comment for the species', function(done) {
            var payload = {
                content: hasher(20)
            };

            app.post('/species/' + temporaryId + '/comments', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:speciesId/attributes should add an attribute to the species', function(done) {
            var payload = {
                insert_id: 1,
                value: 10
            };

            app.post('/species/' + temporaryId + '/attributes', payload)
                .expect(201)
                .end(done);
        });

        it('/:speciesId/weapons should add an weapon to the species', function(done) {
            var payload = {
                insert_id: 1
            };

            app.post('/species/' + temporaryId + '/weapons', payload)
                .expect(201)
                .end(done);
        });

    });

    describe('PUT', function() {

        it('/:speciesId should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put('/species/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:speciesId/canon should update the species canon field', function(done) {
            app.put('/species/' + temporaryId + '/canon')
                .expect(204)
                .end(done);
        });

        it('/:speciesId/attributes should change the attribute value for the species', function(done) {
            var payload = {value: 8};

            app.put('/species/' + temporaryId + '/attributes/1', payload)
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of species', function(done) {
            app.get('/species')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/creature should return a list of species', function(done) {
            app.get('/species/creature')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/playable should return a list of species', function(done) {
            app.get('/species/playable')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:speciesId should return one species', function(done) {
            app.get('/species/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:speciesId/ownership should return ownership status of the species if user is logged in', function(done) {
            app.get('/species/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:speciesId/comments should get all available comments for the species', function(done) {
            app.get('/species/' + temporaryId + '/comments')
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

        it('/:speciesId/attributes should return a list of attributes', function(done) {
            app.get('/species/' + temporaryId + '/attributes')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.species_id);
                        assert.isNumber(item.attribute_id);
                        assert.isNumber(item.value);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isString(item.name);
                        if(item.description) assert.isString(item.description);
                        assert.isNumber(item.attributetype_id);
                        if(item.icon) assert.equal(validator.isURL(item.icon), true);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

        it('/:speciesId/weapons should return a list of weapons', function(done) {
            app.get('/species/' + temporaryId + '/weapons')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.length);
                    assert.isArray(res.body.results);

                    _.each(res.body.results, function(item) {
                        assert.isNumber(item.species_id);
                        assert.isNumber(item.weapon_id);

                        assert.isNumber(item.id);
                        assert.isBoolean(item.canon);
                        assert.isNumber(item.popularity);
                        assert.isString(item.name);

                        assert.isString(item.created);
                        if(item.deleted) assert.isString(item.deleted);
                        if(item.updated) assert.isString(item.updated);
                    });

                    done();
                });
        });

    });

    describe('DELETE', function() {

        it('/:speciesId/attributes should remove the attribute from the species', function(done) {
            app.delete('/species/' + temporaryId + '/attributes/1')
                .expect(204)
                .end(done);
        });

        it('/:speciesId/weapons should remove the weapon from the species', function(done) {
            app.delete('/species/' + temporaryId + '/weapons/1')
                .expect(204)
                .end(done);
        });

        it('/:speciesId should update the species deleted field', function(done) {
            app.delete('/species/' + temporaryId)
                .expect(204)
                .end(done);
        });

    });

});