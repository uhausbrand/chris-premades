import {chris} from '../../helperFunctions.js';
export async function massCureWounds({speaker, actor, token, character, item, args}) {
	if (this.targets.size === 0) return;
	let sourceDisposition = this.token.document.disposition;
	let targetTokens = [];
	for (let i of this.targets) {
		if (i.document.disposition === sourceDisposition) targetTokens.push(i);
	}
	if (targetTokens.length === 0) return;
	let diceNumber = 8 - this.castData.castLevel;
	let damageFormula = diceNumber + 'd8[healing] + ' + chris.getSpellMod(this.item);
	let damageRoll = await new Roll(damageFormula).roll({async: true});
	if (targetTokens.length <= 6) {
		chris.applyWorkflowDamage(this.token, damageRoll, 'healing', targetTokens, this.item.name, this.itemCardId);
	} else {
		let buttons = [
			{
				'label': 'Yes',
				'value': true
			}, {
				'label': 'No',
				'value': false
			}
		];
		let selection = await chris.selectTarget('What targets would you like to heal? Max: 6', buttons, targetTokens, true, 'multiple');
		if (!selection.buttons) return;
		let selectedTokens = [];
		for (let i of selection.inputs) {
			if (i) selectedTokens.push(await fromUuid(i));
		}
		if (selectedTokens.length > 6) {
			ui.notifications.info('Too many targets selected!');
			return;
		}
		chris.applyWorkflowDamage(this.token, damageRoll, 'healing', selectedTokens, this.item.name, this.itemCardId);
	}
}