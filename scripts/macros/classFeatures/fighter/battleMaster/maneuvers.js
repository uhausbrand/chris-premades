import {chris} from '../../../../helperFunctions.js';
import {queue} from '../../../../queue.js';
async function baitAndSwitch({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let targetToken = this.targets.first();
    if (targetToken.id === this.token.id) return;
    let selection = await chris.dialog('Who gets the AC bonus?', [['Yourself', false], ['Target', true]]);
    if (selection === undefined) return;
    let effectData = {
		'label': this.item.name,
		'icon': this.item.img,
        'changes': [
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': this.damageTotal,
                'priority': 20
            }
        ],
		'duration': {
			'rounds': 1
		},
		'origin': this.item.uuid
	};
    let sourceToken = this.token;
    let sourceUpdate = {
        'token': {
            'x': targetToken.x,
            'y': targetToken.y
        }
    };
    let targetUpdate = {
        'token': {
            'x': sourceToken.x,
            'y': sourceToken.y
        }
    };
    if (selection) {
        targetUpdate['embedded'] = {
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    } else {
        sourceUpdate['embedded'] = {
            'ActiveEffect': {
                [effectData.label]: effectData
            }
        }
    }
    let options = {
        'permanent': true,
        'name': this.item.name,
        'description': this.item.name
    };
    await warpgate.mutate(sourceToken.document, sourceUpdate, {}, options);
    await warpgate.mutate(targetToken.document, targetUpdate, {}, options);
}
async function refund({speaker, actor, token, character, item, args}) {
    if (this.hitTargets.size != 0) return;
    let effect = chris.findEffect(this.actor, 'Superiority Dice');
    if (!effect) return;
    let originItem = await fromUuid(effect.origin);
    if (!originItem) return;
    await originItem.update({'system.uses.value': originItem.system.uses.value + 1});
}
async function goadingAttack({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Maneuvers: Goading Attack');
    if (!effect) return;
    if (this.hitTargets.size === 0) {
        await refund.bind(this)({speaker, actor, token, character, item, args});
        await chris.removeEffect(effect);
        return;
    } else {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Maneuvers: Goading Attack', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maneuvers: Goading Attack');
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        featureData.system.save.dc = chris.getSpellDC(originItem);
        let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
        let options = {
            'showFullCard': false,
            'createWorkflow': true,
            'targetUuids': [this.targets.first().document.uuid],
            'configureDialog': false,
            'versatile': false,
            'consumeResource': false,
            'consumeSlot': false,
            'workflowOptions': {
                'autoRollDamage': 'always',
                'autoFastDamage': true
            }
        };
        await chris.removeEffect(effect);
        await MidiQOL.completeItemUse(feature, {}, options);
    }
}
async function goadingAttackTarget({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let sourceId = this.actor.flags['chris-premades']?.feature?.goadingAttack;
    if (!sourceId) return;
    if (sourceId === this.targets.first().id) return;
    let queueSetup = await queue.setup(this.item.uuid, 'goadingAttack', 50);
    if (!queueSetup) return;
    this.disadvantage = true;
    this.attackAdvAttribution['Disadvantage: Goading Attack'] = true;
    queue.remove(this.item.uuid);
}
async function grapplingStrike({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let sourceRoll = await this.actor.rollSkill('ath');
    let targetActor = this.targets.first().actor;
    let targetRoll;
    if (targetActor.system.skills.acr.total >= targetActor.system.skills.ath.total) {
        targetRoll = await targetActor.rollSkill('acr');
    } else {
        targetRoll = await targetActor.rollSkill('ath');
    }
    if (targetRoll.total > sourceRoll.total) return;
    await chris.addCondition(targetActor, 'Grappled', false, this.item.uuid);
}
async function lungingAttack({speaker, actor, token, character, item, args}) {
    if (this.targets.size != 1) return;
    let generatedMenu = [];
    this.actor.items.forEach(item => {
        if (item.type === 'weapon' && item.system.equipped === true) {
            generatedMenu.push([item.name, item.id]);
        }
    });
    let selection;
    if (generatedMenu.length === 0) return;
    if (generatedMenu.length === 1) selection = generatedMenu[0][1];
    if (!selection) selection = await chris.dialog('What weapon?', generatedMenu);
    if (!selection) return;
    let weaponData = duplicate(this.actor.items.get(selection).toObject());
    weaponData.system.range.value += 5;
    let weapon = new CONFIG.Item.documentClass(weaponData, {parent: this.actor});
    let options = {
        'targetUuids': [this.targets.first().document.uuid],
        'workflowOptions': {
            'autoRollDamage': 'always',
            'autoFastDamage': true
        }
    };
    await MidiQOL.completeItemUse(weapon, {}, options);
}
async function menacingAttack({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Maneuvers: Menacing Attack');
    if (!effect) return;
    if (this.hitTargets.size === 0) {
        await refund.bind(this)({speaker, actor, token, character, item, args});
        await chris.removeEffect(effect);
        return;
    } else {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Maneuvers: Menacing Attack', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maneuvers: Menacing Attack');
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        featureData.system.save.dc = chris.getSpellDC(originItem);
        let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
        let options = {
            'showFullCard': false,
            'createWorkflow': true,
            'targetUuids': [this.targets.first().document.uuid],
            'configureDialog': false,
            'versatile': false,
            'consumeResource': false,
            'consumeSlot': false,
        };
        await chris.removeEffect(effect);
        await MidiQOL.completeItemUse(feature, {}, options);
    }
}
async function parry(effect, origin) {
    let changeValue = Number(effect.changes[0].value.substring(6));
    let diceFormula = origin.actor.system.scale['battle-master']?.['combat-superiority-die']?.formula;
    if (!diceFormula) return;
    let dexMox = origin.actor.system.abilities.dex.mod;
    let roll = await new Roll(dexMox + ' + ' + diceFormula).roll({async: true});
    roll.terms[2].results[0].result = changeValue;
    roll._total = dexMox + changeValue;
    roll.toMessage({
        rollMode: 'roll',
        speaker: {alias: name},
        flavor: origin.name
    });
}
async function pushingAttack({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Maneuvers: Pushing Attack');
    if (!effect) return;
    if (this.hitTargets.size === 0) {
        await refund.bind(this)({speaker, actor, token, character, item, args});
        await chris.removeEffect(effect);
        return;
    } else {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Maneuvers: Pushing Attack', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maneuvers: Pushing Attack');
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        featureData.system.save.dc = chris.getSpellDC(originItem);
        let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
        let targetToken = this.targets.first();
        let options = {
            'showFullCard': false,
            'createWorkflow': true,
            'targetUuids': [targetToken.document.uuid],
            'configureDialog': false,
            'versatile': false,
            'consumeResource': false,
            'consumeSlot': false,
        };
        await chris.removeEffect(effect);
        let pushWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
        if (pushWorkflow.failedSaves.size != 1) return;
        let selection = await chris.dialog('How far do you push the target?', [['5 ft.', 5], ['10 ft.', 10], ['15 ft.', 15]]);
        if (!selection) return;
        let knockBackFactor;
        let ray;
        let newCenter;
        let hitsWall = true;
        while (hitsWall) {
            knockBackFactor = selection / canvas.dimensions.distance;
            ray = new Ray(this.token.center, targetToken.center);
            newCenter = ray.project(1 + ((canvas.dimensions.size * knockBackFactor) / ray.distance));
            hitsWall = targetToken.checkCollision(newCenter, {origin: ray.A, type: "move", mode: "any"});
            if (hitsWall) {
                selection -= 5;
                if (selection === 0) {
                    ui.notifications.info('Target is unable to be moved!');
                    return;
                }
            }
        }
        newCenter = canvas.grid.getSnappedPosition(newCenter.x - targetToken.w / 2, newCenter.y - targetToken.h / 2, 1);
        let targetUpdate = {
            'token': {
                'x': newCenter.x,
                'y': newCenter.y
            }
        };
        let options2 = {
            'permanent': true,
            'name': this.item.name,
            'description': this.item.name
        };
        await warpgate.mutate(targetToken.document, targetUpdate, {}, options2);
    }
}
async function sweepingAttackItem({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Maneuvers: Sweeping Attack');
    if (!effect) return;
    if (this.hitTargets.size === 0) {
        await refund.bind(this)({speaker, actor, token, character, item, args});
        await chris.removeEffect(effect);
        return;
    } else {
        let sourceNearbyTargets = chris.findNearby(this.token, 5, 'enemy');
        let targetNearbyTargets = chris.findNearby(this.targets.first(), 5, 'ally');
        if (sourceNearbyTargets.length === 0 || targetNearbyTargets.length === 0) {
            await refund.bind(this)({speaker, actor, token, character, item, args});
            await chris.removeEffect(effect);
            return;
        }
        let overlappingTargets = targetNearbyTargets.filter(function (obj) {
            return sourceNearbyTargets.indexOf(obj) !== -1;
        });
        if (overlappingTargets.length === 0) {
            await refund.bind(this)({speaker, actor, token, character, item, args});
            await chris.removeEffect(effect);
            return;
        }
        let buttons = [
            {
                'label': 'Ok',
                'value': true
            }, {
                'label': 'Cancel',
                'value': false
            }
        ];
        let selection = await chris.selectTarget('What target?', buttons, overlappingTargets, true, 'one');
        if (selection.buttons === false) {
            await refund.bind(this)({speaker, actor, token, character, item, args});
            await chris.removeEffect(effect);
            return;
        }
        let targetTokenID = selection.inputs.find(id => id != false);
        if (!targetTokenID) {
            await refund.bind(this)({speaker, actor, token, character, item, args});
            await chris.removeEffect(effect);
            return;
        }
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Maneuvers: Sweeping Attack', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maneuvers: Sweeping Attack');
        featureData.flags['chris-premades'] = {
            'feature': {
                'sweepingAttackRoll': this.attackTotal
            }
        };
        featureData.system.damage.parts = [
            [
                '@scale.battle-master.combat-superiority-die[' + this.defaultDamageType + ']',
                this.defaultDamageType
            ]
        ];
        let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
        let options = {
            'showFullCard': false,
            'createWorkflow': true,
            'targetUuids': [targetTokenID],
            'configureDialog': false,
            'versatile': false,
            'consumeResource': false,
            'consumeSlot': false,
        };
        await chris.removeEffect(effect);
        await MidiQOL.completeItemUse(feature, {}, options);
    }
}
async function sweepingAttackAttack({speaker, actor, token, character, item, args}) {
    let queueSetup = await queue.setup(this.item.uuid, 'sweepingAttack', 50);
	if (!queueSetup) return;
    let attackRoll = this.item.flags['chris-premades']?.feature?.sweepingAttackRoll;
    if (!attackRoll) return;
	let updatedRoll = await new Roll(String(attackRoll)).evaluate({async: true});
	this.setAttackRoll(updatedRoll);
	queue.remove(this.item.uuid);
}
async function tripAttack({speaker, actor, token, character, item, args}) {
    let effect = chris.findEffect(this.actor, 'Maneuvers: Trip Attack');
    if (!effect) return;
    if (this.hitTargets.size === 0) {
        await refund.bind(this)({speaker, actor, token, character, item, args});
        await chris.removeEffect(effect);
        return;
    } else {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Maneuvers: Trip Attack', false);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Maneuvers: Trip Attack');
        let originItem = await fromUuid(effect.origin);
        if (!originItem) return;
        featureData.system.save.dc = chris.getSpellDC(originItem);
        let feature = new CONFIG.Item.documentClass(featureData, {parent: this.actor});
        let targetToken = this.targets.first();
        let options = {
            'showFullCard': false,
            'createWorkflow': true,
            'targetUuids': [targetToken.document.uuid],
            'configureDialog': false,
            'versatile': false,
            'consumeResource': false,
            'consumeSlot': false,
        };
        await chris.removeEffect(effect);
        let tripWorkflow = await MidiQOL.completeItemUse(feature, {}, options);
        if (tripWorkflow.failedSaves.size != 1) return;
        let targetEffect = chris.findEffect(targetToken.actor, 'Prone');
        if (targetEffect) return;
        await chris.addCondition(targetToken.actor, 'Prone', false, this.item.uuid);
    }
}
export let maneuvers = {
    'baitAndSwitch': baitAndSwitch,
    'refund': refund,
    'goadingTarget': goadingAttackTarget,
    'goadingAttack': goadingAttack,
    'grapplingStrike': grapplingStrike,
    'lungingAttack': lungingAttack,
    'menacingAttack': menacingAttack,
    'parry': parry,
    'pushingAttack': pushingAttack,
    'sweepingAttackItem': sweepingAttackItem,
    'sweepingAttackAttack': sweepingAttackAttack,
    'tripAttack': tripAttack
}