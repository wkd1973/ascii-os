# ascii-os
ASCII operating system for interactive developer identity.

## Current State

ASCII-OS is a CLI-first virtual filesystem with a web terminal wrapper. The engine stays UI-agnostic; CLI and web layers add shell behavior, aliases, and presentation.

## Command Surface

### Core filesystem commands
- `help`
- `ls`
- `cd`
- `open`
- `pwd`
- `cat`
- `tree`
- `mkdir`
- `touch`
- `write`

### Shell and UX commands
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
