# ASCII-OS Next Steps

## Status

The ASCII-OS project is in a highly interactive and atmospheric state:
- **Atmospheric UX**: CRT effects (scanlines, flicker), retro audio, and a high-contrast integrated scrollbar.
- **Mobile Optimized**: Robust Virtual Touch Bar integrated as a divider in AOC view, ensuring full control on touch devices.
- **AOC (ASCII-OS Commander)**: Dual-pane file manager with optimized flexbox layout and integrated touch controls.
- **VFS & Content**: Structured read-only portfolio content with ubiquitous quoted-argument support.
- **Stability**: Comprehensive test suite (74 tests), all PASS.

## Immediate Priority (Technical Debt)

1. **AOC Unit Tests**: Expand test coverage to include AOC's specific logic (pane switching, selection).

## Best Product Steps

1. **AOC Markdown Preview**: [COMPLETED] Implement light Markdown rendering (bold, lists, headers) in the AOC preview pane.
2. **The `run` command**: Add a CLI command to open external links (e.g., GitHub, live demos) in a new browser tab.
3. **Mobile Gestures**: [COMPLETED] Relocated Touch Bar into AOC view for better ergonomic flow.

## Best Technical Steps

1. **Audio Optimization**: Improve `AudioContext` management and sound quality of the synthesized "floppy crunch".
2. **PWA Support**: Add a web manifest and service worker to make ASCII-OS installable as a standalone app.
3. **AOC Unit Tests**: Expand test coverage to include AOC's specific logic (pane switching, selection).

## Recommended Next Batch

- **Mobile Gestures** (UX improvement for touch).
- **The `run` command** (Practical utility for portfolio).

