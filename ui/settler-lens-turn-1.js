// Auto Settler Lens on Turn 1
//
// Switches the map to the built-in Settler lens as soon as the first turn
// begins. The lens name and LensManager import mirror how the base game and
// existing lens mods reference the lens system.

import { L as LensManager } from '/core/ui/lenses/lens-manager.chunk.js';

// Built-in lens ids follow the "fxs-<name>-lens" convention
// (e.g. fxs-default-lens, fxs-settler-lens, fxs-continent-lens, fxs-appeal-lens).
const SETTLER_LENS = 'fxs-settler-lens';

// Guard so we only ever do this once per game session.
let applied = false;

function applySettlerLens() {
    if (applied) {
        return;
    }
    applied = true;
    engine.off('LocalPlayerTurnBegin', onLocalPlayerTurnBegin);

    // Defer to the end of the current callback queue so we run after the
    // engine's own turn-start handling (e.g. auto-selecting the founder unit),
    // otherwise the game can immediately overwrite our lens choice.
    setTimeout(() => {
        try {
            if (LensManager.getActiveLens?.() !== SETTLER_LENS) {
                LensManager.setActiveLens(SETTLER_LENS);
            }
        } catch (e) {
            console.error(`[settler-lens-turn-1] failed to activate ${SETTLER_LENS}: ${e}`);
        }
    }, 0);
}

function onLocalPlayerTurnBegin() {
    if (typeof Game !== 'undefined' && Game.turn === 1) {
        applySettlerLens();
    }
}

// Primary path: react to the first local turn beginning.
engine.on('LocalPlayerTurnBegin', onLocalPlayerTurnBegin);

// Fallback: if this script happens to load after turn 1 has already begun,
// apply straight away instead of waiting for an event that already fired.
if (typeof Game !== 'undefined' && Game.turn === 1) {
    applySettlerLens();
}
