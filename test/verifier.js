let validator = require('validator'),
    _ = require('underscore'),
    assert = require('chai').assert;

function generic(item) {
    assert.isNumber(item.id);
    if(item.user_id) assert.isNumber(item.user_id);
    if(item.canon) assert.isBoolean(item.canon);

    if(item.name) assert.isString(item.name);
    if(item.description) assert.isString(item.description);
    if(item.icon) assert.equal(validator.isURL(item.icon), true);

    if(item.created) assert.isString(item.created);
    if(item.updated) assert.isString(item.updated);
    if(item.deleted) assert.isNull(item.deleted);
}

module.exports.generic = generic;

module.exports.lists = (body, customFn) => {
    assert.isNumber(body.length);

    if(body.length > 0) {
        assert.isArray(body.results);
        assert.lengthOf(body.results, body.length);

        _.each(body.results, function(item) {
            customFn(item);
        });
    }

    assert.isObject(body.fields);
};

module.exports.comments = (err, res, done) => {
    if(err) return done(err);

    assert.isArray(res.body.results);

    _.each(res.body.results, function(item) {
        assert.isNumber(item.id);
        assert.isString(item.comment);

        assert.isNumber(item.user_id);
        assert.isString(item.displayname);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        assert.isNull(item.deleted);
    });

    done();
};

module.exports.ownership = (err, res, done) => {
    if(err) return done(err);

    if(res.body !== null) {
        for(let i in res.body) {
            assert.isBoolean(res.body[i]);
        }
    }

    done();
};

module.exports.relations = (err, res, done) => {
    if(err) return done(err);

    assert.isNumber(res.body.length);
    assert.isArray(res.body.results);

    assert.isAtLeast(res.body.length, 1);
    assert.equal(res.body.length, res.body.results.length);

    _.each(res.body.results, function(item) {
        generic(item);
    });

    done();
};

module.exports.relation = (err, res, done) => {
    if(err) return done(err);

    generic(res.body.result);

    done();
};
