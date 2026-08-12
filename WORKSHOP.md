# Steam Workshop metadata — Auto Settler Lens on Turn 1

Copy-paste fields for publishing this mod to the Civilization VII Steam Workshop.

- **App:** Sid Meier's Civilization VII (App ID `1295660`)
- **Title:** `Auto Settler Lens on Turn 1`
- **Preview image:** `preview.png` (512×512, in this folder)
- **Visibility:** Public (or start Hidden to test, then flip to Public)
- **Suggested tags:** `UI`, `Quality of Life`

**Short description:**
> Automatically switches to the Settler lens at the start of turn 1, so you can see
> settlement recommendations the moment the game begins — no clicking the lens menu.

**Long description:**
> A tiny UI-only mod. On the first turn it activates the built-in **Settler lens**
> for you, then gets out of the way — you can change lenses normally afterward.
>
> - Fires only on turn 1 (loading a later save does nothing).
> - No gameplay or database changes; safe to add or remove any time.
> - Does not affect saved games.

## Publishing on Windows (official Modding SDK / ModBuddy)

1. In Steam, install **Sid Meier's Civilization VII — Modding SDK / Development
   Tools** (Library ▸ filter by *Tools*), then launch it.
2. Open/import this mod folder (the one containing `settler-lens-turn-1.modinfo`).
3. Use the SDK's **Publish to Steam Workshop** action; paste the title/description
   above, set the preview image to `preview.png`, choose tags and visibility.
4. First publish creates the item and assigns it a Workshop ID; later re-publishes
   from the same project update that same item.

## Alternative: steamcmd (scriptable, works on Linux too)

Edit the absolute paths in `workshop_item.vdf`, then:

```
steamcmd +login <your_steam_login> +workshop_build_item /abs/path/workshop_item.vdf +quit
```

The first run prints a `publishedfileid` — put it back into the `.vdf` so future
runs update the same item instead of creating a duplicate.

> Note: the game ignores non-referenced files, so `preview.png`, `README.md`,
> `WORKSHOP.md`, and `workshop_item.vdf` shipping alongside the mod are harmless.
