# odoo-doom

Doom in Odoo 19. One menu item, the shareware episode, running as WebAssembly in the browser.

![Doom in Odoo](pan_doom/static/description/screenshot.png)

## Install

Put `pan_doom/` on your addons path and install the **Doom** app. Open it from the app menu.
Click the screen, then: arrows move, Ctrl fires, Space opens doors, Enter selects, Esc opens the menu.

No sound: the engine build has no audio.

## How it works

`pan_doom/static/lib/doom/doom.wasm` is Doom compiled to WebAssembly, with the shareware
`doom1.wad` built in. An OWL client action (`static/src/doom_action.js`, about 80 lines) loads it,
draws each frame on a canvas and passes key presses from the canvas to the game, so Odoo's own
shortcuts stay out of the way.

## Credits and licenses

- Doom engine: id Software, GPL-2.0 or later.
- WebAssembly build: [diekmann/wasm-fizzbuzz](https://github.com/diekmann/wasm-fizzbuzz),
  taken from the [wasm-doom](https://www.npmjs.com/package/wasm-doom) npm package (v1.2.0).
- Shareware episode (`doom1.wad`, inside the wasm): id Software, under the Doom shareware terms.
- The module itself: Pantalytics B.V., GPL-2.0 or later.

Doom is a trademark of id Software. This project has no connection to id Software or Bethesda.
