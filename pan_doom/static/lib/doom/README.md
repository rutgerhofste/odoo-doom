# doom.wasm.gz

Doom compiled to WebAssembly, with the shareware episode (`doom1.wad`) built in, gzipped.

| | |
|---|---|
| Source | [diekmann/wasm-fizzbuzz, `doom/`](https://github.com/diekmann/wasm-fizzbuzz/tree/gh-pages/doom) (the build and its source) |
| Taken from | npm package [`wasm-doom` 1.2.0](https://www.npmjs.com/package/wasm-doom), file `wasm/doom.wasm`, unchanged |
| sha256 of `doom.wasm` | `568bb18489f9071957f133d7d12ed6d753dfd27a62733442fd80261a217df3f1` |
| sha256 of this `.gz` | `b9115049ce32e4e281b3c8e40f969d52026f4df07b5683257c3bc84b816bf7ba` |
| Engine license | GNU GPL, version 2 or later (id Software's Doom source); distributed here under GPL-3.0 |
| Game data | `doom1.wad`, the unmodified shareware episode by id Software. It may be passed on for free and never sold. |

To check or rebuild it:

```sh
npm pack wasm-doom@1.2.0 && tar xzf wasm-doom-1.2.0.tgz
sha256sum package/wasm/doom.wasm
gzip -9 -n -c package/wasm/doom.wasm > doom.wasm.gz
```

The engine can only reach what the page gives it: drawing a frame, the clock, and three log lines.
