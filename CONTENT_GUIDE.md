# ASCII-OS Content Guide

This project is designed so portfolio content lives under `content/data`.
The runtime loads this directory into the virtual filesystem.

## Content Layout

- `content/data/home/index.txt` - landing page shown after boot.
- `content/data/about/index.txt` - short professional profile.
- `content/data/cv/index.txt` - longer CV summary.
- `content/data/projects/index.txt` - general projects instructions.
- `content/data/projects/<slug>/index.txt` - one project card.
- `content/data/system/motd.txt` - boot message shown on startup.

## Adding A Project

Create a new directory:

```txt
content/data/projects/<slug>/index.txt
```

Example:

```txt
content/data/projects/new-system/index.txt
```

After refresh, the `projects` and `guide` commands will list it automatically if the directory contains `index.txt`.

## Project Card Template

Use this structure for new project cards:

```txt
Name: <project name>
Description: <short factual summary>
Domain: <business or technical domain>
Status: <active / historical / internal / public / archived>
Role: <your role>
Stack: <main technologies>
Zakres odpowiedzialności:
- <responsibility>
- <responsibility>
- <responsibility>
Opis:
- <longer context>
Uwagi:
- <notes, constraints, confidential context, or TODO>
Link: <public URL, local path, or [do uzupełnienia]>
```

Keep cards short enough to read comfortably in an 80-column terminal.

## Updating Existing Pages

- Edit `about/index.txt` when the short profile changes.
- Edit `cv/index.txt` when the full CV summary changes.
- Edit `home/index.txt` when the first-screen navigation should change.
- Edit `system/motd.txt` when the boot message should change.

## Runtime Behavior

The web server creates a new virtual filesystem state on `/api/init`.
That means:

- If you add or edit content, refreshing the page is enough to load it into a new web session.
- An already-open session will not see content added after it was initialized.
- TypeScript rebuild is not required for content-only changes.
- Rebuild is required when `.ts` source files change.

## Useful Commands

Inside ASCII-OS:

```txt
home
guide
projects
project <slug>
about
cv
open /projects/<slug>/index.txt
```

From the host shell:

```bash
npm run start:web
```

For content-only changes after the project has already been built:

```bash
node build/web/server.js
```
