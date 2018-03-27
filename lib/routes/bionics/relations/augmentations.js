'use strict';

const defaults = require('../../generic/relations/defaults');

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports = (router) => {
    const table = 'augmentation';
    const query = 'SELECT ' +
        'augmentation.id, ' +
        'augmentation.name, ' +
        'augmentation.description, ' +
        'augmentation.legal, ' +
        'augmentation.price, ' +
        'augmentation.hacking_difficulty ' +
        'FROM bionic_has_augmentation ' +
        'LEFT JOIN augmentation ON augmentation.id = bionic_has_augmentation.augmentation_id';

    defaults.rootGet(router, 'bionic', table, query);
    defaults.rootPost(router, 'bionic', table);

    defaults.itemGet(router, 'bionic', table, query);
    defaults.itemPut(router, 'bionic', table);
    defaults.itemDelete(router, 'bionic', table);
};