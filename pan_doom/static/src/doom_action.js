import { Component, onMounted, onWillUnmount, useRef, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { standardActionServiceProps } from "@web/webclient/actions/action_service";
import { doomKey } from "./keys";
import { TouchControls } from "./touch_controls";

// Gzipped (2.2 MB instead of 6.8 MB); Odoo serves it as is and we unpack it here.
const WASM_URL = "/pan_doom/static/lib/doom/doom.wasm.gz";
const MEMORY_PAGES = 108; // at least the env.memory minimum (102) of this doom.wasm build
const WIDTH = 640;
const HEIGHT = 400;

// A reason we can say to the player as it is.
class GameError extends Error {}

export class DoomAction extends Component {
    static template = "pan_doom.DoomAction";
    static props = { ...standardActionServiceProps };
    static components = { TouchControls };

    setup() {
        this.canvasRef = useRef("canvas");
        // loading | playing | ended | failed
        this.state = useState({ status: "loading", message: "Loading the game…" });
        this.isTouch = window.matchMedia("(pointer: coarse)").matches;
        this.frame = null;
        this.abort = null;
        this.send = () => {}; // until the game has loaded
        this.key = (type, key) => this.send(type, key);
        this.held = new Set(); // keyboard keys that are down
        this.releaseKeys = () => {
            for (const key of this.held) {
                this.send(1, key);
            }
            this.held.clear();
        };
        const onVisibility = () => document.hidden && this.releaseKeys();
        onMounted(() => {
            window.addEventListener("blur", this.releaseKeys);
            document.addEventListener("visibilitychange", onVisibility);
            this.start();
        });
        onWillUnmount(() => {
            window.removeEventListener("blur", this.releaseKeys);
            document.removeEventListener("visibilitychange", onVisibility);
            this.stop();
            this.abort?.abort();
        });
    }

    async start() {
        Object.assign(this.state, { status: "loading", message: "Loading the game…" });
        const abort = new AbortController();
        this.abort = abort;
        let lastError = "";
        let stderr = ""; // Doom prints one line in several pieces
        try {
            if (typeof WebAssembly !== "object") {
                throw new GameError("This browser has WebAssembly turned off, so the game cannot run here.");
            }
            if (typeof DecompressionStream !== "function") {
                throw new GameError("This browser is too old to unpack the game. Update it and try again.");
            }
            const canvas = this.canvasRef.el;
            const ctx = canvas.getContext("2d", { alpha: false });
            const memory = new WebAssembly.Memory({ initial: MEMORY_PAGES });
            const text = (ptr, len) => new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));
            const imports = {
                js: {
                    js_console_log: (ptr, len) => console.debug("[doom]", text(ptr, len)),
                    js_stdout: (ptr, len) => console.debug("[doom]", text(ptr, len)),
                    // Doom writes its start-up lines to stderr too; only I_Error starts with "Error".
                    js_stderr: (ptr, len) => {
                        stderr += text(ptr, len);
                        let end;
                        while ((end = stderr.indexOf("\n")) >= 0) {
                            const line = stderr.slice(0, end).trim();
                            stderr = stderr.slice(end + 1);
                            if (/^error/i.test(line)) {
                                lastError = line;
                                console.error("[doom]", line);
                            } else if (line) {
                                console.debug("[doom]", line);
                            }
                        }
                    },
                    js_milliseconds_since_start: () => performance.now(),
                    // A fresh view each frame: memory.buffer is replaced when the game grows it.
                    js_draw_screen: (ptr) => {
                        const pixels = new Uint8ClampedArray(memory.buffer, ptr, WIDTH * HEIGHT * 4);
                        ctx.putImageData(new ImageData(pixels, WIDTH, HEIGHT), 0, 0);
                    },
                },
                env: { memory },
            };
            let response;
            try {
                response = await fetch(WASM_URL, { signal: abort.signal });
            } catch (err) {
                if (abort.signal.aborted) throw err;
                throw new GameError(`The game could not be downloaded: ${err.message}. Check your connection and try again.`);
            }
            if (!response.ok) {
                throw new GameError(`The game could not be downloaded (HTTP ${response.status}).`);
            }
            const wasm = new Response(response.body.pipeThrough(new DecompressionStream("gzip")), {
                headers: { "Content-Type": "application/wasm" },
            });
            const { instance } = await WebAssembly.instantiateStreaming(wasm, imports);
            if (!canvas.isConnected) {
                return; // left the screen while loading
            }
            const { add_browser_event, main, doom_loop_step } = instance.exports;
            this.send = add_browser_event;
            Object.assign(this.state, { status: "playing", message: "" });
            canvas.focus();
            main();
            const step = () => {
                try {
                    doom_loop_step();
                } catch (err) {
                    // Quit Game ends the engine with a trap too; only a crash leaves a message.
                    if (/^error/i.test(stderr.trim())) {
                        lastError = stderr.trim(); // the last line had no newline yet
                    }
                    if (lastError) {
                        console.error("ODooM:", err);
                    }
                    this.end(lastError ? `The game stopped: ${lastError}` : "You quit the game.");
                    return;
                }
                this.frame = requestAnimationFrame(step);
            };
            this.frame = requestAnimationFrame(step);
        } catch (err) {
            if (abort.signal.aborted) {
                return; // left the screen while loading
            }
            const message = err instanceof GameError ? err.message : `The game could not start: ${err.message}`;
            console.error("ODooM:", err);
            Object.assign(this.state, { status: "failed", message });
        }
    }

    stop() {
        cancelAnimationFrame(this.frame);
        this.releaseKeys();
        this.send = () => {};
    }

    end(message) {
        this.stop();
        Object.assign(this.state, { status: "ended", message });
    }

    restart() {
        if (this.state.status === "ended" || this.state.status === "failed") {
            this.start();
        }
    }

    onKey(ev, type) {
        const key = doomKey(ev.keyCode);
        if (key === null) {
            return; // the browser keeps keys the game has no use for
        }
        if (type === 1) {
            // Always release what went down, whatever else is held now (Cmd on a Mac).
            if (this.held.delete(key)) {
                ev.preventDefault();
                ev.stopPropagation();
                this.send(1, key);
            }
            return;
        }
        // Not while the end screen shows, nor Cmd shortcuts, nor Shift+Tab: the
        // keyboard way out of the game and to its Play again button.
        if (this.state.status !== "playing" || ev.metaKey || (ev.key === "Tab" && ev.shiftKey)) {
            return;
        }
        // Keys stay on the canvas, so Odoo's own shortcuts never see them.
        ev.preventDefault();
        ev.stopPropagation();
        this.held.add(key);
        this.send(0, key);
    }
}

registry.category("actions").add("pan_doom.doom", DoomAction);
