import { Component, useRef, useState } from "@odoo/owl";

const UP = 173;
const DOWN = 175;
const LEFT = 172;
const RIGHT = 174;
const FIRE = 157; // ctrl
const ENTER = 13;
const USE = 32; // space
const ESC = 27;
const DEAD_ZONE = 14; // px the thumb moves before the stick counts
const STICK_RANGE = 48; // px the knob travels

// Controls the way mobile shooters lay them out: a joystick wherever the
// left thumb lands, a big fire button and a smaller use button on the right.
export class TouchControls extends Component {
    static template = "pan_doom.TouchControls";
    static props = { onKey: Function };

    setup() {
        this.layer = useRef("layer");
        this.stick = useState({ active: false, x: 0, y: 0, dx: 0, dy: 0 });
        this.stickPointer = null;
        this.stickKeys = new Set();
        this.fullscreenTried = false;
    }

    // First touch: take the whole screen and turn sideways where the browser lets us.
    async goFullscreen() {
        if (this.fullscreenTried) {
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
        if (this.stickPointer !== null) {
            return;
        }
        this.goFullscreen();
        this.stickPointer = ev.pointerId;
        ev.currentTarget.setPointerCapture(ev.pointerId);
        Object.assign(this.stick, { active: true, x: ev.clientX, y: ev.clientY, dx: 0, dy: 0 });
    }

    stickMove(ev) {
        if (ev.pointerId !== this.stickPointer) {
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
        if (dy < -DEAD_ZONE) held.add(UP);
        if (dy > DEAD_ZONE) held.add(DOWN);
        if (dx < -DEAD_ZONE) held.add(LEFT);
        if (dx > DEAD_ZONE) held.add(RIGHT);
        this.setStickKeys(held);
    }

    stickEnd(ev) {
        if (ev.pointerId !== this.stickPointer) {
            return;
        }
        this.stickPointer = null;
        this.stick.active = false;
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

    // Fire also sends Enter, so the same button picks menu items.
    press(ev, type, name) {
        ev.preventDefault();
        ev.stopPropagation();
        if (type === 0) {
            this.goFullscreen();
        }
        const keys = { fire: [FIRE, ENTER], use: [USE], menu: [ESC] }[name];
        for (const key of keys) {
            this.props.onKey(type, key);
        }
        ev.currentTarget.classList.toggle("active", type === 0);
    }

    close() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        history.back();
    }
}
