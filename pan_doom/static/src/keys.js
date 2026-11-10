// Doom's own key codes (doomkeys.h) and the browser keys that map to them.

export const KEY = {
    RIGHT: 174,
    LEFT: 172,
    UP: 173,
    DOWN: 175,
    FIRE: 157, // ctrl
    STRAFE: 184, // alt
    RUN: 182, // shift
    USE: 32, // space
    ENTER: 13,
    ESC: 27,
    YES: 121, // "y" answers Doom's yes/no questions
};

// Browser keyCodes that are not plain ASCII. Without this table "," and "."
// (Doom's default strafe keys) would arrive as Doom's F2 and F4 and open the
// Save and Sound menus.
const BY_CODE = {
    8: 127, // backspace
    9: 9, // tab: automap
    13: KEY.ENTER,
    16: KEY.RUN,
    17: KEY.FIRE,
    18: KEY.STRAFE,
    19: 255, // pause
    27: KEY.ESC,
    32: KEY.USE,
    37: KEY.LEFT,
    38: KEY.UP,
    39: KEY.RIGHT,
    40: KEY.DOWN,
    59: 59, // ; (Firefox)
    61: 61, // = (Firefox)
    173: 45, // - (Firefox)
    186: 59, // ;
    187: 61, // =
    188: 44, // ,
    189: 45, // -
    190: 46, // .
    191: 47, // /
    107: 61, // numpad +: bigger screen, automap zoom in
    109: 45, // numpad -: smaller screen, automap zoom out
    192: 96, // `
    219: 91, // [
    220: 92, // \
    221: 93, // ]
    222: 39, // '
};

// The Doom key for a browser keyCode, or null when the game has no use for it
// and the browser should keep it (F5 reload, F11 full screen, F12 dev tools).
export function doomKey(code) {
    if (code in BY_CODE) return BY_CODE[code];
    if (code >= 48 && code <= 57) return code; // digits: weapons
    if (code >= 65 && code <= 90) return code + 32; // letters, lower case
    if (code >= 96 && code <= 105) return code - 48; // numpad digits
    if (code >= 112 && code <= 115) return code + 75; // F1-F4
    if (code >= 117 && code <= 121) return code + 75; // F6-F10
    return null;
}
