export async function tentacleOfTheDeeps({speaker, actor, token, character, item, args}) {
    try {
        console.log(actor);
        console.log(item);
        console.log(args);
        const origin = args[0].itemUuid;
        //gather relevant data
        const warlockLevels = actor.getRollData().classes.warlock?.levels;
        if (warlockLevels === undefined) {
            console.warn(`${args[0].itemData.name} - Only for warlocks`);
            return; // not a warlock
        }

        const attackBonus = `${Number(args[0].actor.system.abilities[args[0].actor.system.attributes.spellcasting]?.mod) + Number(args[0].actor.system.attributes.prof) + Number(args[0].actor.system.bonuses.msak.attack)}`;
        const damagePart = warlockLevels >= 10 ? 2 : 1; // 10+ level warlock does 2d8 cold damage
        const damageParts = [[`${damagePart}d8`, "cold"]];
        const range = 60; //ft.
        const img = args[0].itemData.img;
        const effect = 'jb2a.water_splash.circle.01.blue';
        const tokenName = "Tentacle of the Deeps";

        // cleanup existing effect
        if (origin) {
            const removeList = actor.effects.filter(ae => ae.origin === origin && getProperty(ae, "flags.dae.transfer") !== 3).map(ae => ae.id);
            await actor.deleteEmbeddedDocuments("ActiveEffect", removeList)
        }

        // target a grid using warpgate
        let crosshairsDistance = 0;
        const checkDistance = async (crosshairs) => {
            while (crosshairs.inFlight) {
                //wait for initial render
                await warpgate.wait(100);

                const ray = new Ray(token.center, crosshairs);
                const distance = canvas.grid.measureDistances([{ray}], {gridSpaces: true})[0];

                //only update if the distance has changed
                if (crosshairsDistance !== distance) {
                    crosshairsDistance = distance;
                    if (distance > range) {
                        crosshairs.icon = 'icons/svg/hazard.svg';
                    } else {
                        crosshairs.icon = item.data.img;
                    }

                    crosshairs.draw();
                    crosshairs.label = `${distance} ft`;
                }
            }
        }

        const location = await warpgate.crosshairs.show(
            {
                // swap between targeting the grid square vs intersection based on token's size
                interval: -1, // only grid centers are allowed placements
                size: token.data.width,
                icon: item.data.img,
                label: '0 ft.',
            },
            {
                show: checkDistance
            },
        );

        if (location.cancelled || crosshairsDistance > range) {
            return;
        }

        //prepare token data for summon
        const updates = {
            token: {
                "alpha": 0 //for hiding the token initially, will be faded in with the sequencer animation
            }, embedded: {
                Item: {
                    "Tentacle Attack": {
                        "type": "weapon",
                        "img": img,
                        "system.actionType": "msak",
                        "system.properties.mgc": true,
                        "system.attackBonus": attackBonus,
                        "system.equipped": true,
                        "system.proficient": false,
                        "system.damage.parts": damageParts
                    }
                }
            }
        }

        //prepare sequencer animations
        async function myEffectFunction(template, update) {
            //prep summoning area
            new Sequence()
                .effect()
                .file(effect)
                .atLocation(template)
                .center()
                .scale(0.5)
                .belowTokens()
                .play()
        }

        async function postEffects(template, token) {
            //bring in our minion
            new Sequence()
                .animation()
                .on(token)
                .fadeIn(500)
                .play()
        }

        const callbacks = {
            pre: async (template, update) => {
                myEffectFunction(template, update);
                await warpgate.wait(1750);
            }, post: async (template, token) => {
                postEffects(template, token);
                await warpgate.wait(500);
            }
        };

        const options = {controllingActor: actor};
        const result = await warpgate.spawnAt(location, tokenName, updates, callbacks, options);

        if (result.length !== 1) return;
        const createdToken = game.canvas.tokens.get(result[0]);
        const targetUuid = createdToken.document.uuid;

        await actor.createEmbeddedDocuments("ActiveEffect", [{
            label: "Summon Tentacle of the Deeps",
            icon: item.img,
            origin,
            duration: {seconds: 60, rounds: 10},
            "flags.dae.stackable": false,
            changes: [{key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: [targetUuid]}]
        }]);

    } catch (err) {
        console.error(`${args[0].itemData.name} - Tentacle of the Deeps`, err);
    }
}
