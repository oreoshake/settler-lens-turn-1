// Auto Settler Lens on Turn 1
//
// Activates the built-in Settler lens at the start of the first turn.
//
// Why a poll instead of a single event hook: the lens only "sticks" once (a) the
// game has reached turn 1, (b) the Settler lens has been registered, and (c) the
// engine has finished its own startup lens setup (entering INTERFACEMODE_DEFAULT
// sets "fxs-default-lens", which would otherwise overwrite us). Those happen in a
// build-dependent order, so we repeatedly assert the lens until we observe it stay
// active across two checks, then stop. This wins the startup race without fighting
// the player afterward.

import LensManager from '/core/ui/lenses/lens-manager.js';

const SETTLER_LENS = 'fxs-settler-lens';
const POLL_MS = 300;         // how often to check
const MAX_POLLS = 120;       // safety cap (~36s) in case turn 1 never arrives
const STABLE_REQUIRED = 2;   // stop once settler stays active this many checks

let polls = 0;
let stable = 0;
let timer = null;

function stop() {
    if (timer !== null) {
        clearInterval(timer);
        timer = null;
    }
}

function tick() {
    polls++;
    const turn = (typeof Game !== 'undefined') ? Game.turn : undefined;

    // Loaded past the first turn (e.g. a mid-game save): do nothing.
    if (turn != null && turn > 1) {
        console.log(`[settler-lens-turn-1] turn ${turn} > 1; not forcing the lens`);
        return stop();
    }

    // On turn 1: assert the settler lens until it holds.
    if (turn === 1) {
        let active;
        try {
            active = LensManager.getActiveLens();
        } catch (e) {
            active = undefined;
        }
        if (active === SETTLER_LENS) {
            if (++stable >= STABLE_REQUIRED) {
                console.log(`[settler-lens-turn-1] settler lens active and stable (poll ${polls}); done`);
                return stop();
            }
        } else {
            stable = 0;
            const ok = LensManager.setActiveLens(SETTLER_LENS);
            console.log(`[settler-lens-turn-1] asserting settler lens (was='${active}', ok=${ok}, poll=${polls})`);
        }
    }
    // else: still loading (turn undefined/0) — keep waiting.

    if (polls >= MAX_POLLS) {
        console.log(`[settler-lens-turn-1] giving up after ${polls} polls (turn=${turn})`);
        stop();
    }
}

// Begin immediately; the loop tolerates Game / the lens system not being ready yet.
timer = setInterval(tick, POLL_MS);
tick();
