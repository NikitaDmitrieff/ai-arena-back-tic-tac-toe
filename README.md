# Tic-Tac-Toe Game with LLM Players

A tic-tac-toe game implementation featuring LLM-powered players using the `nikitas-agents` package, with comprehensive CSV logging and a FastAPI backend.

## Project Structure

```
tic-tac-toe/
├── utils.py              # Utility functions (check winner, available moves, etc.)
├── board.py              # Board class
├── player.py             # Player class (supports both random and LLM players)
├── game.py               # Game orchestration logic with logging
├── prompts.py            # LLM prompts for game playing
├── logger.py             # CSV logging system
├── main.py               # FastAPI application
├── requirements.txt      # Python dependencies
├── Dockerfile            # Backend container configuration
├── frontend/
│   ├── index.html        # Minimal debug interface
│   └── Dockerfile        # Frontend container configuration
├── docker-compose.yml    # Container orchestration
└── logs/                 # CSV log files (created at runtime)
```

## Features

- **LLM Players**: Battle two LLMs against each other using OpenAI or Mistral models
- **Random Players**: Fallback to random move selection
- **Comprehensive Logging**: CSV logs track every prompt, response, move, and game outcome
- **FastAPI Backend**: RESTful API with endpoints for game management
- **Minimal Frontend**: Simple HTML/JS interface for testing and debugging
- **Dockerized**: Both backend and frontend run in separate containers
- **Flexible Configuration**: Mix and match LLM and random players

## API Endpoints

- `POST /games` - Create a new game
- `GET /games/{game_id}` - Get game state
- `POST /games/{game_id}/move` - Make a move (random if no row/col provided)
- `POST /games/{game_id}/auto` - Play entire game automatically
- `POST /games/{game_id}/reset` - Reset a game
- `DELETE /games/{game_id}` - Delete a game
- `GET /games` - List all active games

## Getting Started

### Prerequisites

1. **API Keys** (for LLM players):
   - OpenAI: Get from https://platform.openai.com/account/api-keys
   - Mistral: Get from https://console.mistral.ai/api-keys

2. **Environment Setup**:
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your API keys
   nano .env
   ```

### Using Docker (Recommended)

1. Make sure you have Docker and Docker Compose installed

2. Set up environment variables (see Prerequisites above)

3. Build and start the containers:
```bash
docker-compose up --build
```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

4. To stop the containers:
```bash
docker-compose down
```

### Running Locally (Without Docker)

#### Backend

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python main.py
# or
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

#### Frontend

Simply open `frontend/index.html` in a web browser, or serve it with any HTTP server:

```bash
cd frontend
python -m http.server 3000
```

## Usage Examples

### Creating a Random vs Random Game

```bash
curl -X POST http://localhost:8000/games
```

### Creating an LLM vs LLM Game

```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {
      "use_llm": true,
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.7
    },
    "player_o": {
      "use_llm": true,
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.9
    }
  }'
```

### Creating a Mixed Game (LLM vs Random)

```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {
      "use_llm": true,
      "provider": "openai",
      "model": "gpt-4o-mini"
    },
    "player_o": {
      "use_llm": false
    }
  }'
```

### Making a Move

```bash
# Random/LLM-chosen move
curl -X POST http://localhost:8000/games/{game_id}/move \
  -H "Content-Type: application/json" \
  -d '{}'

# Specific move
curl -X POST http://localhost:8000/games/{game_id}/move \
  -H "Content-Type: application/json" \
  -d '{"row": 0, "col": 0}'
