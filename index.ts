import "@xterm/xterm/css/xterm.css";
import type { Instance } from "@wasmer/sdk";
import { Terminal } from "@xterm/xterm";
import { WebglAddon } from '@xterm/addon-webgl';

// What is this? Why is it needed? Without it the init fails.
// @ts-ignore
import WasmModule from "@wasmer/sdk/wasm?url";

async function main() {
    const { Directory, Wasmer, init } = await import("@wasmer/sdk");

    // const log = "trace";
    const log = undefined;
    await init({ log, module: WasmModule });

    const term = new Terminal({
        rows: 30,
        cols: 81,
        scrollback: 0,
        fontFamily: "Fira Mono, DejaVu Sans Mono, Noto Sans Mono, monospace",
        lineHeight: 1.0,
        cursorBlink: false,
        cursorStyle: "underline",
        convertEol: true,
        theme: {
            cursor: '#000000',
            foreground: '#FFFFFF',
            red: '#B71234',
            green: '#009B48',
            yellow: '#FF5800',
            blue: '#0046AD',
            brightYellow: '#FFD500',
            brightWhite: '#FFFFFF',
            white: '#000000',
            black: '#666666'
        }
    });
    term.open(document.getElementById("terminal")!);
    // Without this, there are gaps between the block characters.
    term.loadAddon(new WebglAddon());

    // Focus the terminal:
    setTimeout(() => term.focus(), 50);

    term.writeln("Loading...");
    const pkg = await Wasmer.fromRegistry("python/python");
    const home = new Directory();
    await home.writeFile("main.py", main_py);
    await home.createDir("termcolor");
    await home.writeFile("termcolor/__init__.py", termcolor_init);
    await home.writeFile("termcolor/_types.py", termcolor_types);
    await home.writeFile("termcolor/termcolor.py", termcolor_py);

    term.writeln("Starting...");
    const instance = await pkg.entrypoint!.run({ args: ["main.py"], mount: { "/home": home }, cwd: "/home" });
    connectStreams(instance, term);
}

const encoder = new TextEncoder();

function connectStreams(instance: Instance, term: Terminal) {
    const stdin = instance.stdin?.getWriter();
    term.onData(data => stdin?.write(encoder.encode(data)));
    instance.stdout.pipeTo(new WritableStream({ write: chunk => term.write(chunk) }));
    instance.stderr.pipeTo(new WritableStream({ write: chunk => term.write(chunk) }));
}

