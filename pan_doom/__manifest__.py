{
    "name": "Doom",
    "summary": "Play Doom inside Odoo",
    "description": "The shareware episode of Doom, running as WebAssembly in an Odoo menu.",
    "version": "19.0.1.0.0",
    "category": "Hidden",
    "author": "Pantalytics B.V.",
    "website": "https://pantalytics.com",
    "license": "GPL-2 or any later version",
    "depends": ["web"],
    "data": ["views/doom_menus.xml"],
    "assets": {
        "web.assets_backend": ["pan_doom/static/src/**/*"],
    },
    "application": True,
    "installable": True,
}
