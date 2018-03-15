const assert = require('chai').assert;
const _ = require('underscore');

const app = require('./../app');
const verifier = require('./../verifier');
const hasher = require('./../../lib/hasher');

describe('/creatures', function() {

    function verifyItem(item) {
        verifier.generic(item);
    }

    let baseRoute = '/creatures';
    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    let typeId;
    before(function(done) {
        app.get('/creaturetypes')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let length = res.body.length - 1;
                typeId = res.body.results[length].id;

                done();
            });
    });

    let speciesId;
    before(function(done) {
        app.get('/species')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let length = res.body.length - 1;
                speciesId = res.body.results[length].id;

                done();
            });
    });

    let epochId;
    before(function(done) {
        app.get('/epochs')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let rand = app.randomNumber(0, res.body.length - 1);
                epochId = res.body.results[rand].id;

                done();
            });
    });

    let corporationId;
    before(function(done) {
        app.get('/corporations')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let rand = app.randomNumber(0, res.body.length - 1);
                corporationId = res.body.results[rand].id;

                done();
            });
    });

    let countryId;
    before(function(done) {
        app.get('/countries')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let rand = app.randomNumber(0, res.body.length - 1);
                countryId = res.body.results[rand].id;

                done();
            });
    });

    let identityId;
    before(function(done) {
        app.get('/identities')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let rand = app.randomNumber(0, res.body.length - 1);
                identityId = res.body.results[rand].id;

                done();
            });
    });

    let natureId;
    before(function(done) {
        app.get('/natures')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let rand = app.randomNumber(0, res.body.length - 1);
                natureId = res.body.results[rand].id;

                done();
            });
    });

    let wealthId;
    before(function(done) {
        app.get('/wealth')
            .expect(200)
            .end(function(err, res) {
                if (err) return done(err);

                let rand = app.randomNumber(0, res.body.length - 1);
                wealthId = res.body.results[rand].id;

                done();
            });
    });

    describe('POST', function() {

        it('/ should create a new item', function(done) {
            let payload = {
                firstname: hasher(20),
                nickname: hasher(20),
                middlename: hasher(20),
                lastname: hasher(20),

                creaturetype_id: typeId,
                epoch_id: epochId,
                country_id: countryId,
                corporation_id: corporationId,

                identity_id: identityId,
                nature_id: natureId,
                species_id: speciesId,
                wealth_id: wealthId,

                appearance: hasher(20),
                age: app.randomNumber(15, 70),
                biography: hasher(20),
                description: hasher(40),
                drive: hasher(20),
                gender: hasher(20),
                occupation: hasher(20),
                personality: hasher(20),
                pride: hasher(20),
                problem: hasher(20),
                shame: hasher(20)
            };

            app.post(baseRoute, payload)
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
        });

        it('/:id/comments should create a new comment', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/comments', { comment: hasher(20) }).expect(204).end(done);
        });

        it('/:id/labels should create a label', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/labels', { label: hasher(20) }).expect(204).end(done);
        });

    });

    describe('PUT', function() {

        it('/:id should update the item with new values', function(done) {
            let payload = {
                firstname: hasher(20),
                nickname: hasher(20),
                middlename: hasher(20),
                lastname: hasher(20),

                appearance: hasher(20),
                age: app.randomNumber(20, 70),
                biography: hasher(20),
                description: hasher(40),
                drive: hasher(20),
                gender: hasher(20),
                occupation: hasher(20),
                personality: hasher(20),
                pride: hasher(20),
                problem: hasher(20),
                shame: hasher(20)
            };

            app.put(baseRoute + '/' + temporaryId, payload)
                .expect(204)
                .end(done);
        });

        it('/:id/canon/:canon should update the canon status', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/canon/1').expect(204).end(done);
        });

        it('/:id/permissions/favorite/1 should set it as favorite', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/permissions/favorite/1').expect(204).end(done);
        });

    });

    describe('GET', function() {

        it('/ should return a list', function(done) {
            app.get(baseRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/deleted should return a list of deleted items', function(done) {
            app.get(baseRoute + '/deleted')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/type/:typeId should return a list', function(done) {
            app.get('/assets/type/' + speciesId)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifier.lists(res.body, verifyItem);

                    done();
                });
        });

        it('/:id should return one item', function(done) {
            app.get(baseRoute + '/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

        it('/:id/permissions should return user permissions', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/permissions').expect(200).end(function(err, res) { verifier.ownership(err, res, done); });
        });

        it('/:id/comments should get all available comments', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/comments').expect(200).end(function(err, res) { verifier.comments(err, res, done); });
        });

    });

    describe('/armours', function() {
        let relationRoute = 'armours',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/assets', function() {
        let relationRoute = 'assets',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/attributes', function() {
        let relationRoute = 'attributes',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/bionics', function() {
        let relationRoute = 'bionics',
            bionicId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    bionicId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: bionicId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

        describe('/augmentations', function() {
            let augmentationId;

            before(function(done) {
                app.get('/bionics/' + bionicId + '/augmentations')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);

                        let length = res.body.length - 1;
                        augmentationId = res.body.results[length].id;

                        done();
                    });
            });

            it('POST /:id/augmentations should add an item to the creature', function(done) {
                app.post(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId + '/augmentations', {bionic_id: bionicId, insert_id: augmentationId}).expect(204).end(done);
            });

            it('GET /:id/augmentations should get a list of items', function(done) {
                app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + bionicId + '/augmentations').expect(200).end(function(err, res) { verifier.relations(err, res, done); });
            });

        });
    });

    describe('/backgrounds', function() {
        let relationRoute = 'backgrounds',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/currencies', function() {
        let relationRoute = 'currencies',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/expertises', function() {
        let relationRoute = 'expertises',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4, custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/forms', function() {
        let relationRoute = 'forms',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/gifts', function() {
        let relationRoute = 'gifts',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/imperfections', function() {
        let relationRoute = 'imperfections',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/languages', function() {
        let relationRoute = 'languages',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {fluent: 1}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/loyalties', function() {
        let relationRoute = 'loyalties',
            relationId,
            wealthId,
            speciesId,
            uniqueId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/wealth')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    wealthId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/species')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    speciesId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, wealth_id: wealthId, name: hasher(20), occupation: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(item) {
                    assert.isNumber(item.id);
                    assert.isNumber(item.loyalty_id);
                    assert.isNumber(item.wealth_id);
                    if (item.name) assert.isString(item.name);
                    assert.isString(item.occupation);
                });

                let length = res.body.length - 1;
                uniqueId = res.body.results[length].id;

                done();
            });
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId, {wealth_id: wealthId, name: hasher(20), occupation: hasher(20)}).expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.loyalty_id);
                assert.isNumber(res.body.result.wealth_id);
                if (res.body.result.name) assert.isString(res.body.result.name);
                assert.isString(res.body.result.occupation);

                done();
            });
        });

        it('POST /:id/create should create a new creature and add it to a list of relations', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/create', {species_id: speciesId, age: app.randomNumber(10, 80)}).expect(204).end(done);
        });
    });

    describe('/manifestations', function() {
        let relationRoute = 'manifestations',
            relationId,
            focusId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        before(function(done) {
            app.get('/focuses')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    focusId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {focus_id: focusId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/milestones', function() {
        let relationRoute = 'milestones',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/primals', function() {
        let relationRoute = 'primals',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    xdescribe('/relations', function() {
        let relationRoute = 'relations';

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });
    });

    // special adding -2
    describe('/shields', function() {
        let relationRoute = 'shields',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 2;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/skills', function() {
        let relationRoute = 'skills',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId, value: 2}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {value: 4}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/spells', function() {
        let relationRoute = 'spells',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/software', function() {
        let relationRoute = 'software',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    describe('/tactics', function() {
        let relationRoute = 'tactics',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 1;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) { verifier.relations(err, res, done); });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });
    });

    // special adding -2
    describe('/weapons', function() {
        let relationRoute = 'weapons',
            relationId;

        before(function(done) {
            app.get('/' + relationRoute)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    let length = res.body.length - 2;
                    relationId = res.body.results[length].id;

                    done();
                });
        });

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {insert_id: relationId}).expect(204).end(done);
        });

        it('PUT /:id should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId, {custom: hasher(20)}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(item) {
                    assert.isNumber(item.id);
                    assert.isBoolean(item.equipped);
                    if (item.custom) assert.isString(item.custom);
                });

                let length = res.body.length - 1;
                relationId = res.body.results[length].id;

                done();
            });
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId).expect(200).end(function(err, res) { verifier.relation(err, res, done); });
        });

        describe('/mods', function() {
            let modId;

            before(function(done) {
                app.get('/weaponmods')
                    .expect(200)
                    .end(function(err, res) {
                        if (err) return done(err);

                        let length = res.body.length - 1;
                        modId = res.body.results[length].id;

                        done();
                    });
            });

            it('POST /:id/mods should add a mod to the weapon', function(done) {
                app.post(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/mods', {insert_id: modId}).expect(204).end(done);
            });

            it('GET /:id/mods should display a list of items', function(done) {
                app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + relationId + '/mods').expect(200).end(function(err, res) { verifier.relations(err, res, done); });
            });
        });
    });

    describe('/dementations', function() {
        let relationRoute = 'dementations',
            uniqueId;

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {name: hasher(20), value: 1}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(result) {
                    assert.isNumber(result.id);
                    assert.isNumber(result.value);
                    assert.isString(result.name);
                });

                let length = res.body.length - 1;
                uniqueId = res.body.results[length].id;

                done();
            });
        });

        it('PUT /:id should change the name of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId, {name: hasher(20)}).expect(204).end(done);
        });

        it('PUT /:id/heal/1 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/heal/1').expect(204).end(done);
        });

        it('PUT /:id/heal/0 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/heal/0').expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isObject(res.body.result);
                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.value);
                assert.isString(res.body.result.name);

                done();
            });
        });

    });

    describe('/diseases', function() {
        let relationRoute = 'diseases',
            uniqueId;

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {name: hasher(20), value: 1}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(result) {
                    assert.isNumber(result.id);
                    assert.isNumber(result.value);
                    assert.isString(result.name);
                });

                let length = res.body.length - 1;
                uniqueId = res.body.results[length].id;

                done();
            });
        });

        it('PUT /:id should change the name of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId, {name: hasher(20)}).expect(204).end(done);
        });

        it('PUT /:id/heal/1 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/heal/1').expect(204).end(done);
        });

        it('PUT /:id/heal/0 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/heal/0').expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isObject(res.body.result);
                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.value);
                assert.isString(res.body.result.name);

                done();
            });
        });

    });

    describe('/traumas', function() {
        let relationRoute = 'traumas',
            uniqueId;

        it('POST / should add an item to the creature', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/' + relationRoute, {name: hasher(20), value: 1}).expect(204).end(done);
        });

        it('GET / should get a list of items', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isNumber(res.body.length);
                assert.isArray(res.body.results);

                _.each(res.body.results, function(result) {
                    assert.isNumber(result.id);
                    assert.isNumber(result.value);
                    assert.isString(result.name);
                });

                let length = res.body.length - 1;
                uniqueId = res.body.results[length].id;

                done();
            });
        });

        it('PUT /:id should change the name of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId, {name: hasher(20)}).expect(204).end(done);
        });

        it('PUT /:id/heal/1 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/heal/1').expect(204).end(done);
        });

        it('PUT /:id/heal/0 should change the value of the item', function(done) {
            app.put(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId + '/heal/0').expect(204).end(done);
        });

        it('GET /:id should display an item', function(done) {
            app.get(baseRoute + '/' + temporaryId + '/' + relationRoute + '/' + uniqueId).expect(200).end(function(err, res) {
                if (err) return done(err);

                assert.isObject(res.body.result);
                assert.isNumber(res.body.result.id);
                assert.isNumber(res.body.result.value);
                assert.isString(res.body.result.name);

                done();
            });
        });

    });

    describe('CLONE', function() {

        it('/:id/clone should create a copy', function(done) {
            app.post(baseRoute + '/' + temporaryId + '/clone')
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);

                    assert.isNumber(res.body.id);

                    done();
                });
        });

    });

});