```

### Playing Entire Game Automatically

```bash
curl -X POST http://localhost:8000/games/{game_id}/auto
```

### Getting Log File Paths

```bash
curl http://localhost:8000/logs
```

## Frontend Interface

We provide two frontend options:

### Enhanced UI (`index-enhanced.html`) - DEFAULT
**Recommended for most users**

Full-featured interface with:
- **Player Configuration**: Choose LLM or random for each player
- **Model Selection**: Pick from OpenAI (GPT-4o, GPT-4o-mini, etc.) or Mistral models
- **Temperature Control**: Adjust creativity (0.0 = deterministic, 2.0 = very creative)
- **Provider Selection**: Switch between OpenAI and Mistral
- **Visual Game Board**: Click cells or let AI play
- **Real-time Updates**: See game state and player info
- **Beautiful UI**: Modern, gradient design with animations

Access at: http://localhost:3000 or http://localhost:3000/index-enhanced.html

### Simple UI (`index.html`)
**For debugging and minimal interface needs**

Basic features:
- **New Game**: Create a new game session (random players only)
- **Make Move**: Manual or automatic moves
- **Play Auto**: Play the entire game automatically
- **Reset**: Reset the current game

Access at: http://localhost:3000/index.html

### Type-Safe API Integration

The frontend includes TypeScript types that match backend Pydantic schemas:
- **`frontend/src/types/api.ts`**: All request/response types
- **`frontend/src/services/api.ts`**: Type-safe API client

See **`FRONTEND_BACKEND_INTEGRATION.md`** for the complete integration guide.

## Logging System

The game automatically logs detailed information to CSV files in the `logs/` directory:

### Moves Log (`logs/moves_*.csv`)
Records every move with:
- Timestamp and game ID
- Player symbol and type (random/llm)
- Board state and available moves
- LLM prompt sent (if applicable)
- LLM response and reasoning
- Move validity and errors
- Response time in milliseconds

### Games Log (`logs/games_*.csv`)
Records game summaries with:
- Timestamp and game ID
- Player types and models
- Total moves and winner
- Game duration
- Final board state

## Supported LLM Providers and Models

### OpenAI
- `gpt-4o-mini` (recommended for cost-efficiency)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-3.5-turbo`

### Mistral
- `mistral-medium-latest`
- `mistral-small-latest`
- `mistral-tiny`

See the `nikitas-agents` package documentation for the full list of supported models.

## Architecture Notes

### LLM Integration

The `Player` class uses the `nikitas-agents` package to communicate with LLMs:

1. **Prompt Generation**: `prompts.py` formats the board state and generates strategic prompts
2. **LLM Invocation**: Player calls the agent with system and user prompts
3. **Response Parsing**: JSON responses are parsed to extract moves and reasoning
4. **Error Handling**: Invalid moves fall back to random selection
5. **Logging**: All interactions are logged to CSV for debugging

### Prompt Strategy

The system prompt instructs LLMs to:
- Play strategically (win conditions, blocking, positioning)
- Respond in strict JSON format
- Include reasoning for moves

The user prompt provides:
- Visual board representation
- Available moves
- Current player symbol
- Strategic considerations

## Documentation

This project includes comprehensive documentation:

1. **`README.md`** (this file) - Overview and getting started
2. **`FRONTEND_BACKEND_INTEGRATION.md`** - Complete guide for connecting frontend and backend
3. **`QUICK_REFERENCE.md`** - Quick commands and patterns
4. **`IMPLEMENTATION.md`** - LLM integration implementation details
5. **`QUICKSTART.md`** - 3-step quick start guide

## Troubleshooting

**LLM players not working?**
- Check that API keys are set in `.env`
- Verify the keys are loaded: `docker-compose config`
- Check backend logs: `docker logs tictactoe-backend`

**Import errors?**
- The code gracefully falls back to random moves if `nikitas-agents` isn't installed
- Rebuild containers: `docker-compose build --no-cache`

**Logs not appearing?**
- Check the `logs/` directory is created
- Verify volume mounting in docker-compose.yml
- Check file permissions

**Frontend can't reach backend?**
- Verify API URL in frontend (default: http://localhost:8000)
- Check CORS settings in backend
- Ensure backend is running: `docker ps`

**Type mismatches between frontend/backend?**
- See `FRONTEND_BACKEND_INTEGRATION.md` for synchronization strategies
- Use OpenAPI schema: `http://localhost:8000/openapi.json`
- Check TypeScript types: `frontend/src/types/api.ts`

## Future Enhancements

- [ ] Add different AI strategies (minimax, etc.)
- [ ] Implement human vs AI mode via frontend
- [ ] Add game replay functionality
- [ ] Persistent storage (database)
- [ ] Better frontend UI/UX with LLM configuration
- [ ] Multiplayer support via WebSockets
- [ ] Tournament mode: multiple games with statistics
- [ ] RAG integration for strategy documents
