# ASCII-OS Next Steps

## Status

The low-cost DOS-style batch is already implemented in the CLI and web layers:

- `dir`
- `type`
- `ver`
- `date`
- `time`
- `whoami`
- `shutdown`
- `mode`
- `prompt`

The next work should focus on durability and structure instead of adding more shell sugar.

## Best Product Step

1. Build a real `config` system, for example `/system/config.txt` or a `set` command, to store:
   - active screen mode,
   - terminal color,
   - prompt style,
   - startup behavior.
2. Add session persistence in `localStorage` so the web terminal keeps state after refresh.
3. Add a bottom status bar inspired by Norton Commander or DOS shell.
4. Add a startup sequence with delays and a simple boot-log animation in web.

## Best Technical Step

1. Split the web terminal UI out of `server.ts` into a dedicated HTML/CSS/JS renderer.
2. Add tests for frontend behavior:
   - history navigation,
   - `clear`,
   - `reboot`,
   - mode switching,
   - prompt updates.
3. Clean up the command model:
   - engine commands,
   - DOS aliases,
   - portfolio aliases,
   - diagnostic commands.

## Recommended Next Batch

If the next goal is the biggest product gain with reasonable implementation cost, the best batch is:

- config system
- `localStorage` session persistence
- renderer split
- frontend behavior tests
