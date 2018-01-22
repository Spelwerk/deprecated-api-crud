'use strict';

const relation = require('../database/relation');
const basic = require('../generic/basics');
const relations = require('../generic/relations');

const augmentations = require('./relations/augmentations');
const backgrounds = require('./relations/backgrounds');
const bionics = require('./relations/bionics');
const loyalties = require('./relations/loyalties');
const manifestations = require('./relations/manifestations');
const milestones = require('./relations/milestones');
const weaponmods = require('./relations/weaponmods');
const weapons = require('./relations/weapons');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

function defaultRootGet(router, table, route, query) {
    router.get('/:id/' + route, async (req, res, next) => {
        let call = query + ' WHERE ' +
            'creature_has_' + table + '.creature_id = ?';

        await basic.select(req, res, next, call, [req.params.id]);
    });
}

function defaultRootPost(router, table, route) {
    router.post('/:id/' + route, async (req, res, next) => {
        await relations.insert(req, res, next, 'creature', req.params.id, table, req.body.insert_id);
    });
}

function defaultItemGet(router, table, route, query) {
    router.get('/:id/' + route + '/:item', async (req, res, next) => {
        let call = query + ' WHERE ' +
            'creature_has_' + table + '.creature_id = ? AND ' +
            'creature_has_' + table + '.' + table + '_id = ?';

        await basic.select(req, res, next, call, [req.params.id, req.params.item], true);
    });
}

function defaultItemPut(router, table, route) {
    router.put('/:id/' + route + '/:item', async (req, res, next) => {
        await relations.update(req, res, next, 'creature', req.params.id, table, req.params.item);
    });
}

function defaultItemDelete(router, table, route) {
    router.delete('/:id/' + route + '/:item', async (req, res, next) => {
        await relations.remove(req, res, next, 'creature', req.params.id, table, req.params.item);
    });
}

