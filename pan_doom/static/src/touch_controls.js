import { Component, onMounted, onWillUnmount, useRef, useState } from "@odoo/owl";
import { KEY } from "./keys";

const DEAD_ZONE = 14; // px the thumb moves before the stick counts
const STICK_RANGE = 48; // px the knob travels

// Fire also answers yes and picks menu items, so touch needs no keyboard.
const BUTTONS = [
    { name: "fire", label: "Fire", keys: [KEY.FIRE, KEY.YES, KEY.ENTER] },
    { name: "use", label: "Open", keys: [KEY.USE] },
    { name: "menu", label: "Menu", keys: [KEY.ESC] },
];

// Controls the way mobile shooters lay them out: a joystick wherever the
// left thumb lands, a big fire button and a smaller use button on the right.
export class TouchControls extends Component {
    static template = "pan_doom.TouchControls";
    static props = { onKey: Function };
    static BUTTONS = BUTTONS;

    setup() {
        this.layer = useRef("layer");
        this.state = useState({ hint: true });
        this.stick = useState({ pointer: null, x: 0, y: 0, dx: 0, dy: 0 });
        this.stickKeys = new Set();
        this.pressed = new Set(); // buttons held down
        this.fullscreenTried = false;
        // iOS starts text selection and its Copy / Look Up menu on a long press;
        // only a non-passive touchstart that is cancelled stops it.
        const stopSelect = (ev) => ev.cancelable && ev.preventDefault();
        // Leaving the app mid-press does not always send pointercancel.
        const onVisibility = () => document.hidden && this.releaseAll();
        onMounted(() => {
            this.layer.el.addEventListener("touchstart", stopSelect, { passive: false });
            document.addEventListener("visibilitychange", onVisibility);
        });
        onWillUnmount(() => {
            this.layer.el.removeEventListener("touchstart", stopSelect);
            document.removeEventListener("visibilitychange", onVisibility);
        });
    }

    // Browsers only allow full screen on a finger lift, so try on the first one.
    async goFullscreen(ev) {
        if (this.fullscreenTried || ev.type === "pointercancel") {
            return;
        }
        this.fullscreenTried = true;
        try {
            await this.layer.el.requestFullscreen?.();
            await screen.orientation?.lock?.("landscape");
        } catch {
            // iPhone Safari has neither; the fixed layer already fills the screen.
        }
    }

    stickStart(ev) {
        if (this.stick.pointer !== null) {
            return;
        }
        ev.preventDefault();
        this.state.hint = false;
        ev.currentTarget.setPointerCapture(ev.pointerId);
        Object.assign(this.stick, { pointer: ev.pointerId, x: ev.clientX, y: ev.clientY, dx: 0, dy: 0 });
    }

    stickMove(ev) {
        if (ev.pointerId !== this.stick.pointer) {
            return;
        }
        let dx = ev.clientX - this.stick.x;
        let dy = ev.clientY - this.stick.y;
        const length = Math.hypot(dx, dy);
        if (length > STICK_RANGE) {
            dx = (dx / length) * STICK_RANGE;
            dy = (dy / length) * STICK_RANGE;
        }
        Object.assign(this.stick, { dx, dy });
        const held = new Set();
        if (dy < -DEAD_ZONE) held.add(KEY.UP);
        if (dy > DEAD_ZONE) held.add(KEY.DOWN);
        if (dx < -DEAD_ZONE) held.add(KEY.LEFT);
        if (dx > DEAD_ZONE) held.add(KEY.RIGHT);
        this.setStickKeys(held);
    }

    stickEnd(ev) {
        if (ev.pointerId !== this.stick.pointer) {
            return;
        }
        this.goFullscreen(ev);
        this.stick.pointer = null;
        this.setStickKeys(new Set());
    }

    setStickKeys(held) {
        for (const key of this.stickKeys) {
            if (!held.has(key)) this.props.onKey(1, key);
        }
        for (const key of held) {
            if (!this.stickKeys.has(key)) this.props.onKey(0, key);
        }
        this.stickKeys = held;
    }

    press(ev, type, button) {
        ev.preventDefault();
        ev.stopPropagation();
        if (type === 0) {
            this.state.hint = false;
        } else {
            this.goFullscreen(ev);
        }
        if ((type === 0) === this.pressed.has(button)) {
            return; // already in that state
        }
        if (type === 0) {
            this.pressed.add(button);
        } else {
            this.pressed.delete(button);
        }
        for (const key of button.keys) {
            this.props.onKey(type, key);
        }
        ev.currentTarget.classList.toggle("active", type === 0);
    }

    releaseAll() {
        this.stick.pointer = null;
        this.setStickKeys(new Set());
        for (const button of this.pressed) {
            for (const key of button.keys) {
                this.props.onKey(1, key);
            }
        }
        this.pressed.clear();
        for (const el of this.layer.el.querySelectorAll(".o_pan_doom_btn.active")) {
            el.classList.remove("active");
        }
    }

    close() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        window.location.assign("/odoo");
    }
}
