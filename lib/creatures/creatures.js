'use strict';

const DatabaseRowNotFoundError = require('../errors/database-row-not-found-error');
const UserNotLoggedInError = require('../errors/user-not-logged-in-error');

const yaml = require('node-yaml').readSync;

const sql = require('../database/sql');
const elemental = require('../database/elemental');

let config = {};
config.defaults = yaml('../../config/defaults.yml');
config.points = yaml('../../config/points.yml');

// ////////////////////////////////////////////////////////////////////////////////// //
// PRIVATE
// ////////////////////////////////////////////////////////////////////////////////// //

function FLOOR(number, floor) {
    number = parseInt(number) || floor;

    number = number < floor
        ? floor
        : number;

    return number;
}

function ROOF(number, roof) {
    number = parseInt(number) || roof;

    number = number > roof
        ? roof
        : number;

    return number;
}

// Getting Data

async function getEpoch(epochId) {
    try {
        let [rows] = await sql('SELECT * FROM epoch WHERE id = ?', [epochId]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;

        return rows[0];
    } catch(e) {
        return e;
    }
}

async function getWorld(worldId) {
    try {
        let [rows] = await sql('SELECT * FROM world WHERE id = ?', [worldId]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;

        return rows[0];
    } catch(e) {
        return e;
    }
}

async function getSpecies(speciesId) {
    try {
        let [rows] = await sql('SELECT * FROM species WHERE id = ?', [speciesId]);
        if (rows.length === 0) return new DatabaseRowNotFoundError;

        return rows[0];
    } catch(e) {
        return e;
    }
}

// Inserting points into body

function insertPointsIntoBody(body, age, multiplier) {
    age = FLOOR(age, 1);
    multiplier = ROOF(multiplier, 1);

    // Setting up points for further character creation
    body.points_background = config.points.baseline.background;
    body.points_expertise = config.points.baseline.expertise;
    body.points_form = config.points.baseline.form;
    body.points_gift = config.points.baseline.gift;
    body.points_imperfection = config.points.baseline.imperfection;
    body.points_language = config.points.baseline.language;
    body.points_milestone = config.points.baseline.milestone;
    body.points_primal = config.points.baseline.primal;
    body.points_skill = config.points.baseline.skill;
    body.points_spell = config.points.baseline.spell;

    // Multiply age with species multiplier and divide
    body.points_expertise += (age * multiplier) / config.points.divide.expertise;
    body.points_milestone += (age * multiplier) / config.points.divide.milestone;
    body.points_primal += (age * multiplier) / config.points.divide.primal;
    body.points_skill += (age * multiplier) / config.points.divide.skill;
    body.points_spell += (age * multiplier) / config.points.divide.spell;

    // Ensuring maximum as Integer
    body.points_expertise = ROOF(body.points_expertise, config.points.maximum.expertise);
    body.points_milestone = ROOF(body.points_milestone, config.points.maximum.milestone);
    body.points_primal = ROOF(body.points_primal, config.points.maximum.primal);
    body.points_skill = ROOF(body.points_skill, config.points.maximum.skill);
    body.points_spell = ROOF(body.points_spell, config.points.maximum.spell);

    return body;
}

// Getting attributes

async function getAttributesFromWorld(worldId) {
    try {
        let array = [];

        let [rows] = await sql('SELECT * FROM world_has_attribute WHERE world_id = ?', [worldId]);
        if(rows.length === 0) return new DatabaseRowNotFoundError;

        for(let i in rows) {
            array.push({ id: parseInt(rows[i].attribute_id), value: parseInt(rows[i].value) });
        }

        return array;
    } catch(e) {
        return e;
    }
}

async function getAttributesFromSpecies(speciesId) {
    try {
        let array = [];

        let [rows] = await sql('SELECT * FROM species_has_attribute WHERE species_id = ?', [speciesId]);

        for(let i in rows) {
            array.push({ id: parseInt(rows[i].attribute_id), value: parseInt(rows[i].value) });
        }

        return array;
    } catch(e) {
        return e;
    }
}

// Getting skills

async function getSkillsFromDefault() {
    try {
        let array = [];

        let [rows] = await sql('SELECT id FROM skill WHERE optional = ?', [0]);
        if(rows.length === 0) return new DatabaseRowNotFoundError;

        for(let i in rows) {
            array.push(parseInt(rows[i].id));
        }

        return array;
    } catch(e) {
        return e;
    }
}

async function getSkillsFromEpoch(epochId) {
    try {
        let array = [];

        let [rows] = await sql('SELECT skill_id FROM epoch_has_skill WHERE epoch_id = ?', [epochId]);

        for(let i in rows) {
            array.push(parseInt(rows[i].skill_id));
        }

        return array;
    } catch(e) {
        return e;
    }
}

async function getSkillsFromSpecies(speciesId) {
    try {
        let array = [];

        let [rows] = await sql('SELECT skill_id FROM species_has_skill WHERE species_id = ?', [speciesId]);

        for(let i in rows) {
            array.push(parseInt(rows[i].skill_id));
        }

        return array;
    } catch(e) {
        return e;
    }
}

// Inserting attributes & skills

async function insertAttributes(creatureId, worldId, speciesId) {
    try {
        let creatureAttributes = await getAttributesFromWorld(worldId);
        let speciesAttributes = await getAttributesFromSpecies(speciesId);

        let query = 'INSERT INTO creature_has_attribute (creature_id,attribute_id,value) VALUES ';

        for(let i in creatureAttributes) {
            for(let n in speciesAttributes) {
                if(creatureAttributes[i].id !== speciesAttributes[n].id) continue;

                creatureAttributes[i].value += speciesAttributes[n].value;
            }

            query += '(' + creatureId + ',' + creatureAttributes[i].id + ',' + creatureAttributes[i].value + '),';
        }

        query = query.slice(0, -1);

        await sql(query);
    } catch(e) {
        throw e;
    }
}

async function insertSkills(creatureId, epochId, speciesId) {
    try {
        let creatureSkills = await getSkillsFromDefault();

        let epochSkills = await getSkillsFromEpoch(epochId);

        for(let i in epochSkills) {
            if(creatureSkills.indexOf(epochSkills[i]) !== -1) continue;

            creatureSkills.push(epochSkills[i]);
        }

        let speciesSkills = await getSkillsFromSpecies(speciesId);

        for(let i in speciesSkills) {
            if(creatureSkills.indexOf(speciesSkills[i]) !== -1) continue;

            creatureSkills.push(speciesSkills[i]);
        }

        let query = 'INSERT INTO creature_has_skill (creature_id,skill_id) VALUES ';

        for(let i in creatureSkills) {
            query += '(' + creatureId + ',' + creatureSkills[i] + '),';
        }

        query = query.slice(0, -1);

        await sql(query);
    } catch(e) {
        throw e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// PUBLIC
// ////////////////////////////////////////////////////////////////////////////////// //

async function insert(req, body) {
    if(!req.user.id) return new UserNotLoggedInError;

    let id;

    try {
        // Getting required data from Epoch
        let epoch = await getEpoch(body.epoch_id);

        // Getting required data from World
        let world = await getWorld(epoch.world_id);

        // Getting required data from Species
        let species = await getSpecies(body.species_id);

        // Body Points
        body = insertPointsIntoBody(body, body.age, species.multiply_points);

        // Creature
        id = await elemental.insert(req, body, 'creature');

        // Species
        await sql('INSERT INTO creature_has_species (creature_id,species_id,first) VALUES (?,?,?)', [id, species.id, 1]);

        // Attributes
        await insertAttributes(id, world.id, species.id);

        // Skills
        await insertSkills(id, epoch.id, species.id);

        return id;
    } catch(e) {
        return e;
    }
}

// ////////////////////////////////////////////////////////////////////////////////// //
// EXPORTS
// ////////////////////////////////////////////////////////////////////////////////// //

module.exports.insert = insert;