# ASCII-OS Portfolio — Podsumowanie

## 1. Cel projektu
ASCII-OS został ustawiony jako interaktywne portfolio CLI (a nie pełny OS), gdzie użytkownik eksploruje profil i projekty jak system plików.

## 2. Co zostało wdrożone

### Kernel i CLI
- Minimalny kernel komend: `help`, `ls`, `cd`, `open`, `pwd`, `exit`
- REPL CLI z parserem argumentów (obsługa cudzysłowów i spacji w nazwach)
- `cwd` trzymane w `engine/state.ts` jako źródło prawdy

### UX / OS feel layer (bez zmiany kernela)
- Prompt: `ascii-os:[cwd]>`
- Boot sequence:
  - `BOOTING ASCII-OS PORTFOLIO...`
  - `LOADING CONTENT FROM /content/data...`
  - `INITIALIZING USER SESSION...`
  - `WELCOME, OPERATOR`
- MOTD po starcie z `content/data/system/motd.txt`
- Prefixy outputu:
  - `[OK]` sukces
  - `[ERR]` błąd
  - `[INFO]` informacje
- ANSI kolory:
  - zielony: sukces
  - czerwony: błąd
  - niebieski: info

### Alias flow portfolio
- `home` -> przejście do `/home`
- `projects` -> przejście do `/projects` + listing slugów
- `project <slug>` -> otwarcie `/projects/<slug>/index.txt`
- `about` -> otwarcie `/about/index.txt`
- `cv` -> otwarcie `/cv/index.txt`
- `guide` -> szybki onboarding komend

## 3. Źródło danych portfolio
- Fizyczny skan katalogu: `content/data`
- Loader buduje in-memory drzewo FS z plików na dysku
- `content/fs.ts` pozostawiony jako fallback

Mapowanie:
- `content/data/home` -> `/home`
- `content/data/projects` -> `/projects`
- `content/data/about` -> `/about`
- `content/data/cv` -> `/cv`
- `content/data/system/motd.txt` -> `/system/motd.txt`

## 4. Struktura contentu (aktualna)
- `content/data/home/index.txt` (landing)
- `content/data/home/identity.txt`
- `content/data/home/file name.txt`
- `content/data/projects/ascii-os/index.txt` (szablon projektu)
- `content/data/about/index.txt`
- `content/data/cv/index.txt`
- `content/data/system/motd.txt`

## 5. Testy i stabilność
- Testy jednostkowe oparte o `node:test` + `node:assert` (bez dodatkowych zależności)
- Zakres testów:
  - `engine/path.ts`
  - `engine/commands.ts`
- Status: testy przechodzą (`npm test` -> 9/9)

## 6. Jak uruchomić
```bash
npm install
npm start
```

Przykładowy flow:
```txt
guide
projects
project ascii-os
about
cv
```

## 7. Najbliższe sensowne kroki
1. Dodać kolejne projekty jako slugi w `content/data/projects/<slug>/index.txt`
2. Ujednolicić format wszystkich opisów projektów (Name, Description, Stack, Role, Link, Status)
3. Dodać testy warstwy UX aliasów (`guide`, `projects`, `project <slug>`)

## 8. Changelog Per Commit (README-ready)
```md
## Changelog

### feat(kernel): bootstrap TypeScript CLI kernel
- Added minimal command engine with `help`, `ls`, `cd`, `open`, `exit`
- Added REPL loop and command dispatcher
- Added in-memory starter filesystem

### feat(kernel): stabilize state and command flow
- Added `pwd` command
- Ensured `cwd` is managed in `engine/state.ts` as source of truth
- Added argument parsing support for quoted values in CLI input

### test(kernel): add deterministic unit tests
- Added tests for `engine/path.ts` (absolute/relative paths, `.`, `..`, missing nodes)
- Added tests for `engine/commands.ts` (`cd`, `ls`, `open`, `pwd`)
- Added `npm test` script with Node built-in test runner

### feat(content): enable physical content scan
- Added disk loader for `content/data`
- Wired state initialization to load from disk with fallback to in-memory tree
- Added initial physical content files for `home`, `projects`, `system`

### feat(ux): portfolio boot and terminal presentation layer
- Added portfolio boot sequence and MOTD display
- Updated prompt to `ascii-os:[cwd]>`
- Added `[OK]`, `[ERR]`, `[INFO]` output prefixes with ANSI colors

### feat(ux): add portfolio navigation aliases
- Added aliases: `home`, `projects`, `about`, `cv`, `guide`
- Set startup flow to boot -> MOTD -> `/home`
- Extended help output with portfolio shortcuts

### feat(content): standardize project structure and navigation
- Migrated projects to `content/data/projects/<slug>/index.txt`
- Added `project <slug>` alias for direct project card opening
- Added `content/data/home/index.txt` landing page
```
