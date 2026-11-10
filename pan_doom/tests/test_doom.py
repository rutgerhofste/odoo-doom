import gzip
import hashlib

from odoo.tests import HttpCase, tagged

# The engine as published in wasm-doom 1.2.0 (see static/lib/doom/README.md).
WASM_SHA256 = "568bb18489f9071957f133d7d12ed6d753dfd27a62733442fd80261a217df3f1"


@tagged("post_install", "-at_install")
class TestDoom(HttpCase):
    def test_menu_opens_the_game(self):
        menu = self.env.ref("pan_doom.menu_doom_root")
        self.assertEqual(menu.action.tag, "pan_doom.doom")

    def test_wasm_is_the_published_engine(self):
        res = self.url_open("/pan_doom/static/lib/doom/doom.wasm.gz")
        self.assertEqual(res.status_code, 200)
        wasm = gzip.decompress(res.content)
        self.assertEqual(wasm[:4], b"\0asm")
        self.assertEqual(hashlib.sha256(wasm).hexdigest(), WASM_SHA256)

    def test_game_draws_a_frame(self):
        # Loads the backend bundle, opens the action and waits for a pixel that
        # is not black: a broken bundle, template or wasm import fails here.
        self.browser_js(
            "/odoo/action-pan_doom.action_doom",
            """
            const deadline = Date.now() + 20000;
            (function check() {
                const canvas = document.querySelector(".o_pan_doom_canvas");
                if (canvas) {
                    const data = canvas.getContext("2d").getImageData(0, 0, 640, 400).data;
                    if (data.some((v, i) => i % 4 !== 3 && v)) {
                        console.log("test successful");
                        return;
                    }
                }
                if (Date.now() > deadline) {
                    console.error("the game never drew a frame");
                    return;
                }
                setTimeout(check, 200);
            })();
            """,
            login="admin",
            timeout=60,
        )
