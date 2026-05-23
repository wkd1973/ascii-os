# Strategia Hostingu na Vercel

Niniejszy dokument opisuje plan dostosowania projektu **ASCII-OS** do hostingu na platformie Vercel, przy jednoczesnym zachowaniu pełnej kompatybilności z lokalnym środowiskiem deweloperskim (CLI i Local Web Server).

## 1. Wyzwania techniczne

Obecna architektura posiada dwie główne bariery dla środowisk serverless (takich jak Vercel):
1. **Stan w pamięci (Stateful API):** Serwer przechowuje sesje użytkowników w `Map<string, Session>`. W funkcjach serverless pamięć jest czyszczona między zapytaniami, co powodowałoby resetowanie sesji (np. powrót do katalogu głównego przy każdym poleceniu).
2. **Bezpośrednie użycie `node:http`:** Aplikacja uruchamia stały proces nasłuchujący na porcie, podczas gdy Vercel oczekuje funkcji obsługujących zapytania (event handlers).

## 2. Proponowane rozwiązania

### A. Przejście na Stateless API
Zamiast przechowywać stan na serwerze, przeniesiemy go na stronę klienta (przeglądarki).
- **Proces:**
  1. Klient inicjuje sesję (`/api/init`) i otrzymuje początkowy obiekt `SystemState`.
  2. Przy każdym kolejnym poleceniu (`/api/command`), klient przesyła swój aktualny `SystemState` wraz z komendą.
  3. Serwer przetwarza komendę na otrzymanym stanie i zwraca **zaktualizowany** obiekt `SystemState` oraz wynik operacji.
- **Zaleta:** Pełna odporność na restarty serwera i brak potrzeby korzystania z zewnętrznych baz danych dla prostego portfolio.

### B. Separacja Handlera (Modularny Serwer)
Rozdzielimy logikę obsługi zapytań od logiki uruchamiania serwera.
- `web/handler.ts`: Czysta funkcja przetwarzająca `IncomingMessage` i `ServerResponse`.
- `web/server.ts`: Lokalny serwer dla deweloperów (używa `handler.ts` i `server.listen()`).
- `api/index.ts`: Punkt wejścia dla Vercel (eksportuje `handler.ts` jako Serverless Function).

### C. Poprawka VFS (Virtual File System)
Upewnienie się, że `loadRootFromDisk()` w `content/loader.ts` używa `process.cwd()` do lokalizowania danych, co jest kluczowe dla poprawnego działania w izolowanym środowisku Vercel.

## 3. Kompatybilność Lokalna

Zmiany te **nie zepsują** lokalnego workflow:
- **CLI (REPL):** Nadal będzie działać w oparciu o ten sam silnik (`engine/`), ponieważ zmiana dotyczy tylko warstwy transportowej (API).
- **Local Web:** Uruchomienie `npm run start:web` nadal otworzy lokalny serwer na porcie 3000, korzystając z tego samego handlera, co Vercel.

## 4. Kroki implementacji

1. **Refaktor `SystemState`**: Upewnienie się, że stan jest w pełni serializowalny do JSON.
2. **Aktualizacja API**: Zmiana kontraktu `/api/command` na przyjmowanie i zwracanie stanu.
3. **Modyfikacja `clientScript.ts`**: Dodanie logiki trzymania stanu w pamięci przeglądarki.
4. **Rozdzielenie serwera**: Utworzenie `web/handler.ts`.
5. **Konfiguracja Vercel**: Dodanie `vercel.json` i `api/index.ts`.
