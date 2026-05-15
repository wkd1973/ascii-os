# ascii-os
ASCII operating system for interactive developer identity.

## Current State

ASCII-OS is a CLI-first virtual filesystem with a web terminal wrapper. It features a classic dual-pane file manager (**ASCII-OS Commander**) and an interactive shell with retro boot animations and persistence.

## Command Surface

### Core filesystem commands
- `help`
- `ls`
- `cd`
- `open`
- `pwd`
- `cat`
- `tree`

### Shell and UX commands
- `aoc` (ASCII-OS Commander)
- `set` (Configuration)
- `clear`
- `reboot`
- `shutdown`
- `exit`
- `quit`
- `dir`
- `type`
- `ver`
- `date`
- `time`
- `whoami`
- `mode`
- `cga`
- `ega`
- `vga`
- `prompt`
- `guide`
- `home`
- `projects`
- `project <slug>`
- `about`
- `cv`

Use `help` inside the shell for the current user-facing overview.

## Run Web

- `npm run start:web`
- open `http://localhost:3000`

## Run App Container

- `docker build -f Dockerfile.app -t ascii-os .`
- `docker run --rm -p 3000:3000 ascii-os`
- open `http://localhost:3000`

## Roadmap

- see [NEXT_STEPS.md](/workspace/NEXT_STEPS.md)

## Content

- see [CONTENT_GUIDE.md](/workspace/CONTENT_GUIDE.md)

# wkd1973>
INITIALIZING ASCII-OS...

LOADING IDENTITY MODULE

LOADING FILE SYSTEM

ACCESS GRANTED
