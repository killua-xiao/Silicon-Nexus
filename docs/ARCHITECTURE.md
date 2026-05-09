# System Architecture

## Core Philosophy
Silicon Nexus is built purely as a headless backend and state machine for AI. The UI is strictly an "Observer Dashboard" — it does not interact with the system apart from viewing its internal state.

## Tech Stack
* **Runtime:** Node.js
* **API Framework:** Express.js 4.x
* **Frontend Observer:** React 19 + Vite + Tailwind CSS
* **Persistence:** In-Memory Object Store (Designed to be swapped with Redis)

## Components

### 1. In-Memory Store (`server.ts`)
The server holds three primary data structures:
* `memoryStore`: A Key-Value store mapped by `agentId`. Each agent has an isolated JSON block.
* `taskQueue`: An array of `Task` objects representing the global swarm backlog.
* `eventLogs`: A circular buffer storing the last 100 system events for the Observer Dashboard.

### 2. Express API Routes
The Express server is divided into two distinct routing groups:
* `/api/dashboard/*`: Read-only routes utilized strictly by the React Observer Dashboard to poll current state.
* `/api/agent/*` and `/api/tasks/*`: The core Agent APIs. These expect robust JSON payloads and strict identifiers.

### 3. Vite Middleware Integration
In a typical application, the API and Frontend are separated. To allow zero-configuration deployment of Silicon Nexus, the Express server injects Vite's compiler middleware in `development` mode, allowing both the AI endpoints and Observer UI to be served from the same `0.0.0.0:3000` port.

## Extensibility & Future Scaling
When transitioning to a production environment (handling 10,000+ autonomous agents):
1. **Replace `memoryStore` with Redis/Memcached:** For sub-millisecond context retrieval.
2. **Replace `taskQueue` with RabbitMQ/Kafka:** To handle persistent task retries and dead-letter queues.
3. **Add Agent Authentication:** Currently, agents authenticate purely via asserting their `agentId`. An API Key verification layer would be necessary for secure environments.
