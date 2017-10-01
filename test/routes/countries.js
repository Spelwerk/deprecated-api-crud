var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('../app'),
    verifier = require('./../verifier'),
    hasher = require('../../lib/hasher');

describe('/countries', function() {

    var baseRoute = '/countries';

    var temporaryId;

    before(function(done) {
        app.login(done);
    });

    var languageId;
    before(function(done) {
        app.get('/languages')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                languageId = res.body.results[0].id;

                done();
            });
    });

    var firstnameGroupId;
    before(function(done) {
        app.get('/firstnamegroups')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                firstnameGroupId = res.body.results[0].id;

                done();
            });
    });

    var nicknameGroupId;
    before(function(done) {
        app.get('/nicknamegroups')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                nicknameGroupId = res.body.results[0].id;

                done();
            });
    });

    var lastnameGroupId;
    before(function(done) {
        app.get('/lastnamegroups')
            .expect(200)
            .end(function(err, res) {
                if(err) return done(err);

                lastnameGroupId = res.body.results[0].id;

                done();
            });
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

        if(item.language_id) assert.isNumber(item.language_id);
        if(item.firstnamegroup_id) assert.isNumber(item.firstnamegroup_id);
        if(item.nicknamegroup_id) assert.isNumber(item.nicknamegroup_id);
        if(item.lastnamegroup_id) assert.isNumber(item.lastnamegroup_id);
    }


    describe('POST', function() {

        it('/ should create a new item', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20),
                language_id: languageId,
                firstnamegroup_id: firstnameGroupId,
                nicknamegroup_id: nicknameGroupId,
                lastnamegroup_id: lastnameGroupId
            };

            app.post(baseRoute, payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:id/comments should create a new comment', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/comments', { comment: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:id/labels should create a label', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/labels', { label: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                })
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            var payload = {
                name: hasher(20),
                description: hasher(20)
            };

            app.put(baseRoute + '/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:id/canon/:canon should update the canon status', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/canon/1')
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/deleted should return a list of deleted items', function(done) {
            app.get(baseRoute + '/deleted')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:id should return one item', function(done) {
            app.get(baseRoute + '/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:id/ownership should return ownership status', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifier.comments(res.body.results);

                    done();
                })
        });

    });

});