function defaultRoute(router, table, route, query) {
    defaultRootGet(router, table, route, query);
    defaultRootPost(router, table, route);
    defaultItemGet(router, table, route, query);
    defaultItemPut(router, table, route);
    defaultItemDelete(router, table, route);
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.armours = (router) => {
    const table = 'armour';
    const route = 'armours';
    let query = 'SELECT ' +
        'armour.id, ' +
        'armour.name, ' +
        'armour.description, ' +
        'creature_has_armour.custom, ' +
        'armour.icon, ' +
        'armour.price, ' +
        'creature_has_armour.equipped, ' +
        'armour.bodypart_id, ' +
        'bodypart.name AS bodypart_name ' +
        'FROM creature_has_armour ' +
        'LEFT JOIN armour ON armour.id = creature_has_armour.armour_id ' +
        'LEFT JOIN bodypart on bodypart.id = armour.bodypart_id';

    defaultRoute(router, table, route, query);
};

module.exports.assets = (router) => {
    const table = 'asset';
    const route = 'assets';
    const query = 'SELECT ' +
        'asset.id, ' +
        'asset.name, ' +
        'asset.description, ' +
        'creature_has_asset.custom, ' +
        'asset.equipable, ' +
        'asset.legal, ' +
        'asset.price, ' +
        'creature_has_asset.equipped, ' +
        'creature_has_asset.value, ' +
        'asset.assettype_id, ' +
        'assettype.name AS assettype_name ' +
        'FROM creature_has_asset ' +
        'LEFT JOIN asset ON asset.id = creature_has_asset.asset_id ' +
        'LEFT JOIN assettype ON assettype.id = asset.assettype_id';

    defaultRoute(router, table, route, query);
};

module.exports.attributes = (router) => {
    const table = 'attribute';
    const route = 'attributes';
    const query = 'SELECT ' +
        'attribute.id, ' +
        'attribute.name, ' +
        'attribute.description, ' +
        'creature_has_attribute.value, ' +
        'attribute.attributetype_id, ' +
        'attributetype.name AS attributetype_name ' +
        'FROM creature_has_attribute ' +
        'LEFT JOIN attribute ON attribute.id = creature_has_attribute.attribute_id ' +
        'LEFT JOIN attributetype ON attributetype.id = attribute.attributetype_id';

    defaultRoute(router, table, route, query);
};

// Backgrounds is special
module.exports.backgrounds = (router) => {
    const table = 'background';
    const route = 'backgrounds';
    const query = 'SELECT ' +
        'background.id, ' +
        'background.name, ' +
        'background.description, ' +
        'creature_has_background.custom, ' +
        'background.icon ' +
        'FROM creature_has_background ' +
        'LEFT JOIN background ON background.id = creature_has_background.background_id';

    defaultRootGet(router, table, route, query);

    router.post('/:id/' + route, async (req, res, next) => {
        await backgrounds.insert(req, res, next, req.params.id);
    });

    defaultItemGet(router, table, route, query);
    defaultItemPut(router, table, route);
    defaultItemDelete(router, table, route);
};

// Bionics is special
module.exports.bionics = (router) => {
    const table = 'bionic';
    const route = 'bionics';
    const query = 'SELECT ' +
        'bionic.id, ' +
        'bionic.name, ' +
        'bionic.description, ' +
        'creature_has_bionic.custom, ' +
        'bionic.icon, ' +
        'bionic.legal, ' +
        'bionic.price, ' +
        'bionic.hacking_difficulty, ' +
        'bionic.bodypart_id, ' +
        'bodypart.name AS bodypart_name ' +
        'FROM creature_has_bionic ' +
        'LEFT JOIN bionic ON bionic.id = creature_has_bionic.bionic_id ' +
        'LEFT JOIN bodypart ON bodypart.id = bionic.bodypart_id';

    defaultRootGet(router, table, route, query);
    defaultRootPost(router, table, route);
    defaultItemGet(router, table, route, query);
    defaultItemPut(router, table, route);

    router.delete('/:id/' + route + '/:item', async (req, res, next) => {
        await bionics.remove(req, res, next, req.params.id, req.params.item);
    });

    // Augmentations

    router.route('/:id/' + route + '/:item/augmentations')
        .get(async (req, res, next) => {
            let call = 'SELECT ' +
                'augmentation.id, ' +
                'augmentation.name, ' +
                'augmentation.description, ' +
                'augmentation.legal, ' +
                'augmentation.price, ' +
                'augmentation.hacking_difficulty ' +
                'FROM creature_has_augmentation ' +
                'LEFT JOIN augmentation ON augmentation.id = creature_has_augmentation.augmentation_id ' +
                'WHERE ' +
                'creature_has_augmentation.creature_id = ? AND ' +
                'creature_has_augmentation.bionic_id = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.item]);
        })
        .post(async (req, res, next) => {
            await augmentations.insert(req, res, next, req.params.id, req.params.item);
        });

    router.route('/:id/' + route + '/:item/augmentations/names')
        .get(async (req, res, next) => {
            let call = 'SELECT ' +
                'augmentation.id, ' +
                'augmentation.name ' +
                'FROM creature_has_augmentation ' +
                'LEFT JOIN augmentation ON augmentation.id = creature_has_augmentation.augmentation_id ' +
                'WHERE ' +
                'creature_has_augmentation.creature_id = ? AND ' +
                'creature_has_augmentation.bionic_id = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.item]);
        })
        .post(async (req, res, next) => {
            await augmentations.insert(req, res, next, req.params.id, req.params.item);
        });

    router.route('/:id/' + route + '/:item/augmentations/:augmentation')
        .delete(async (req, res, next) => {
            await augmentations.remove(req, res, next, req.params.id, req.params.item, req.params.augmentation);
        });
};

module.exports.currencies = (router) => {
    const table = 'currency';
    const route = 'currencies';
    const query = 'SELECT ' +
        'currency.id, ' +
        'currency.name, ' +
        'currency.description, ' +
        'currency.short, ' +
        'currency.exchange, ' +
        'creature_has_currency.value ' +
        'FROM creature_has_currency ' +
        'LEFT JOIN currency ON currency.id = creature_has_currency.currency_id';

    defaultRoute(router, table, route, query);
};

module.exports.expertises = (router) => {
    const table = 'expertise';
    const route = 'expertises';
    const query = 'SELECT ' +
        'expertise.id, ' +
        'expertise.name, ' +
        'expertise.description, ' +
        'creature_has_expertise.custom, ' +
        'skill.icon, ' +
        'expertise.skill_id, ' +
        'skill.name AS skill_name, ' +
        'creature_has_expertise.value ' +
        'FROM creature_has_expertise ' +
        'LEFT JOIN expertise ON expertise.id = creature_has_expertise.expertise_id ' +
        'LEFT JOIN skill ON skill.id = expertise.skill_id';

    defaultRoute(router, table, route, query);
};

module.exports.forms = (router) => {
    const table = 'form';
    const route = 'forms';
    const query = 'SELECT ' +
        'form.id, ' +
        'form.name, ' +
        'form.description, ' +
        'form.icon, ' +
        'form.manifestation_id, ' +
        'form.expertise_id, ' +
        'form.species_id, ' +
        'form.appearance ' +
        'FROM creature_has_form ' +
        'LEFT JOIN form ON form.id = creature_has_form.form_id';

    defaultRoute(router, table, route, query);
};

module.exports.gifts = (router) => {
    const table = 'gift';
    const route = 'gifts';
    const query = 'SELECT ' +
        'gift.id, ' +
        'gift.name, ' +
        'gift.description, ' +
        'creature_has_gift.custom ' +
        'FROM creature_has_gift ' +
        'LEFT JOIN gift ON gift.id = creature_has_gift.gift_id';

    defaultRoute(router, table, route, query);
};

module.exports.imperfections = (router) => {
    const table = 'imperfection';
    const route = 'imperfections';
    const query = 'SELECT ' +
        'imperfection.id, ' +
        'imperfection.name, ' +
        'imperfection.description, ' +
        'creature_has_imperfection.custom ' +
        'FROM creature_has_imperfection ' +
        'LEFT JOIN imperfection ON imperfection.id = creature_has_imperfection.imperfection_id';

    defaultRoute(router, table, route, query);
};

module.exports.languages = (router) => {
    const table = 'language';
    const route = 'languages';
    const query = 'SELECT ' +
        'language.id, ' +
        'language.name, ' +
        'language.description, ' +
        'creature_has_language.fluent ' +
        'FROM creature_has_language ' +
        'LEFT JOIN language ON language.id = creature_has_language.language_id';

    defaultRoute(router, table, route, query);
};

// Loyalties is special
module.exports.loyalties = (router) => {
    const table = 'loyalty';
    const route = 'loyalties';
    const query = 'SELECT ' +
        'creature_has_loyalty.id, ' +
        'creature_has_loyalty.milestone_id, ' +
        'creature_has_loyalty.loyalty_id, ' +
        'creature_has_loyalty.wealth_id, ' +
        'creature_has_loyalty.name, ' +
        'creature_has_loyalty.occupation, ' +
        'loyalty.name AS loyalty_name, ' +
        'wealth.name AS wealth_name ' +
        'FROM creature_has_loyalty ' +
        'LEFT JOIN loyalty ON loyalty.id = creature_has_loyalty.loyalty_id ' +
        'LEFT JOIN wealth ON wealth.id = creature_has_loyalty.wealth_id';

    defaultRootGet(router, table, route, query);
    defaultRootPost(router, table, route);

    router.route('/:id/' + route + '/:item')
        .get(async (req, res, next) => {
            let call = query + ' WHERE ' +
                'creature_has_' + table + '.creature_id = ? AND ' +
                'creature_has_' + table + '.id = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.item], true);
        })
        .put(async (req, res, next) => {
            await loyalties.update(req, res, next, req.params.id, req.params.item);
        })
        .delete(async (req, res, next) => {
            await loyalties.remove(req, res, next, req.params.id, req.params.item);
        });

    router.route('/:id/' + route + '/:item/create')
        .post(async (req, res, next) => {
            await loyalties.create(req, res, next, req.params.id, req.params.item);
        });
};

// Manifestations is special
module.exports.manifestations = (router) => {
    const table = 'manifestation';
    const route = 'manifestations';
    const query = 'SELECT ' +
        'manifestation.id, ' +
        'manifestation.name, ' +
        'manifestation.description, ' +
        'manifestation.icon, ' +
        'creature_has_manifestation.focus_id,' +
        'focus.name AS focus_name,' +
        'focus.description AS focus_description,' +
        'focus.icon AS focus_icon ' +
        'FROM creature_has_manifestation ' +
        'LEFT JOIN manifestation ON manifestation.id = creature_has_manifestation.manifestation_id ' +
        'LEFT JOIN focus ON focus.id = creature_has_manifestation.focus_id';

    defaultRootGet(router, table, route, query);

    router.post('/:id/' + route, async (req, res, next) => {
        await manifestations.insert(req, res, next, req.params.id);
    });

    defaultItemGet(router, table, route, query);
    defaultItemPut(router, table, route);
    defaultItemDelete(router, table, route);
};

// Milestones is special
module.exports.milestones = (router) => {
    const table = 'milestone';
    const route = 'milestones';
    const query = 'SELECT ' +
        'milestone.id, ' +
        'milestone.name, ' +
        'milestone.description, ' +
        'creature_has_milestone.custom ' +
        'FROM creature_has_milestone ' +
        'LEFT JOIN milestone ON milestone.id = creature_has_milestone.milestone_id';

    defaultRootGet(router, table, route, query);

    router.post('/:id/' + route, async (req, res, next) => {
        await milestones.insert(req, res, next, req.params.id);
    });

    defaultItemGet(router, table, route, query);
    defaultItemPut(router, table, route);
    defaultItemDelete(router, table, route);
};

module.exports.primals = (router) => {
    const table = 'primal';
    const route = 'primals';
    const query = 'SELECT ' +
        'primal.id, ' +
        'primal.name, ' +
        'primal.description, ' +
        'primal.icon, ' +
        'primal.expertise_id, ' +
        'primal.manifestation_id, ' +
        'primal.maximum, ' +
        'primal.effect, ' +
        'creature_has_primal.value ' +
        'FROM creature_has_primal ' +
        'LEFT JOIN primal ON primal.id = creature_has_primal.primal_id';

    defaultRoute(router, table, route, query);
};

module.exports.relations = (router) => {
    const table = 'relation';
    const route = 'relations';
    const query = 'SELECT ' +
        'creature.id, ' +
        'creature.firstname, ' +
        'creature_with_extra.occupation, ' +
        'creature_has_relation.loyalty_id, ' +
        'loyalty.name AS loyalty_name, ' +
        'creature_is_wealth.wealth_id, ' +
        'wealth.name AS wealth_name, ' +
        'creature_has_relation.milestone_id ' +
        'FROM creature_has_relation ' +
        'LEFT JOIN creature ON creature.id = creature_has_relation.relation_id ' +
        'LEFT JOIN creature_with_extra ON creature_with_extra.creature_id = creature.id ' +
        'LEFT JOIN loyalty ON loyalty.id = creature_has_relation.loyalty_id ' +
        'LEFT JOIN creature_is_wealth ON creature_is_wealth.creature_id = creature.id ' +
        'LEFT JOIN wealth ON wealth.id = creature_is_wealth.wealth_id';

    defaultRoute(router, table, route, query);
};

module.exports.shields = (router) => {
    const table = 'shield';
    const route = 'shields';
    const query = 'SELECT ' +
        'shield.id, ' +
        'shield.name, ' +
        'shield.description, ' +
        'creature_has_shield.custom, ' +
        'shield.icon, ' +
        'shield.price, ' +
        'shield.damage_dice, ' +
        'shield.damage_bonus, ' +
        'shield.critical_dice, ' +
        'shield.critical_bonus, ' +
        'shield.attribute_id, ' +
        'attribute.name AS attribute_name, ' +
        'shield.expertise_id, ' +
        'creature_has_shield.equipped ' +
        'FROM creature_has_shield ' +
        'LEFT JOIN shield ON shield.id = creature_has_shield.shield_id ' +
        'LEFT JOIN attribute ON attribute.id = shield.attribute_id';

    defaultRoute(router, table, route, query);
};

module.exports.skills = (router) => {
    const table = 'skill';
    const route = 'skills';
    const query = 'SELECT ' +
        'skill.id, ' +
        'skill.name, ' +
        'skill.description, ' +
        'skill.icon, ' +
        'creature_has_skill.value ' +
        'FROM creature_has_skill ' +
        'LEFT JOIN skill ON skill.id = creature_has_skill.skill_id';

    defaultRoute(router, table, route, query);
};

module.exports.spells = (router) => {
    const table = 'spell';
    const route = 'spells';
    const query = 'SELECT ' +
        'spell.id, ' +
        'spell.name, ' +
        'spell.description, ' +
        'spell.icon, ' +
        'spell.effect, ' +
        'spell.effect_dice, ' +
        'spell.effect_bonus, ' +
        'spell.damage_dice, ' +
        'spell.damage_bonus, ' +
        'spell.critical_dice, ' +
        'spell.critical_bonus, ' +
        'spell.distance, ' +
        'spell.cost, ' +
        'spell_is_attribute.attribute_id, ' +
        'attribute.name AS attribute_name ' +
        'FROM creature_has_spell ' +
        'LEFT JOIN spell ON spell.id = creature_has_spell.spell_id ' +
        'LEFT JOIN spell_is_attribute ON spell_is_attribute.spell_id = spell.id ' +
        'LEFT JOIN attribute ON attribute.id = spell_is_attribute.attribute_id';

    defaultRoute(router, table, route, query);
};

module.exports.software = (router) => {
    const table = 'software';
    const route = 'software';
    const query = 'SELECT ' +
        'software.id, ' +
        'software.name, ' +
        'software.description, ' +
        'software.legal, ' +
        'software.price, ' +
        'software.hacking_difficulty, ' +
        'software.hacking_bonus, ' +
        'software.softwaretype_id, ' +
        'softwaretype.name AS softwaretype_name ' +
        'FROM creature_has_software ' +
        'LEFT JOIN software ON software.id = creature_has_software.software_id ' +
        'LEFT JOIN softwaretype ON softwaretype.id = software.softwaretype_id';

    defaultRoute(router, table, route, query);
};

module.exports.tactics = (router) => {
    const table = 'tactic';
    const route = 'tactics';
    const query = 'SELECT ' +
        'tactic.id, ' +
        'tactic.name, ' +
        'tactic.description, ' +
        'tactic.icon, ' +
        'tactic.weapontype_id, ' +
        'tactic.effect, ' +
        'tactic.damage_dice, ' +
        'tactic.damage_bonus, ' +
        'tactic.critical_dice, ' +
        'tactic.critical_bonus, ' +
        'tactic.cost ' +
        'FROM creature_has_tactic ' +
        'LEFT JOIN tactic ON tactic.id = creature_has_tactic.tactic_id';

    defaultRoute(router, table, route, query);
};

// Weapons is VERY special
module.exports.weapons = (router) => {
    const table = 'weapon';
    const route = 'weapons';
    const query = 'SELECT weapon_id AS id, equipped, custom FROM creature_has_weapon';

    defaultRootGet(router, table, route, query);
    defaultRootPost(router, table, route);
    defaultItemGet(router, table, route, query);
    defaultItemPut(router, table, route);

    router.delete('/:id/' + route + '/:item', async (req, res, next) => {
        await weapons.remove(req, res, next, req.params.id, req.params.item);
    });

    // Weapon Mods

    router.route('/:id/' + route + '/:item/mods')
        .get(async (req, res, next) => {
            let call = 'SELECT ' +
                'weaponmod.id, ' +
                'weaponmod.name, ' +
                'weaponmod.description, ' +
                'weaponmod.icon, ' +
                'weaponmod.short, ' +
                'weaponmod.price, ' +
                'weaponmod.damage_dice, ' +
                'weaponmod.damage_bonus, ' +
                'weaponmod.critical_dice, ' +
                'weaponmod.critical_bonus, ' +
                'weaponmod.hit, ' +
                'weaponmod.hands, ' +
                'weaponmod.distance ' +
                'FROM creature_has_weaponmod ' +
                'LEFT JOIN weaponmod ON weaponmod.id = creature_has_weaponmod.weaponmod_id ' +
                'WHERE ' +
                'creature_has_weaponmod.creature_id = ? AND ' +
                'creature_has_weaponmod.weapon_id = ?';

            await basic.select(req, res, next, call, [req.params.id, req.params.item]);
        })
        .post(async (req, res, next) => {
            await weaponmods.insert(req, res, next, req.params.id, req.params.item);
        });

    router.route('/:id/' + route + '/:item/mods/:mod')
        .delete(async (req, res, next) => {
            await weaponmods.remove(req, res, next, req.params.id, req.params.item, req.params.mod);
        });

};
