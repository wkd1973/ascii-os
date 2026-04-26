# ASCII-OS — Instrukcje dla Agenta

## Wizja projektu
To repozytorium jest systemem operacyjnym działającym w CLI, inspirowanym DOS i Norton Commander.
Celem jest stworzenie wirtualnego środowiska opartego na systemie plików, z interfejsem tekstowym (ASCII).

## Zasady główne
- Wszystko traktuj jak wirtualny system plików
- Preferuj proste, modułowe rozwiązania
- Nie komplikuj warstwy UI na początku
- Silnik CLI jest rdzeniem systemu (kernel)
- UI (np. React / ASCII renderer) jest warstwą wtórną

## Architektura projektu
- /engine → logika systemu (filesystem, komendy, stan)
- /cli → środowisko terminalowe (REPL, wejście/wyjście)
- /ui → interfejs ASCII (późniejszy etap)
- /content → dane systemu plików

## Zasady rozwoju
- Wszystkie funkcje najpierw CLI
- Każda funkcja musi działać jako komenda
- Silnik nie może zależeć od UI

## Obsługiwane komendy (docelowo)
- ls
- cd
- open
- help

## Styl kodu
- tylko TypeScript
- preferuj funkcje zamiast klas
- brak zależności UI w warstwie engine

## Cel końcowy
Zbudowanie minimalnego systemu operacyjnego działającego jako CLI / ASCII environment do eksploracji projektów i tożsamości developera.