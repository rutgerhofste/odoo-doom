{
    "name": "ODooM",
    "summary": "Play the DOOM shareware episode inside Odoo, on desktop and mobile. Unofficial fan project.",
    "description": "Unofficial, non-commercial fan project. The shareware episode of DOOM, running as "
    "WebAssembly in an Odoo menu. DOOM is a trademark of id Software; no rights claimed.",
    "version": "19.0.1.2.0",
    "category": "Extra Tools",
    "author": "Pantalytics B.V.",
    "website": "https://github.com/rutgerhofste/odoo-doom",
    "license": "GPL-3",
    "depends": ["web"],
    "data": ["views/doom_menus.xml"],
    "assets": {
        "web.assets_backend": ["pan_doom/static/src/**/*"],
    },
    "images": [
        "static/description/banner.png",
        "static/description/desktop_screenshot.png",
        "static/description/mobile_screenshot.png",
    ],
    "application": True,
    "installable": True,
}
