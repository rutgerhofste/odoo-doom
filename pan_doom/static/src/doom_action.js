import { Component, onMounted, onWillUnmount, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { TouchControls } from "./touch_controls";

const WASM_URL = "/pan_doom/static/lib/doom/doom.wasm";
const WIDTH = 640;
const HEIGHT = 400;

// Browser keyCode -> Doom key code (doomkeys.h).
function doomKey(code) {
    switch (code) {
        case 8: return 127; // backspace
        case 17: return 157; // ctrl: fire
        case 18: return 184; // alt: strafe
        case 37: return 172; // left
        case 38: return 173; // up
        case 39: return 174; // right
        case 40: return 175; // down
    }
    if (code >= 65 && code <= 90) return code + 32; // letters, lower case
    if (code >= 112 && code <= 123) return code + 75; // F1-F12
    return code;
}

export class DoomAction extends Component {
    static template = "pan_doom.DoomAction";
    static props = { ...standardActionServiceProps };
    static components = { TouchControls };

    setup() {
        this.canvasRef = useRef("canvas");
        this.frame = null;
        this.send = () => {}; // until the game has loaded
        this.isTouch = window.matchMedia("(pointer: coarse)").matches;
        this.key = (type, key) => this.send(type, key);
        onMounted(() => this.start());
        onWillUnmount(() => cancelAnimationFrame(this.frame));
    }

    async start() {
        const canvas = this.canvasRef.el;
        const ctx = canvas.getContext("2d");
        const memory = new WebAssembly.Memory({ initial: 108 });
        const noop = () => {};
        const bytes = await (await fetch(WASM_URL)).arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, {
            js: {
                js_console_log: noop,
                js_stdout: noop,
                js_stderr: noop,
                js_milliseconds_since_start: () => performance.now(),
                js_draw_screen: (ptr) => {
                    const pixels = new Uint8ClampedArray(memory.buffer, ptr, WIDTH * HEIGHT * 4);
                    ctx.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
                },
            },
            env: { memory },
        });
        if (!canvas.isConnected) {
            return; // left the screen while loading
        }
        const { add_browser_event, main, doom_loop_step } = instance.exports;
        this.send = add_browser_event;
        // Keys stay on the canvas, so Odoo's own shortcuts never see them.
        const onKey = (type) => (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            add_browser_event(type, doomKey(ev.keyCode));
        };
        canvas.addEventListener("keydown", onKey(0));
        canvas.addEventListener("keyup", onKey(1));
        canvas.focus();

        main();
        const step = () => {
            doom_loop_step();
            this.frame = requestAnimationFrame(step);
        };
        this.frame = requestAnimationFrame(step);
    }
}

registry.category("actions").add("pan_doom.doom", DoomAction);
