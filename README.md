# Auto Settler Lens on Turn 1

A small UI mod for **Sid Meier's Civilization VII** that automatically activates the
built-in **Settler lens** at the start of the first turn, so you can immediately see
settlement recommendations without opening the lens menu.

## How it works

- The `.modinfo` registers a `game`-scoped UI script. It makes no gameplay or
  database changes (`AffectsSavedGames=0`), so it's safe to add or remove at any time.
- `ui/settler-lens-turn-1.js` imports the game's `LensManager` and calls
  `LensManager.setActiveLens('fxs-settler-lens')`.
- It reacts to the `LocalPlayerTurnBegin` engine event, gated to `Game.turn === 1`,
  then unsubscribes so it never runs again. The switch is deferred with
  `setTimeout(0)` so it runs after the engine's own turn-start handling (otherwise
  the game can overwrite the lens choice). A load-time fallback covers the case where
  the script loads after turn 1 has already begun.

## Install

Copy the `settler-lens-turn-1` folder into your Mods directory:

- **Windows:** `%LOCALAPPDATA%\Firaxis Games\Sid Meier's Civilization VII\Mods\`
- **macOS:** `~/Library/Application Support/Civilization VII/Mods/`

Then enable **Auto Settler Lens on Turn 1** in the in-game Mods / Add-Ons menu.

## Troubleshooting

If the lens doesn't switch, open the UI console and look for messages prefixed with
`[settler-lens-turn-1]`. The two values most likely to need adjustment for a given
game version are the lens id (`fxs-settler-lens`) and the event name
(`LocalPlayerTurnBegin`).

## Structure

```
settler-lens-turn-1/
├── settler-lens-turn-1.modinfo
├── ui/
│   └── settler-lens-turn-1.js
└── README.md
```
