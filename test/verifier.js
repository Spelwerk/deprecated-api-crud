var validator = require('validator'),
    _ = require('underscore'),
    assert = require('chai').assert;

module.exports.generic = function(item) {
    assert.isNumber(item.id);
    assert.isNumber(item.user_id);
    if(item.original_id) assert.isNumber(item.original_id);

    assert.isBoolean(item.canon);

    assert.isString(item.name);
    if(item.description) assert.isString(item.description);

    if(item.icon) assert.equal(validator.isURL(item.icon), true);

    assert.isString(item.created);
    if(item.updated) assert.isString(item.updated);
    assert.isNull(item.deleted);
};

module.exports.comments = function(results) {
    assert.isArray(results);

    _.each(results, function(item) {
        assert.isNumber(item.id);
        assert.isString(item.comment);

        assert.isNumber(item.user_id);
        assert.isString(item.displayname);

        assert.isString(item.created);
        if(item.updated) assert.isString(item.updated);
        assert.isNull(item.deleted);
    });
};