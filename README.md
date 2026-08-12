# Auto Settler Lens on Turn 1

A small UI mod for **Sid Meier's Civilization VII** that automatically activates the
built-in **Settler lens** at the start of the first turn, so you can immediately see
settlement recommendations without opening the lens menu.

## How it works

- The `.modinfo` registers a `game`-scoped UI script. It makes no gameplay or
  database changes (`AffectsSavedGames=0`), so it's safe to add or remove at any time.
- On turn 1, `ui/settler-lens-turn-1.js` finds the local player's city-founding unit
  and selects it with `UI.Player.selectUnit()`. In Antiquity that unit is
  **`UNIT_FOUNDER`** (`age-antiquity/data/advanced-start.xml`), not `UNIT_SETTLER`;
  `UNIT_SETTLER` and civ-unique replacements are matched too, via the `FoundCity` flag.
- **Selection comes first, the lens second.** In Civ VII the lens follows the
  selection: `INTERFACEMODE_UNIT_SELECTED` -> `setUnitLens()` maps `UNIT_FOUNDER` to
  `fxs-founder-lens` and other city-founding units to `fxs-settler-lens`, while
  `INTERFACEMODE_DEFAULT` deselects everything and returns to `fxs-default-lens`.
- **The Founder lens is the thing that looked like "the lens turned off".** It carries
  almost no layers — compare `founder-lens.js` with `settler-lens.js`, which enables
  appeal, resource, random-event, settlement-recommendation, yield and culture-border
  layers. So every selection of the founder wiped out a pre-set Settler lens.
- Once the unit is selected, the script asserts `fxs-settler-lens`, and then keeps a
  `lens-event-active-lens` listener alive for the rest of turn 1: any time the game
  swaps in `fxs-founder-lens`, it swaps the Settler lens back. Only the Founder lens is
  overridden, so a lens you pick yourself from the minimap is left alone.
- It stands down without touching anything if you have already selected some other
  unit, and the listener removes itself once turn 1 is over.

## Install

Copy the `settler-lens-turn-1` folder into your Mods directory:

- **Windows:** `%LOCALAPPDATA%\Firaxis Games\Sid Meier's Civilization VII\Mods\`
- **macOS:** `~/Library/Application Support/Civilization VII/Mods/`

Then enable **Auto Settler Lens on Turn 1** in the in-game Mods / Add-Ons menu.

## Troubleshooting

If the settler isn't selected or the lens doesn't switch, check `Logs/UI.log` for
messages prefixed with `[settler-lens-turn-1]` (the script logs via `console.error`
because plain `console.log` from a UI mod never reaches the log). The values most
likely to need adjustment for a given game version are the lens id
(`fxs-settler-lens`) and the interface mode name (`INTERFACEMODE_UNIT_SELECTED`).

## Structure

```
settler-lens-turn-1/
├── settler-lens-turn-1.modinfo
├── ui/
│   └── settler-lens-turn-1.js
└── README.md
```
