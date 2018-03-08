const assert = require('chai').assert;

const app = require('../app');
const verifier = require('../verifier');
const hasher = require('../../lib/hasher');

describe('/problems', function() {

    function verifyItem(item) {
        assert.isNumber(item.id);
        assert.isString(item.name);
    }

    let baseRoute = '/problem';
    let temporaryId;

    before(function(done) {
        app.login(done);
    });

    describe('POST', function() {

        it('/ should create a new item', function(done) {
            app.post(baseRoute, { name: hasher(20) })
                .expect(201)
                .end(function(err, res) {
                    if (err) return done(err);

                    assert.isNumber(res.body.id);

                    temporaryId = res.body.id;

                    done();
                });
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

        it('/:id should return one item', function(done) {
            app.get(baseRoute + '/' + temporaryId)
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);

                    verifyItem(res.body.result);

                    done();
                })
        });

    });

});