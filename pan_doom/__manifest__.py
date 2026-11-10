{
    "name": "ODooM",
    "summary": "Unofficial fan project: play DOOM shareware inside Odoo",
    "description": "Unofficial, non-commercial fan project. The shareware episode of DOOM, running as "
        "WebAssembly in an Odoo menu. DOOM is a trademark of id Software; no rights claimed.",
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
