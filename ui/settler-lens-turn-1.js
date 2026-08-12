// Auto Settler Lens on Turn 1
//
// On the first turn, selects the starting city-founding unit and puts the
// Settler lens up over it.
//
// Two facts about the base game drive this design:
//
// 1. The turn-1 starting unit is UNIT_FOUNDER (age-antiquity/data/advanced-start.xml),
//    not UNIT_SETTLER.
// 2. The lens follows the selection. INTERFACEMODE_UNIT_SELECTED.transitionTo() ->
//    setUnitLens() maps UNIT_FOUNDER to 'fxs-founder-lens' and every other
//    city-founding unit to 'fxs-settler-lens'; INTERFACEMODE_DEFAULT.transitionTo()
//    deselects everything and returns to 'fxs-default-lens'.
//
// The Founder lens carries almost no layers (no appeal, resource, yield or
// culture-border layers), so every time the founder is selected the game
// replaces the Settler lens with it and it reads as "the lens switched off".
// Hence: select the unit first, then assert the Settler lens, and keep watching
// for turn 1 so a re-click of the founder does not knock it back out.
//
// Diagnostics use console.error on purpose: plain console.log from a UI mod is
// not written to the game logs, but console.error is (look for the
// [settler-lens-turn-1] prefix in Logs/UI.log).

import LensManager, { LensActivationEventName } from '/core/ui/lenses/lens-manager.js';
import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';
import { ComponentID } from '/core/ui/utilities/utilities-component-id.js';

const SETTLER_LENS = 'fxs-settler-lens';
const FOUNDER_LENS = 'fxs-founder-lens';
const UNIT_SELECTED_MODE = 'INTERFACEMODE_UNIT_SELECTED';
const TAG = '[settler-lens-turn-1]';

const POLL_MS = 250;
const MAX_POLLS = 160;          // ~40s of grace for the world/curtain to come up
const MAX_SELECT_ATTEMPTS = 20;
const MODE_GRACE_POLLS = 20;    // wait this long for unit-selected mode, then assert anyway
const STABLE_POLLS = 2;         // lens must hold this many polls before we stop polling

function log(msg) {
    console.error(`${TAG} ${msg}`);
}

function isTurnOne() {
    return typeof Game !== 'undefined' && Game.turn === 1;
}

// getActiveLens() logs an error of its own when nothing is set yet.
function activeLens() {
    try {
        return LensManager.getActiveLens();
    } catch (e) {
        return undefined;
    }
}

log(`module loaded (turn=${typeof Game !== 'undefined' ? Game.turn : 'n/a'})`);

// The unit that starts the game: anything that can found a city. UNIT_FOUNDER is
// the turn-1 unit in Antiquity; UNIT_SETTLER and civ-unique replacements
// (UNIT_NAGARIKA and friends) are covered by the same FoundCity flag.
function findFoundingUnit() {
    const player = Players.get(GameContext.localPlayerID);
    const unitIDs = player?.Units?.getUnitIds();
    if (!unitIDs) {
        return null;
    }
    let fallback = null;
    for (const unitID of unitIDs) {
        const unit = Units.get(unitID);
        if (!unit) {
            continue;
        }
        const unitDef = GameInfo.Units.lookup(unit.type);
        if (!unitDef?.FoundCity) {
            continue;
        }
        if (unitDef.UnitType == 'UNIT_FOUNDER') {
            return unitID;
        }
        fallback ??= unitID;
    }
    return fallback;
}

// Whenever the game swaps in the sparse Founder lens on turn 1 - on the initial
// selection and on every later re-click of the founder - swap it back out for
// the Settler lens. Only the Founder lens is overridden, so a lens the player
// picks from the minimap is left alone.
function onLensActivated(event) {
    if (!isTurnOne()) {
        window.removeEventListener(LensActivationEventName, onLensActivated);
        log('turn 1 over; stopped watching for the founder lens');
        return;
    }
    if (event.detail?.activeLens !== FOUNDER_LENS) {
        return;
    }
    // Defer so we are not re-entering setActiveLens from inside its own event.
    setTimeout(() => {
        if (!isTurnOne() || activeLens() !== FOUNDER_LENS) {
            return;
        }
        const ok = LensManager.setActiveLens(SETTLER_LENS);
        log(`swapped '${FOUNDER_LENS}' -> '${SETTLER_LENS}' (ok=${ok})`);
    }, 0);
}

window.addEventListener(LensActivationEventName, onLensActivated);

let polls = 0;
let selectAttempts = 0;
let selectedPolls = 0;
let stable = 0;
let timer = null;

function stop(why) {
    log(why);
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
}

function tick() {
    polls++;
    const turn = (typeof Game !== 'undefined') ? Game.turn : undefined;
    if (turn != null && turn > 1) {
        return stop(`turn ${turn} > 1; nothing to do`);
    }
    if (polls > MAX_POLLS) {
        return stop(`giving up after ${polls} polls (turn=${turn})`);
    }
    if (turn !== 1) {
        return; // world not up yet; keep waiting
    }

    const founderID = findFoundingUnit();
    if (!founderID) {
        return; // units not streamed in yet
    }

    const headID = UI.Player.getHeadSelectedUnit();
    const hasSelection = headID != null && ComponentID.isValid(headID);
    const founderSelected = hasSelection && ComponentID.isMatch(headID, founderID);

    if (!founderSelected) {
        if (hasSelection) {
            // The player is already driving; do not yank their selection.
            return stop(`another unit is selected (${ComponentID.toLogString(headID)}); standing down`);
        }
        selectAttempts++;
        if (selectAttempts > MAX_SELECT_ATTEMPTS) {
            return stop(`could not select ${ComponentID.toLogString(founderID)} after ${selectAttempts} attempts`);
        }
        log(`selecting founding unit ${ComponentID.toLogString(founderID)} (attempt ${selectAttempts})`);
        UI.Player.selectUnit(founderID);
        return; // let the engine raise the selection before touching the lens
    }

    // The unit is selected. Prefer to wait for unit-selected mode so the lens we
    // assert is the one that mode would keep, but do not wait forever: a
    // tutorial or cinematic mode can hold the UI for a while.
    selectedPolls++;
    if (!InterfaceMode.isInInterfaceMode(UNIT_SELECTED_MODE) && selectedPolls <= MODE_GRACE_POLLS) {
        return;
    }

    const lens = activeLens();
    if (lens === SETTLER_LENS) {
        if (++stable >= STABLE_POLLS) {
            stop(`unit selected and settler lens stable (poll ${polls}); watching for founder-lens swaps`);
        }
        return;
    }

    stable = 0;
    const ok = LensManager.setActiveLens(SETTLER_LENS);
    log(`asserting settler lens (was='${lens}', mode='${InterfaceMode.getCurrent()}', ok=${ok}, poll=${polls})`);
}

timer = setInterval(tick, POLL_MS);
tick();
