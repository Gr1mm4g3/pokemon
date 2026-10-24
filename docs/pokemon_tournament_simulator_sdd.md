# System Design Document: Pokémon Auto-Battler & Tournament Simulator

## 1. Project Overview

**Description:** A web-based application that simulates automated Pokémon battles. Pokémon are ranked on a global Elo leaderboard. Users can start, watch, and manage a massive automated Double Round-Robin tournament featuring all 151 original Pokémon, where an AI controls both sides using real stats and movesets.
**Tech Stack:** Next.js (App Router), TailwindCSS, SQLite (via Prisma ORM), Server-Sent Events (SSE) for streaming, Clerk (Authentication), and PokeAPI (Data Source).

## 2. System Architecture & Data Flow

### 2.1 High-Level Architecture

1. **Frontend (Next.js Client + Tailwind):** Renders the UI, manages user state, and connects to an SSE stream to animate battles live.
2. **Backend (Next.js Server Actions / API Routes):** Handles the massive 22,650-match bracket generation, Elo calculations, and the Battle Engine AI.
3. **Database (SQLite + Prisma):** Stores user profiles, historical tournament data, and the persistent Elo ratings of all Pokémon in a local `.db` file.
4. **Live Broadcast (Server-Sent Events - SSE):** Streams battle events (moves, damage, status effects) natively from a Next.js API route to the watching clients.
5. **External API (PokeAPI):** Fetches base stats, move pools, and sprite URLs.

### 2.2 The Real-Time Battle Loop

* **The Engine:** A Next.js server function calculates the entire match in milliseconds.
* **The Broadcast:** An API Route opens an SSE connection (`EventSource`) with the client and pushes the turn-by-turn array sequentially.
* **The Client:** The React frontend receives the stream, places the turns into a queue, and processes them one by one every 2 seconds to simulate a live "broadcast" with generic CSS/Framer Motion animations.

## 3. Database Schema (Prisma / SQLite)

You will use Prisma to manage your SQLite schema.

* **`User` (Synced via Clerk webhooks or created on first login)**
  * `id` (String/UUID), `username` (String), `createdAt` (DateTime)

* **`PokemonRoster`** (Caches PokeAPI data so you don't hit their rate limits, plus tracks Elo)
  * `id` (Int, matches PokeAPI ID), `name` (String), `spriteUrl` (String), `types` (String/JSON), `baseStats` (String/JSON), `eloRating` (Float, Default: 1000.0)

* **`Tournament`**
  * `id` (String/UUID), `userId` (String, FK to User), `status` (String: "pending", "in_progress", "completed"), `createdAt` (DateTime)

* **`Match`**
  * `id` (String/UUID), `tournamentId` (String, FK to Tournament), `pokemonAId` (Int), `pokemonBId` (Int), `winnerId` (Int, nullable), `status` (String: "pending", "active", "finished")

## 4. Core Game Mechanics

### 4.1 Battle AI & Decision Tree

The backend "Battle Engine" will use a rule-based AI. For every turn, the engine evaluates the current state of both Pokémon and assigns a "weight" to each of the Pokémon's 4 available moves.

* **Priority 1 (Survival):** IF HP < 30% AND has a healing move (e.g., Rest, Recover) -> 80% chance to use Heal.
* **Priority 2 (Status):** IF Opponent does not have a status condition AND has a status move (e.g., Spore, Toxic) -> 70% chance to use Status move.
* **Priority 3 (Type Advantage):** Calculate damage for all attack moves. Apply STAB (Same Type Attack Bonus) and Type Effectiveness (e.g., Water is 2x vs Fire). Select the move that deals the highest damage.

### 4.2 Tournament Logic

* **151 Double Round-Robin:** The sole tournament mode. All 151 Pokémon face every other Pokémon exactly twice, resulting in 22,650 total matches per tournament. 
* **Win/Loss Tracking:** The winner of the tournament is the Pokémon with the highest Win/Loss record across all 300 of their individual matches. 

### 4.3 Elo Rating System

After every match, both Pokémon's Elo ratings update globally, carrying over between different tournaments.

* **Formula:** $R_{new} = R_{old} + K \cdot (ActualScore - ExpectedScore)$
* **K-Factor:** Use $K=32$.
* **Logic:** If a 1500 Elo Pikachu beats a 1500 Elo Squirtle, Pikachu gains ~16 points, Squirtle loses ~16. If an 800 Elo Caterpie beats a 2000 Elo Mewtwo, Caterpie gains a massive amount of points (e.g., +31), and Mewtwo drops significantly.

## 5. User Interface & UX Flow

1. **Dashboard:**
   * Global Leaderboard showing the highest Elo Pokémon across all time.
   * "Start 151 Tournament" button.
2. **The Arena (Live Viewer):**
   * **Left Side:** Pokémon A (Sprite, HP Bar, Status Icons, Types).
   * **Right Side:** Pokémon B.
   * **Bottom:** Text box detailing the action (e.g., *"Bulbasaur used Leech Seed!"*).
   * **Visuals:** Generic screen shakes for hits, green flashes for healing, purple bubbles for poison (achievable with simple Tailwind CSS animations).
3. **Tournament Standings View:**
   * A dynamic, sortable data table showing all 151 Pokémon, ranking them by their Win/Loss record for the current active tournament.

## 6. Development Milestones (How to build it)

* **Phase 1: The Foundation**
  * Set up Next.js, configure Tailwind, Clerk, and Prisma (SQLite).
  * Write a script to fetch the original 151 Pokémon from PokeAPI and populate your SQLite database.
* **Phase 2: The Battle Engine (Backend)**
  * Write pure TypeScript functions that simulate a battle to the death using type effectiveness and base stats. 
* **Phase 3: The Live Arena**
  * Build a Next.js API route that supports Server-Sent Events (SSE).
  * Build the React component that connects to the SSE stream and updates the health bars and text log.
* **Phase 4: Tournament Management**
  * Implement the mass bracket generation logic (22,650 matches) writing to SQLite.
  * Tie the Tournament flow to the Live Arena (auto-queuing the next pending match).
* **Phase 5: Polish & Elo**
  * Implement the Elo math upon match completion.
  * Add CSS animations and build the global leaderboard UI.