import {chris} from '../../../helperFunctions.js';
export async function devourIntellect({speaker, actor, token, character, item, args}) {
	if (this.failedSaves.size != 1) return;
	let roll = await new Roll('3d6').roll({async: true});
	roll.toMessage({
		rollMode: 'roll',
		speaker: {alias: name},
		flavor: this.item.name
	});
	let targetActor = this.targets.first().actor;
	if (targetActor.system.abilities.int.value > roll.total) return;
	let effectData = {
		'label': this.item.name,
		'icon': this.item.img,
		'duration': {
			'seconds': 604800
		},
		'changes': [
			{
				'key': 'system.abilities.int.value',
				'mode': 3,
				'value': '0',
				'priority': 20
			},
			{
				"key": "macro.CE",
				"mode": 0,
				"value": "Stunned",
				"priority": 20
			},
			{
				"key": "macro.CE",
				"mode": 0,
				"value": "Incapacitated",
				"priority": 20
			}
		]
	};
	await chris.createEffect(targetActor, effectData);
}