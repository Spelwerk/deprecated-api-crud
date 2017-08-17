var async = require('async'),
    _ = require('underscore'),
    chai = require('chai'),
    validator = require('validator');

var should = chai.should(),
    assert = chai.assert,
    expect = chai.expect;

var app = require('./../app'),
    hasher = require('./../../lib/hasher');

describe('/persons', function() {

    before(function(done) {
        app.login(done);
    });

    var temporaryId,
        diseaseId,
        sanityId,
        woundId;

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
    }


    describe('POST', function() {

        it('/ should create a new person', function(done) {
            var payload = {
                supernatural: 1,
                nickname: hasher(20),
                age: 50,
                occupation: hasher(20),
                species_id: 1,
                world_id: 1
            };

            app.post('/persons', payload)
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:personId/comments should create a new comment for the person', function(done) {
            app.post('/persons/' + temporaryId + '/comments', {content: hasher(20)})
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

        it('/:personId/assets should add an asset to the person', function(done) {
            app.post('/persons/' + temporaryId + '/assets', {insert_id: 1, value: 10})
                .expect(201)
                .end(done);
        });

        it('/:personId/attributes should add an attribute to the person', function(done) {
            app.post('/persons/' + temporaryId + '/attributes', {insert_id: 1, value: 10})
                .expect(201)
                .end(done);
        });

        it('/:personId/bionics should add a bionic to the person', function(done) {
            app.post('/persons/' + temporaryId + '/bionics', {insert_id: 1})
                .expect(201)
                .end(done);
        });

        it('/:personId/augmentations should add an augmentation to the person', function(done) {
            app.post('/persons/' + temporaryId + '/augmentations', {insert_id: 2, bionic_id: 1})
                .expect(201)
                .end(done);
        });

        it('/:personId/diseases should add a disease to the person', function(done) {
            app.post('/persons/' + temporaryId + '/diseases', {name: hasher(20), timestwo: 1})
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    diseaseId = res.body.id;

                    done();
                });
        });

        it('/:personId/protection should add a protection to the person', function(done) {
            app.post('/persons/' + temporaryId + '/protection', {insert_id: 1})
                .expect(201)
                .end(done);
        });

        it('/:personId/sanity should add a disease to the person', function(done) {
            app.post('/persons/' + temporaryId + '/sanity', {name: hasher(20), timestwo: 1})
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    sanityId = res.body.id;

                    done();
                });
        });

        it('/:personId/wounds should add a disease to the person', function(done) {
            app.post('/persons/' + temporaryId + '/wounds', {name: hasher(20), timestwo: 1})
                .expect(201)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isNumber(res.body.id);

                    woundId = res.body.id;

                    done();
                });
        });

    });

    describe('PUT', function() {

        it('/:personId should update the item with new values', function(done) {
            var payload = {
                nickname: hasher(20),
                point_expertise: 12,
                age: 120,
                gender: hasher(20)
            };

            app.put('/persons/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:personId/cheat should update the person to be a cheater', function(done) {
            app.put('/persons/' + temporaryId + '/cheat')
                .expect(204)
                .end(done);
        });

        it('/:personId/assets/:assetId should update the value of the asset', function(done) {
            app.put('/persons/' + temporaryId + '/assets/1', {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:personId/assets/:assetId/equip should update the equipped status of the asset', function(done) {
            app.put('/persons/' + temporaryId + '/assets/1/equip')
                .expect(204)
                .end(done);
        });

        it('/:personId/assets/:assetId/unequip should update the equipped status of the asset', function(done) {
            app.put('/persons/' + temporaryId + '/assets/1/unequip')
                .expect(204)
                .end(done);
        });

        it('/:personId/attributes/:attributeId should update the attribute value and add/subtract', function(done) {
            app.put('/persons/' + temporaryId + '/attributes/1', {value: 8})
                .expect(204)
                .end(done);
        });

        it('/:personId/augmentations/:augmentationId/bionic/:bionicId/equip should update the active status of the augmentation', function(done) {
            app.put('/persons/' + temporaryId + '/augmentations/2/bionic/1/activate')
                .expect(204)
                .end(done);
        });

        it('/:personId/augmentations/:augmentationId/bionic/:bionicId/unequip should update the active status of the augmentation', function(done) {
            app.put('/persons/' + temporaryId + '/augmentations/2/bionic/1/deactivate')
                .expect(204)
                .end(done);
        });

        it('/:personId/diseases/:diseaseId should update the heal value of the disease', function(done) {
            app.put('/persons/' + temporaryId + '/diseases/' + diseaseId, {heal: 1})
                .expect(204)
                .end(done);
        });

        it('/:personId/protection/:protectionId/equip should update the equipped status of the protection', function(done) {
            app.put('/persons/' + temporaryId + '/protection/1/equip')
                .expect(204)
                .end(done);
        });

        it('/:personId/protection/:protectionId/unequip should update the equipped status of the protection', function(done) {
            app.put('/persons/' + temporaryId + '/protection/1/unequip')
                .expect(204)
                .end(done);
        });

        it('/:personId/diseases/:diseaseId should update the heal value of the disease', function(done) {
            app.put('/persons/' + temporaryId + '/sanity/' + sanityId, {heal: 1})
                .expect(204)
                .end(done);
        });

        it('/:personId/wounds/:diseaseId should update the heal value of the disease', function(done) {
            app.put('/persons/' + temporaryId + '/wounds/' + woundId, {heal: 1})
                .expect(204)
                .end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list of persons', function(done) {
            app.get('/persons')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyList(res.body);

                    done();
                });
        });

        it('/:personId should return one person', function(done) {
            app.get('/persons/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:personId/ownership should return ownership status of the person if user is logged in', function(done) {
            app.get('/persons/' + temporaryId + '/ownership')
                .expect(200)
                .end(function(err, res) {
                    if(err) return done(err);

                    assert.isBoolean(res.body.ownership);

                    done();
                });
        });

        it('/:personId/comments should get all available comments for the person', function(done) {
            app.get('/persons/' + temporaryId + '/comments')
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

        xit('/:personId should update the person deleted field', function(done) {
            app.delete('/persons/' + temporaryId)
                .expect(200)
                .end(done);
        });

    });

});