const termcolor_init = `
"""ANSI color formatting for output in terminal."""

from __future__ import annotations

from termcolor.termcolor import ATTRIBUTES, COLORS, HIGHLIGHTS, RESET, colored, cprint

__all__ = [
    "ATTRIBUTES",
    "COLORS",
    "HIGHLIGHTS",
    "RESET",
    "colored",
    "cprint",
]
`;
const termcolor_types = `
from __future__ import annotations

from typing import Literal

Attribute = Literal[
    "bold",
    "dark",
    "underline",
    "blink",
    "reverse",
    "concealed",
    "strike",
]

Highlight = Literal[
    "on_black",
    "on_grey",
    "on_red",
    "on_green",
    "on_yellow",
    "on_blue",
    "on_magenta",
    "on_cyan",
    "on_light_grey",
    "on_dark_grey",
    "on_light_red",
    "on_light_green",
    "on_light_yellow",
    "on_light_blue",
    "on_light_magenta",
    "on_light_cyan",
    "on_white",
]

Color = Literal[
    "black",
    "grey",
    "red",
    "green",
    "yellow",
    "blue",
    "magenta",
    "cyan",
    "light_grey",
    "dark_grey",
    "light_red",
    "light_green",
    "light_yellow",
    "light_blue",
    "light_magenta",
    "light_cyan",
    "white",
]
`;
const termcolor_py = `
# Copyright (c) 2008-2011 Volvox Development Team
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
# Author: Konstantin Lepa <konstantin.lepa@gmail.com>

"""ANSI color formatting for output in terminal."""

from __future__ import annotations

import io
import os
import sys
import warnings
from collections.abc import Iterable
from typing import Any

from ._types import Attribute, Color, Highlight


def __getattr__(name: str) -> list[str]:
    if name == "__ALL__":
        warnings.warn(
            "__ALL__ is deprecated and will be removed in termcolor 3. "
            "Use __all__ instead.",
            DeprecationWarning,
            stacklevel=2,
        )
        return ["colored", "cprint"]
    msg = f"module '{__name__}' has no attribute '{name}'"
    raise AttributeError(msg)


ATTRIBUTES: dict[Attribute, int] = {
    "bold": 1,
    "dark": 2,
    "underline": 4,
    "blink": 5,
    "reverse": 7,
    "concealed": 8,
    "strike": 9,
}

HIGHLIGHTS: dict[Highlight, int] = {
    "on_black": 40,
    "on_grey": 40,  # Actually black but kept for backwards compatibility
    "on_red": 41,
    "on_green": 42,
    "on_yellow": 43,
    "on_blue": 44,
    "on_magenta": 45,
    "on_cyan": 46,
    "on_light_grey": 47,
    "on_dark_grey": 100,
    "on_light_red": 101,
    "on_light_green": 102,
    "on_light_yellow": 103,
    "on_light_blue": 104,
    "on_light_magenta": 105,
    "on_light_cyan": 106,
    "on_white": 107,
}

COLORS: dict[Color, int] = {
    "black": 30,
    "grey": 30,  # Actually black but kept for backwards compatibility
    "red": 31,
    "green": 32,
    "yellow": 33,
    "blue": 34,
    "magenta": 35,
    "cyan": 36,
    "light_grey": 37,
    "dark_grey": 90,
    "light_red": 91,
    "light_green": 92,
    "light_yellow": 93,
    "light_blue": 94,
    "light_magenta": 95,
    "light_cyan": 96,
    "white": 97,
}


RESET = "\\033[0m"


def _can_do_colour(
    *, no_color: bool | None = None, force_color: bool | None = None
) -> bool:
    """Check env vars and for tty/dumb terminal"""
    # First check overrides:
    # "User-level configuration files and per-instance command-line arguments should
    # override $NO_COLOR. A user should be able to export $NO_COLOR in their shell
    # configuration file as a default, but configure a specific program in its
    # configuration file to specifically enable color."
    # https://no-color.org
    if no_color is not None and no_color:
        return False
    if force_color is not None and force_color:
        return True

    # Then check env vars:
    if "ANSI_COLORS_DISABLED" in os.environ:
        return False
    if "NO_COLOR" in os.environ:
        return False
    if "FORCE_COLOR" in os.environ:
        return True

    # Then check system:
    if os.environ.get("TERM") == "dumb":
        return False
    if not hasattr(sys.stdout, "fileno"):
        return False

    try:
        return os.isatty(sys.stdout.fileno())
    except io.UnsupportedOperation:
        return sys.stdout.isatty()


def colored(
    text: object,
    color: Color | None = None,
    on_color: Highlight | None = None,
    attrs: Iterable[Attribute] | None = None,
    *,
    no_color: bool | None = None,
    force_color: bool | None = None,
) -> str:
    """Colorize text.

    Available text colors:
        black, red, green, yellow, blue, magenta, cyan, white,
        light_grey, dark_grey, light_red, light_green, light_yellow, light_blue,
        light_magenta, light_cyan.

    Available text highlights:
        on_black, on_red, on_green, on_yellow, on_blue, on_magenta, on_cyan, on_white,
        on_light_grey, on_dark_grey, on_light_red, on_light_green, on_light_yellow,
        on_light_blue, on_light_magenta, on_light_cyan.

    Available attributes:
        bold, dark, underline, blink, reverse, concealed.

    Example:
        colored('Hello, World!', 'red', 'on_black', ['bold', 'blink'])
        colored('Hello, World!', 'green')
    """
    result = str(text)
    if not _can_do_colour(no_color=no_color, force_color=force_color):
        return result

    fmt_str = "\\033[%dm%s"
    if color is not None:
        result = fmt_str % (COLORS[color], result)

    if on_color is not None:
        result = fmt_str % (HIGHLIGHTS[on_color], result)

    if attrs is not None:
        for attr in attrs:
            result = fmt_str % (ATTRIBUTES[attr], result)

    result += RESET

    return result


def cprint(
    text: object,
    color: Color | None = None,
    on_color: Highlight | None = None,
    attrs: Iterable[Attribute] | None = None,
    *,
    no_color: bool | None = None,
    force_color: bool | None = None,
    **kwargs: Any,
) -> None:
    """Print colorized text.

    It accepts arguments of print function.
    """

    print(
        (
            colored(
                text,
                color,
                on_color,
                attrs,
                no_color=no_color,
                force_color=force_color,
            )
        ),
        **kwargs,
    )
`;

