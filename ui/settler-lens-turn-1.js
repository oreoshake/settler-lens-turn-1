// Auto Settler Lens on Turn 1
//
// Activates the built-in Settler lens at the start of the first turn.
//
// Strategy: the engine reliably sets "fxs-default-lens" once, when the world view
// opens on turn 1 (interface-mode-default). Rather than race that call with our
// own timer, we WRAP LensManager.setActiveLens and redirect that first default-lens
// activation into the Settler lens. This rides the exact call path that already
// works and sticks. A short poll backs it up in case the engine set the default
// lens before turn 1 (so there is no turn-1 default-set for the wrapper to catch).
//
// Diagnostics use console.error on purpose: plain console.log from a UI mod is not
// written to the game logs, but console.error is (look for the [settler-lens-turn-1]
// prefix in Logs/UI.log).

import LensManager from '/core/ui/lenses/lens-manager.js';

const SETTLER = 'fxs-settler-lens';
const DEFAULT = 'fxs-default-lens';
const TAG = '[settler-lens-turn-1]';

function log(msg) {
    console.error(`${TAG} ${msg}`);
}

log(`module loaded (turn=${typeof Game !== 'undefined' ? Game.turn : 'n/a'})`);

// Keep a direct handle to the real implementation before we wrap it.
const rawSetActiveLens = LensManager.setActiveLens.bind(LensManager);

// 1) Redirect the engine's initial default-lens activation on turn 1 -> Settler.
let redirected = false;
LensManager.setActiveLens = function (type) {
    if (!redirected && type === DEFAULT && typeof Game !== 'undefined' && Game.turn === 1) {
        redirected = true;
        log(`redirecting initial '${DEFAULT}' -> '${SETTLER}' on turn 1`);
        return rawSetActiveLens(SETTLER);
    }
    return rawSetActiveLens(type);
};

// 2) Backup: proactively assert the Settler lens on turn 1 until it holds.
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

    if (turn != null && turn > 1) {
        log(`turn ${turn} > 1; stop`);
        return stop();
    }
    if (turn === 1) {
        let active;
        try {
            active = LensManager.getActiveLens();
        } catch (e) {
            active = undefined;
        }
        if (active === SETTLER) {
            if (++stable >= 2) {
                log(`settler active and stable (poll ${polls}); done`);
                return stop();
            }
        } else {
            stable = 0;
            const ok = rawSetActiveLens(SETTLER);
            log(`assert settler (was='${active}', ok=${ok}, poll=${polls})`);
        }
    }

    if (polls >= 120) {
        log(`giving up after ${polls} polls (turn=${turn})`);
        stop();
    }
}

timer = setInterval(tick, 300);
tick();
