import {tashaSummon} from '../../utility/tashaSummon.js';
import {chris} from '../../helperFunctions.js';
export async function summonUndead({speaker, actor, token, character, item, args}){
    let selection = await chris.dialog('What type?', [['Ghostly', 'Ghostly'], ['Putrid', 'Putrid'], ['Skeletal', 'Skeletal']]);
    if (!selection) return;
    let sourceActor = game.actors.getName('CPR - Undead Spirit');
    if (!sourceActor) return;
    let multiAttackFeatureData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Multiattack (Undead Spirit)', false);
    if (!multiAttackFeatureData) return;
    multiAttackFeatureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Multiattack (Undead Spirit)');
    let attacks = Math.floor(this.castData.castLevel / 2);
    multiAttackFeatureData.name = 'Multiattack (' + attacks + ' Attacks)';
    let hpFormula = 0;
    let damageBonus = 0;
    if (this.actor.flags['chris-premades']?.feature?.undeadThralls) {
        let wizardLevels = this.actor.classes.wizard?.system?.levels;
        if (wizardLevels) hpFormula += wizardLevels;
        damageBonus = this.actor.system.attributes.prof;
    }
    let name = 'Undead Spirit (' + selection + ')';
    let updates = {
        'actor': {
            'name': name,
            'system': {
                'details': {
                    'cr': tashaSummon.getCR(this.actor.system.attributes.prof)
                },
                'attributes': {
                    'ac': {
                        'flat': 11 + this.castData.castLevel
                    }
                }
            },
            'prototypeToken': {
                'name': name
            },
            'flags': {
                'chris-premades': {
                    'summon': {
                        'attackBonus': {
                            'melee': chris.getSpellMod(this.item) - sourceActor.system.abilities.dex.mod + Number(this.actor.system.bonuses.msak.attack),
                            'ranged': chris.getSpellMod(this.item) - sourceActor.system.abilities.dex.mod + Number(this.actor.system.bonuses.rsak.attack)
                        }
                    }
                }
            }
        },
        'token': {
            'name': name
        },
        'embedded': {
            'Item': {
                [multiAttackFeatureData.name]: multiAttackFeatureData,
                'Configure Images': warpgate.CONST.DELETE
            }
        }
    };
    let avatarImg = sourceActor.flags['chris-premades']?.summon?.image?.[selection]?.avatar;
    let tokenImg = sourceActor.flags['chris-premades']?.summon?.image?.[selection]?.token;
    if (avatarImg) updates.actor.img = avatarImg;
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    switch (selection) {
        case 'Ghostly':
            hpFormula += 30 + ((this.castData.castLevel - 3) * 10);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            updates.actor.system.attributes.movement = {
                'walk': 30,
                'fly': 40,
                'hover': true
            };
            let incorporealPassageData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Incorporeal Passage (Ghostly Only)', false);
            if (!incorporealPassageData) return;
            incorporealPassageData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Incorporeal Passage (Ghostly Only)');
            updates.embedded.Item[incorporealPassageData.name] = incorporealPassageData;
            let deathlyTouchData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Deathly Touch (Ghostly Only)', false);
            if (!deathlyTouchData) return;
            deathlyTouchData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Deathly Touch (Ghostly Only)');
            deathlyTouchData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
            if (damageBonus) deathlyTouchData.system.damage.parts[0][0] += ' + ' + damageBonus;
            updates.embedded.Item[deathlyTouchData.name] = deathlyTouchData;
            break;
        case 'Putrid':
            hpFormula += 30 + ((this.castData.castLevel - 3) * 10);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            let festeringAuraData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Festering Aura (Putrid Only)', false);
            if (!festeringAuraData) return;
            festeringAuraData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Festering Aura (Putrid Only)');
            festeringAuraData.system.save.dc = chris.getSpellDC(this.item);
            updates.embedded.Item[festeringAuraData.name] = festeringAuraData;
            let rottingClawData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Rotting Claw (Putrid Only)', false);
            if (!rottingClawData) return;
            rottingClawData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Rotting Claw (Putrid Only)');
            rottingClawData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
            if (damageBonus) rottingClawData.system.damage.parts[0][0] += ' + ' + damageBonus;
            setProperty(rottingClawData, 'flags.chris-premades.feature.rottingClaw.dc', chris.getSpellDC(this.item));
            updates.embedded.Item[rottingClawData.name] = rottingClawData;
            break;
        case 'Skeletal':
            hpFormula += 20 + ((this.castData.castLevel - 3) * 10);
            updates.actor.system.attributes.hp = {
                'formula': hpFormula,
                'max': hpFormula,
                'value': hpFormula
            };
            let graveBoltData = await chris.getItemFromCompendium('chris-premades.CPR Summon Features', 'Grave Bolt (Skeletal Only)', false);
            if (!graveBoltData) return;
            graveBoltData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Grave Bolt (Skeletal Only)');
            graveBoltData.system.damage.parts[0][0] += ' + ' + this.castData.castLevel;
            if (damageBonus) graveBoltData.system.damage.parts[0][0] += ' + ' + damageBonus;
            updates.embedded.Item[graveBoltData.name] = graveBoltData;
            break;
    }
    await tashaSummon.spawn(sourceActor, updates, 3600, this.item);
}