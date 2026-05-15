# ASCII-OS Work Summary

Data: 2026-05-15

## Cel Etapu

Stabilizacja jądra systemu, wdrożenie modelu Read-Only dla bezpieczeństwa portfolio oraz finalny szlif UX/UI z naciskiem na urządzenia mobilne i płynność pracy w terminalu.

## Co Zostalo Zrobione

- **Architektura Read-Only**:
  - Przekształcono system w statyczne portfolio. Usunięto komendy zapisu (`mkdir`, `touch`, `write`) z jądra (engine).
  - Zaktualizowano interfejs AOC Commander (stopka Alt+1-0), usuwając akcje edycji na rzecz nawigacji (Home, About, CV, Guide).
- **Refactoring Parser'a (Unified Command Flow)**:
  - Przeniesiono zaawansowany parser argumentów z warstwy CLI bezpośrednio do jądra (`engine/parser.ts`).
  - System poprawnie obsługuje teraz argumenty w cudzysłowach (np. ścieżki ze spacjami) we wszystkich interfejsach (Web, REPL, Testy).
- **UX & Layout Polish (Mobile & Desktop)**:
  - **Zintegrowany Touch Bar**: Przeniesiono panel przycisków dotykowych (UP, DN, TAB, ENT, ESC) do wnętrza widoku AOC. Pełni on teraz rolę aktywnego separatora między listą plików a podglądem.
  - **Naprawa Scrolling'u**: Wdrożono niezawodny mechanizm `scrollToBottom` zapewniający widoczność promptu nawet po wyświetleniu obszernych bloków tekstu (np. komenda `help`).
  - **Stabilność Layoutu**: Wyeliminowano błędy "pływającego" interfejsu i zbędnych odstępów na dole ekranu poprzez optymalizację struktury Flexbox i media queries.
- **Poprawki Błędów (Bugfixes)**:
  - Naprawiono błąd `SyntaxError` w `clientScript.ts` wynikający z błędnego escapowania template literals.
  - Naprawiono renderowanie Markdowna (regex dla pogrubienia tekstu).
  - Oczyszczono logi startowe (usunięto niepotrzebne dumpy treści plików).

## Stan Techniczny

- System jest w pełni stabilny i bezpieczny (brak operacji zapisu).
- Wszystkie 74 testy jednostkowe i integracyjne przechodzą pomyślnie.
- Interfejs AOC jest zoptymalizowany pod kątem ergonomicznym na telefonach.

## Aktualne Komendy

- `aoc` - wejście w tryb ASCII-OS Commander.
- `set` - zarządzanie konfiguracją sesji (screenMode, theme, promptTemplate).
- `home`, `about`, `cv`, `projects`, `project <slug>`, `guide` - komendy portfolio.
- `ls`, `cd`, `cat`, `tree`, `open`, `pwd` - nawigacja i odczyt systemu plików.
- `dir`, `type`, `ver`, `date`, `time`, `mode`, `cls`, `shutdown` - aliasy DOS-owe.
- `reboot`, `exit`, `quit` - sterowanie sesją.

## Najblizsze Sensowne Kroki

1. **AOC Unit Tests**: Rozbudowa testów o specyficzną logikę przełączania paneli i zaznaczania elementów w Commanderze.
2. **`run` command**: Dodanie komendy CLI do otwierania zewnętrznych linków (GitHub, dema) w nowej karcie.
3. **PWA Support**: Dodanie web manifestu, aby system był instalowalny jako aplikacja.

## Decyzje Projektowe

- Rezygnacja z akcji zapisu (F5-F8) na rzecz czystego, odczytywalnego portfolio (Read-Only by Design).
- Touch Bar jako integralna część widoku AOC, a nie globalna nakładka.
- Przeniesienie parsera do silnika zapewnia identyczne zachowanie systemu w testach i w przeglądarce.
