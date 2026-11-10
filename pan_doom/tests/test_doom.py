from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class TestDoom(HttpCase):
    def test_menu_opens_the_game(self):
        menu = self.env.ref("pan_doom.menu_doom_root")
        self.assertEqual(menu.action.tag, "pan_doom.doom")

    def test_wasm_is_served(self):
        res = self.url_open("/pan_doom/static/lib/doom/doom.wasm")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.content[:4], b"\0asm")