const main_py = `
#!/usr/bin/python3

from copy import deepcopy
from itertools import product
from math import ceil
import os
from random import choice
import sys
# WARNING: termcolor f1c08c36e33d1223062ce6c44f5ee2094eddbfe2 fixed missing black, but
# wsl still uses ancient 22.04 ubuntu, and the buggy version of termcolor will be around
# for decades apparently, thanks to Microsoft. So let's not use black, let's use grey!
from termcolor import colored, COLORS, HIGHLIGHTS
# Have to get rid of termcolor completely, buggy, API changing, piece of ...
COLORS['light_yellow'] = 93
COLORS['light_grey'] = 37
COLORS['white'] = 97
HIGHLIGHTS['on_light_grey'] = 47

import termios
import time
import tty

# By increasing stdout buffer, we reduce flickering, because only
# sys.stdout.flush will talk to the terminal in one big batch.
sys.stdout = open(1, "w", buffering = 10485760)

class ReadOrResize():
    def __init__(self):
        import signal
        import socket
        import selectors

        # Reopen stdin unbuffered binary, because otherwise if the user
        # is pressing buttons faster than the animation, then our selector
        # gets stuck.
        sys.stdin = os.fdopen(0, buffering=0, mode='rb')

        self.read, self.write = socket.socketpair()
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.read, selectors.EVENT_READ)
        self.selector.register(sys.stdin, selectors.EVENT_READ)
        self.handler = lambda _signal, _frame: self.tick()
        signal.signal(signal.SIGWINCH, self.handler)

    def tick(self):
        self.write.send(b'\\0')

    def readOrResize(self):
        for key, _ in self.selector.select():
            if key.fileobj == sys.stdin:
                return sys.stdin.read(1).decode('ascii')
            else:
                self.read.recv(1)
                return "resize"

def pr(str):
    print(str, end = '')

# Good VT100 description: http://www.braun-home.net/michael/info/misc/VT100_commands.htm
def cursorhome():
    pr(chr(27) + '[H')

def clearscreen():
    pr(chr(27) + '[2J')

def wrapoff():
    pr(chr(27) + '[?7l')

def wrapon():
    pr(chr(27) + '[?7h')

def strcursorleft(i):
    return chr(27) + f'[{i}D'

def nextline():
    # A very safe next line: go one line down and 1000 characters to the left.
    # But all these movement commands NEVER scroll (not even on the last line).
    # So we can accidentally overrun, and still no flickering of the screen.
    pr(chr(27) + '[1B' + chr(27) + '[1000D')

colors = {
    'W': 'white',
    'G': 'green',
    'O': 'yellow',
    'Y': 'light_yellow',
    'R': 'red',
    'B': 'blue',
    ' ': 'light_grey',
}

def colorchar(char, color):
    pr(colored(char, colors[chr(color)], 'on_light_grey'))

upside    = [(0, 3), (0, 4), (0, 5), (1, 5), (2, 5), (2,4), (2, 3), (1, 3)]
uprow     = [(3, x) for x in range(12)]
midrow    = [(4, x) for x in range(12)]
midcol    = [(y, 4) for y in range(9)] + [(5, 10), (4, 10), (3, 10)]
downrow   = [(5, x) for x in range(12)]
downside  = [(y + 6, x) for (y, x) in upside]
rightside = [(3, 6), (3, 7), (3, 8), (4, 8), (5, 8), (5, 7), (5, 6), (4, 6)]
rightcol  = [(y, 5) for y in range(9)] + [(5, 9), (4, 9), (3, 9)]
leftside  = [(y, x - 6) for (y, x) in rightside]
leftcol   = [(y, 3) for y in range(9)] + [(5, 11), (4, 11), (3, 11)]
frontside = [(3, 3), (3, 4), (3, 5), (4, 5), (5, 5), (5, 4), (5, 3), (4, 3)]
frontcirc = [(2, 3), (2, 4), (2, 5), (3, 6), (4, 6), (5, 6), (6, 5), (6, 4), (6, 3), (5, 2), (4, 2), (3, 2)]
backside  = [(y, x + 6) for (y, x) in frontside]
backcirc  = [(0, 3), (0, 4), (0, 5), (3, 8), (4, 8), (5, 8), (8, 5), (8, 4), (8, 3), (5, 0), (4, 0), (3, 0)]

class Cube:
    def __init__(self):
        self.my = 2
        self.anim = 0.05
        self.state = []
        self.steps = 0
        for i in range(3):
            self.state.append(bytearray(' ' * 3 + 'W' * 3 + ' ' * 6, encoding = 'ascii'))
        for i in range(3):
            self.state.append(bytearray('O' * 3 + 'G' * 3 + 'R' * 3 + 'B' * 3, encoding = 'ascii'))
        for i in range(3):
            self.state.append(bytearray(' ' * 3 + 'Y' * 3 + ' ' * 6, encoding = 'ascii'))

    # Very hacky API: if begin is True, we return a tuple, where the second item is how many tiles to skip from the cube
    def instruction(self, row, rowrepeat, begin):
        match row, rowrepeat, begin:
            case 3, 0, True:
                return 'u ', 0
            case 3, 0, False:
                return ' i'
            case (4, 0, True):
                return 'a ', 0
            case (4, 1, True):
                return '◀◀', 0
            case (4, 0, False):
                return ' d'
            case (4, 1, False):
                return '▶▶'
            case 5, 1, True:
                return 'j ', 0
            case 5, 1, False:
                return ' k'
            case 0, 0, True:
                msg = '  Front   - m '
                return msg, 2
            case 0, 1, True:
                msg = "  Front'  - n "
                return msg, 2
            case 0, 2, True:
                msg = '  Back    - 7 '
                return msg, 2
            case 1, 0, True:
                msg = "  Back'   - 8 "
                return msg, 2
            case 1, 2, True:
                msg = "  Sexy    - ouli    "
                return msg, 3
            case 2, 0, True:
                msg = "  Sexy'   - uoil    "
                return msg, 3
            case 6, 1, True:
                msg = '  Slower  - + '
                return msg, 2
            case 6, 2, True:
                msg = '  Faster  - - '
                return msg, 2
            case 7, 1, True:
                msg = '  Shuffle - N '
                return msg, 2
            case 7, 2, True:
                msg = '  Undo    - x '
                return msg, 2
            case 8, 2, True:
                msg = '  Quit    - Q '
                return msg, 2
            case _, _, True:
                return '  ', 0
            case _, _, False:
                return '  '

    def draw(self):
        w, h = os.get_terminal_size()
        dw, dh = 75, 30
        vpad = int((h - dh) / 2)
        hpad = ' ' * ceil((w - dw) / 2)
        cursorhome()
        for _ in range(vpad):
            pr(' ' * w)
            nextline()
        pr(hpad + colored('                     y/z  ▲ w ▲   o                                        ', 'grey', 'on_light_grey') + hpad)
        nextline()
        for ri in range(len(self.state)):
            r = self.state[ri]
            for repeat in range(3):
                instruction, instruction_skip = self.instruction(ri, repeat, True)
                pr(hpad + colored(instruction, 'grey', 'on_light_grey'))
                for c in r[instruction_skip:]:
                    if repeat == 0:
                        colorchar('▇▇▇▇▇ ', c)
                    if repeat == 1:
                        colorchar('█████ ', c)
                    if repeat == 2:
                        colorchar('▀▀▀▀▀ ', c)
                pr(strcursorleft(1) + colored(self.instruction(ri, repeat, False), 'grey', 'on_light_grey') + hpad)
                nextline()

        pr(hpad + colored(f'                      h   ▼ s ▼   l               {self.steps:4d} Steps   {f"Anim: {self.anim:.2f}s "}', 'grey', 'on_light_grey') + hpad)
        for _ in range(vpad + 1):
            nextline()
            pr(' ' * w)
        sys.stdout.flush()

    def rotatestate(self, how, howmuch, anim = True):
        newstate = deepcopy(self.state)
        for i in range(len(how)):
            y, x = how[i]
            y_, x_ = how[(i+howmuch) % len(how)]
            newstate[y][x] = self.state[y_][x_]
        self.state = newstate
        if anim:
            self.draw()
            if self.anim: time.sleep(self.anim)

    def up(self, mul = 1):
        self.steps += 1
        self.rotatestate(uprow, 1 * mul)
        for i in range(2):
            self.rotatestate(uprow, 1 * mul, False)
            self.rotatestate(upside, -1 * mul)

    def down(self, mul = 1):
        self.steps += 1
        self.rotatestate(downrow, -1 * mul)
        for i in range(2):
            self.rotatestate(downrow, -1 * mul, False)
            self.rotatestate(downside, -1 * mul)

    def right(self, mul = 1):
        self.steps += 1
        self.rotatestate(rightcol, 1 * mul)
        for i in range(2):
            self.rotatestate(rightcol, 1 * mul, False)
            self.rotatestate(rightside, -1 * mul)

    def left(self, mul = 1):
        self.steps += 1
        self.rotatestate(leftcol, 1 * mul)
        for i in range(2):
            self.rotatestate(leftcol, 1 * mul, False)
            self.rotatestate(leftside, 1 * mul)

    def front(self, mul = 1):
        self.steps += 1
        self.rotatestate(frontcirc, 1 * mul)
        for i in range(2):
            self.rotatestate(frontcirc, 1 * mul, False)
            self.rotatestate(frontside, 1 * mul)

    def back(self, mul = 1):
        self.steps += 1
        self.rotatestate(backcirc, 1 * mul)
        for i in range(2):
            self.rotatestate(backcirc, 1 * mul, False)
            self.rotatestate(backside, -1 * mul)

    def cuberight(self, mul = 1):
        for i in range(3):
            if i: self.rotatestate(upside, 1 * mul, False)
            if i: self.rotatestate(downside, -1 * mul, False)
            self.rotatestate(uprow, -1 * mul, False)
            self.rotatestate(midrow, -1 * mul, False)
            self.rotatestate(downrow, -1 * mul)

    def cubeup(self, mul = 1):
        for i in range(3):
            if i: self.rotatestate(leftside, 1 * mul, False)
            if i: self.rotatestate(rightside, -1 * mul, False)
            self.rotatestate(leftcol, 1 * mul, False)
            self.rotatestate(midcol, 1 * mul, False)
            self.rotatestate(rightcol, 1 * mul)

# cbreak mode means, that we read characters from the terminal wo waiting for newline
# Have to use termios.tcgetattr instead of trusting return of tty.setcbreak (python 3.12 is still too new).
tty_attrs = termios.tcgetattr(1)
tty.setcbreak(1)
clearscreen()
wrapoff()

try:
    readOrResize = ReadOrResize()
    cube = Cube()
    undo = []
    while True:
        cube.draw()
        key = readOrResize.readOrResize()
        match key:
            case 'x':
                if len(undo) >= 1:
                    cube.state = undo.pop()
                    cube.steps -= 1
            case 'Q':
                break
            case 'u':
                undo.append(cube.state)
                cube.up()
            case 'i':
                undo.append(cube.state)
                cube.up(-1)
            case 'k':
                undo.append(cube.state)
                cube.down()
            case 'j':
                undo.append(cube.state)
                cube.down(-1)
            case 'o':
                undo.append(cube.state)
                cube.right()
            case 'l':
                undo.append(cube.state)
                cube.right(-1)
            case 'y' | 'z':
                undo.append(cube.state)
                cube.left()
            case 'h':
                undo.append(cube.state)
                cube.left(-1)
            case 'n':
                undo.append(cube.state)
                cube.front()
            case 'm':
                undo.append(cube.state)
                cube.front(-1)
            case '7':
                undo.append(cube.state)
                cube.back()
            case '8':
                undo.append(cube.state)
                cube.back(-1)
            case 'd':
                cube.cuberight()
            case 'a':
                cube.cuberight(-1)
            case 'w':
                cube.cubeup()
            case 's':
                cube.cubeup(-1)
            case '+' | '=':
                cube.anim += 0.01
            case '-' | '_':
                cube.anim -= 0.01
                cube.anim = max(cube.anim, 0)
            case 'N':
                shuffle = list(product([cube.left, cube.front, cube.right, cube.up, cube.down, cube.back], [-1, 1, 2]))
                oldanim = cube.anim
                cube.anim = 0
                for s in range(100):
                    f, i = choice(shuffle)
                    f(i)
                cube.anim = oldanim
                undo = []
                cube.steps = 0

finally:
    # restore input buffering
    termios.tcsetattr(1, termios.TCSAFLUSH, tty_attrs)
    wrapon()
    sys.stdout.flush()
`

main().catch(console.error);
