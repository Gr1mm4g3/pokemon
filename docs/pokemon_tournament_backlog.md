# Pokémon Tournament Simulator - Project Backlog

This backlog is designed to be fed to an AI step-by-step. Check off each task (`[x]`) as it is completed.

## Phase 1: Foundation & Data Setup

* [ ] **1.1 Project Initialization:** Initialize a new Next.js (App Router) project with Tailwind CSS and TypeScript.
* [ ] **1.2 Authentication Setup:** Install and configure Clerk for user authentication. Protect a basic `/dashboard` route.
* [ ] **1.3 Database ORM Setup:** Install Prisma (`prisma`, `@prisma/client`) and initialize it with a SQLite provider (`npx prisma init --datasource-provider sqlite`).
* [ ] **1.4 Prisma Schema Definition:** Write the `schema.prisma` models for `User`, `PokemonRoster`, `Tournament`, and `Match` based on the updated SDD. Run `npx prisma db push`.
* [ ] **1.5 PokeAPI Seeder Script:** Write a server-side script in Next.js that fetches the first 151 Pokémon from `https://pokeapi.co/api/v2/pokemon/`, parses their stats, types, and sprite URLs, and inserts them into the `PokemonRoster` SQLite table.

## Phase 2: The Battle Engine (Core Logic)

* [ ] **2.1 Type Definitions:** Define TypeScript interfaces for `BattleState`, `TurnResult`, and move types.
* [ ] **2.2 Damage Calculator:** Create a utility function that takes an attacker, defender, and move, and calculates damage based on base stats, type effectiveness, and STAB.
* [ ] **2.3 Basic AI Decision Logic:** Implement a basic AI function that selects a move for a Pokémon based on the highest calculated damage output.
* [ ] **2.4 Advanced AI Logic:** Upgrade the AI function to include survival logic (healing when low HP) and status effect logic (putting to sleep/poisoning if not already afflicted).
* [ ] **2.5 Battle Loop Simulator:** Write a server function that takes two Pokémon IDs, queries SQLite for their stats, simulates an entire battle turn-by-turn until one faints, and returns an array of event logs.

## Phase 3: The Live Arena (Real-Time UI)

* [ ] **3.1 Arena Layout UI:** Build a static React component for the Arena displaying two Pokémon sprites, their HP bars, names, and a text log box at the bottom.
* [ ] **3.2 Server-Sent Events (SSE) Route:** Create a Next.js API Route (`app/api/battle-stream/route.ts`) that returns a `ReadableStream` to support SSE.
* [ ] **3.3 Event Broadcaster:** Modify the SSE route to trigger the Battle Loop Simulator, loop through the resulting event logs, and stream them to the client sequentially with a slight delay.
* [ ] **3.4 Live Client Listener:** Update the Arena React component to use the native browser `EventSource` API to connect to the SSE route and push incoming events into a local state queue.
* [ ] **3.5 Animation Hook:** Create a custom React hook (`useBattleQueue`) that processes the local state queue visually, updating HP bars and text logs at human-readable speeds.

## Phase 4: Tournament Management

* [ ] **4.1 Tournament Initialization UI:** Build a simple dashboard view with a "Start 151 Round-Robin Tournament" button.
* [ ] **4.2 Round-Robin Match Generator:** Write a server action triggered by the start button. It should query all 151 Pokémon IDs and batch-insert 22,650 `Match` records into SQLite (pairing every Pokémon against each other twice).
* [ ] **4.3 Match Orchestrator:** Create a server function that finds the next `pending` match in the active tournament, prepares it for the SSE stream, updates the match `status` to `finished`, and saves the `winnerId` in SQLite upon completion.
* [ ] **4.4 Tournament Standings UI:** Build a React component that queries Prisma for all matches in the active tournament, calculates the Win/Loss records for all 151 Pokémon, and displays them in a sorted standings table.

## Phase 5: Elo & Polish

* [ ] **5.1 Elo Calculation Engine:** Write a utility function containing the Elo mathematical formula ($K=32$).
* [ ] **5.2 Elo Updater:** Integrate the Elo calculation into the Match Orchestrator (Task 4.3) so it updates the `eloRating` in the `PokemonRoster` table for both Pokémon after a match concludes.
* [ ] **5.3 Global Leaderboard UI:** Build a dashboard component that ranks the top 151 Pokémon based on their all-time global `eloRating`.
* [ ] **5.4 Animation Polish:** Add Tailwind CSS/Framer Motion animations to the Live Arena (e.g., screen shake when taking damage, opacity changes for fainting).