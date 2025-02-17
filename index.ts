import "@xterm/xterm/css/xterm.css"
import type { Instance } from "@wasmer/sdk"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"

// What is this? Why is it needed? Without it the init fails.
// @ts-ignore
import WasmModule from "@wasmer/sdk/wasm?url";

async function main() {
    const { Wasmer, init } = await import("@wasmer/sdk");

    await init({log: 'trace', module: WasmModule});

    const term = new Terminal({ cursorBlink: true, convertEol: true });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(document.getElementById("terminal")!);
    fit.fit();

    term.writeln("Loading...");

    const pkg = await Wasmer.fromRegistry("sharrattj/bash");
    term.writeln("Starting...");

    const instance = await pkg.entrypoint!.run();
    connectStreams(instance, term);
}

const encoder = new TextEncoder();

function connectStreams(instance: Instance, term: Terminal) {
    const stdin = instance.stdin?.getWriter();
    term.onData(data => stdin?.write(encoder.encode(data)));
    instance.stdout.pipeTo(new WritableStream({ write: chunk => term.write(chunk) }));
    instance.stderr.pipeTo(new WritableStream({ write: chunk => term.write(chunk) }));
}

main().catch(console.error);
