# ASCII-OS Work Summary

Data: 2026-05-09

## Cel Etapu

Projekt zostal doprowadzony do stanu, w ktorym ASCII-OS dziala jako CLI-first portfolio z warstwa webowa. Rdzeniem pozostaje wirtualny system plikow i komendy, a kontent portfolio jest trzymany w `content/data`, zeby po ustabilizowaniu aplikacji mozna bylo aktualizowac tresci bez przebudowy TypeScript.

## Co Zostalo Zrobione

- Uporzadkowano dokumentacje projektu w `README.md`, `NEXT_STEPS.md`, `ENGINE_SPEC.md`, `PORTFOLIO_SUMMARY.md` i `CONTENT_GUIDE.md`.
- Dodano guide dla kontentu opisujacy strukture `content/data`, dodawanie projektow i zachowanie runtime.
- Przygotowano tresci portfolio na podstawie CV: `about`, `cv`, `home` oraz karty projektow.
- Dodano karty projektow w `content/data/projects/<slug>/index.txt` z polami do recznego uzupelnienia, m.in. stack, zakres odpowiedzialnosci, opis i uwagi.
- Zmieniono obsluge `projects` i `guide`, zeby lista projektow byla generowana dynamicznie z wirtualnego systemu plikow, a nie z hardcoded seedow.
- Zachowano komende `project <slug>` jako szybka sciezke do konkretnej karty projektu.
- Dopasowano webowy `help`, zeby byl czytelniejszy i renderowany jako panel komend, a nie zwykly blok tekstu.
- Potwierdzono workflow content-only: po dodaniu nowego projektu wystarczy odswiezyc strone albo zainicjalizowac nowa sesje, bez przebudowy aplikacji.
- Dodano `Dockerfile.app` dla uruchamiania aplikacji, pozostawiajac dotychczasowy `Dockerfile` jako plik zwiazany ze srodowiskiem Codexa/dev.
- Ustalono, ze ignore file dla `Dockerfile.app` powinien dzialac jako `Dockerfile.app.dockerignore`.
- Dodano i uruchomiono testy pokrywajace dynamiczne listowanie projektow w `projects` i `guide`.

## Aktualny Model Kontentu

Kontent portfolio znajduje sie w:

```txt
content/data
```

Najwazniejsze sciezki:

```txt
content/data/home/index.txt
content/data/about/index.txt
content/data/cv/index.txt
content/data/projects/index.txt
content/data/projects/<slug>/index.txt
content/data/system/motd.txt
```

Nowy projekt dodaje sie przez utworzenie:

```txt
content/data/projects/<slug>/index.txt
```

Jesli katalog projektu zawiera `index.txt`, komendy `projects` i `guide` powinny pokazac go automatycznie po odswiezeniu strony lub starcie nowej sesji.

## Aktualne Komendy Portfolio

- `home` - strona startowa portfolio.
- `guide` - przewodnik po systemie i projektach.
- `projects` - dynamiczna lista kart projektow.
- `project <slug>` - otwarcie konkretnego projektu.
- `about` - profil zawodowy.
- `cv` - skondensowane CV.

## Stan Techniczny

- Engine pozostaje niezalezny od UI.
- CLI i web korzystaja z tego samego modelu komend.
- Web tworzy stan systemu na `/api/init`.
- `content/loader.ts` laduje `content/data` z dysku podczas inicjalizacji stanu.
- Istniejaca sesja webowa nie widzi zmian dodanych po inicjalizacji, ale refresh strony tworzy nowy stan i wczytuje aktualny kontent.
- Zmiany w `.txt` pod `content/data` nie wymagaja przebudowy TypeScript.
- Zmiany w `.ts` nadal wymagaja `npm run build`.

## Uruchamianie

Tryb developerski web:

```bash
npm run start:web
```

Po buildzie:

```bash
node build/web/server.js
```

Kontener aplikacyjny:

```bash
docker build -f Dockerfile.app -t ascii-os .
docker run --rm -p 3000:3000 ascii-os
```

## Ostatnia Weryfikacja

Testy projektu przechodzily po zmianach:

```bash
npm test
```

Docker nie byl uruchamiany w tym srodowisku, bo lokalnie nie ma dostepnego Docker CLI. Test Dockerfile zostal po stronie lokalnej uzytkownika.

## Deploy Hardening

Wykonany zostal pierwszy batch przygotowujacy aplikacje do stabilniejszego uruchomienia na serwerze:

- Dodano endpoint `GET /health`, ktory zwraca status aplikacji, liczbe aktywnych sesji i aktualny TTL sesji.
- Przeniesiono mape sesji do kontekstu konkretnej instancji serwera webowego.
- Dodano `lastSeen` dla sesji.
- Dodano czyszczenie wygaslych sesji przy requestach, bez dodatkowego timera w procesie.
- Dodano konfiguracje TTL przez `SESSION_TTL_MS`; domyslnie sesja wygasa po 30 minutach braku aktywnosci.
- Dodano testy dla `/health` i wygasania sesji po TTL.

## Web Renderer Split

Wydzielono warstwe prezentacji webowej z `web/server.ts`:

- `web/renderPage.ts` sklada dokument HTML.
- `web/styles.ts` przechowuje CSS terminala.
- `web/clientScript.ts` przechowuje JS klienta webowego.
- `web/server.ts` obsluguje routing, API, sesje i odpowiedzi HTTP.
- Dodano test `GET /`, ktory sprawdza, czy serwer nadal zwraca terminalowy HTML shell ze stylem i skryptem.

## Frontend Behavior Tests

Dodano testowalny model zachowania klienta webowego:

- `web/clientBehavior.ts` opisuje logike historii komend, mapowania trybow ekranu i planowania renderowania odpowiedzi API.
- Dodano serializacje i parsowanie stanu sesji webowej do `localStorage`.
- `tests/web-client-behavior.test.js` pokrywa historie komend, `clear`, `reboot`, `help`, tryby ekranu, prompt i `shutdown`.
- `web/clientScript.ts` korzysta z tego samego kontraktu zachowania przy obsludze odpowiedzi z `/api/command`.
- Dodano zabezpieczenie testowe, ze inline JS zwracany przez `GET /` nie zawiera odwolania do CommonJS `exports`.

## LocalStorage Persistence

Przy odswiezeniu strony sesja webowa moze byc wznowiona z `localStorage`:

- Klient zapisuje `sessionId` i historie komend w `localStorage`.
- Przy starcie proba wznawia poprzednia sesje przez blank request do `/api/command`.
- Jesli sesja jest niewazna, klient czyści zapis i tworzy nowa sesje przez `/api/init`.
- Serwer dla blank requestu zwraca aktualny `screenMode`, aby wznowienie nie resetowalo trybu ekranu.

## Najblizsze Sensowne Kroki

1. Dodac realny system konfiguracji, np. `/system/config.txt` albo komende `set`.
2. Wrocic do stylu Norton Commander: status bar, panelowy layout, boot sequence i mocniejsza stylistyka ASCII.

## Decyzje Projektowe

- Kontent ma byc edytowalny bez przebudowy aplikacji.
- Dodawanie projektu nie powinno wymagac edycji `aliases.ts`.
- `aliases.ts` moze czytac strukture wirtualnego systemu plikow, ale nie powinien trzymac listy projektow na stale.
- Warstwa webowa jest wrapperem nad CLI/kernel, a nie osobnym zrodlem prawdy.
- Dockerfile aplikacyjny jest oddzielony od Dockerfile srodowiska developerskiego.
