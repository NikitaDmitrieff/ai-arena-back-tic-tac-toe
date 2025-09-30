# Frontend-Backend Integration Quick Reference

**Quick commands and patterns for connecting frontend and backend.**

## 🎯 Quick Start

### 1. Start Everything
```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- OpenAPI Schema: http://localhost:8000/openapi.json

### 2. Available Frontends

- **Enhanced UI** (default): http://localhost:3000/index-enhanced.html
  - Model selection
  - LLM configuration
  - Player settings
  
- **Simple UI**: http://localhost:3000/index.html
  - Basic debugging interface
  - No configuration options

## 📝 Type Synchronization Workflow

### When Backend Changes

```bash
# 1. Update backend Pydantic model
# backend/main.py
class PlayerConfig(BaseModel):
    use_llm: bool = False
    new_field: str = "default"  # NEW FIELD

# 2. Update frontend TypeScript type
# frontend/src/types/api.ts
export interface PlayerConfig {
  use_llm: boolean;
  new_field: string;  // NEW FIELD
}

# 3. Update API service if needed
# frontend/src/services/api.ts

# 4. Test the integration
curl http://localhost:8000/openapi.json | jq '.components.schemas'
```

### Automated Sync (Optional)

```bash
# Generate types from OpenAPI schema
npx openapi-typescript http://localhost:8000/openapi.json \
  --output frontend/src/types/generated.ts
```

## 🔧 Common API Calls

### Create LLM vs LLM Game

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

### Create Mixed Game

```bash
curl -X POST http://localhost:8000/games \
  -H "Content-Type: application/json" \
  -d '{
    "player_x": {"use_llm": true, "provider": "openai", "model": "gpt-4o-mini"},
    "player_o": {"use_llm": false}
  }'
```

### Make a Move

```bash
# Automatic move (random or LLM)
curl -X POST http://localhost:8000/games/{GAME_ID}/move \
  -H "Content-Type: application/json" \
  -d '{}'

# Specific move
curl -X POST http://localhost:8000/games/{GAME_ID}/move \
  -H "Content-Type: application/json" \
  -d '{"row": 1, "col": 1}'
```

## 💻 Frontend Integration Patterns

### Pattern 1: Direct fetch (Simple)

```typescript
// frontend/index-enhanced.html (current approach)
const response = await fetch(`${API_URL}/games`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(config)
});
const data = await response.json();
```

### Pattern 2: API Service (Type-safe)

```typescript
// frontend/src/services/api.ts
import { TicTacToeApi } from './services/api';

const game = await TicTacToeApi.createGame({
  player_x: { use_llm: true, provider: 'openai', model: 'gpt-4o-mini' },
  player_o: { use_llm: false }
});
// game is fully typed as CreateGameResponse
```

### Pattern 3: React Hook (Best for React apps)

```typescript
// For future React integration
import { useCreateGame } from './hooks/useGames';

function GameSetup() {
  const { mutate: createGame, isLoading } = useCreateGame();

  const handleCreate = () => {
    createGame({
      player_x: { use_llm: true, provider: 'openai' },
      player_o: { use_llm: true, provider: 'mistral' }
    });
  };
}
```

## 📦 File Structure

```
tic-tac-toe/
├── backend/
│   ├── main.py              # FastAPI + Pydantic models
│   ├── game.py
│   ├── player.py
│   └── ...
│
├── frontend/
│   ├── index-enhanced.html  # UI with model selection
│   ├── index.html           # Simple UI
│   │
│   └── src/                 # Type-safe layer (optional)
│       ├── types/
│       │   └── api.ts       # TypeScript types ← matches Pydantic
│       └── services/
│           └── api.ts       # API client
│
└── docs/
    ├── FRONTEND_BACKEND_INTEGRATION.md  # Full guide
    └── QUICK_REFERENCE.md               # This file
```

## 🔍 Debugging

### Check Type Alignment

```bash
# Backend schema
curl http://localhost:8000/openapi.json | jq '.components.schemas.PlayerConfig'

# Frontend types
grep -A 5 "interface PlayerConfig" frontend/src/types/api.ts
```

### View Logs

```bash
# Backend logs
docker logs tictactoe-backend -f

# CSV logs
ls -lh logs/
tail -f logs/moves_*.csv
```

### Test API

```bash
# Interactive docs
open http://localhost:8000/docs

# Get TypeScript types
curl http://localhost:8000/schema/typescript
```

## 🚀 Deployment Checklist

- [ ] Environment variables set (`.env` file)
- [ ] CORS configured for production domains
- [ ] API URL in frontend points to production
- [ ] Types synchronized between frontend/backend
- [ ] Error handling tested
- [ ] Logs directory writable
- [ ] API rate limiting configured
- [ ] HTTPS enabled

## 📚 Key Files Reference

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `backend/main.py` | API endpoints + Pydantic models | Every feature |
| `frontend/src/types/api.ts` | TypeScript types | When backend changes |
| `frontend/src/services/api.ts` | API client | When endpoints change |
| `docker-compose.yml` | Environment config | Rarely |
| `FRONTEND_BACKEND_INTEGRATION.md` | Full guide | As patterns evolve |

## 🔗 Useful Links

- OpenAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json
- TypeScript Schema: http://localhost:8000/schema/typescript

---

## Next Steps for Your Project

1. **Copy the pattern**: Use this structure for your next game
2. **Customize types**: Add game-specific types to `types/api.ts`
3. **Extend API client**: Add new methods to `services/api.ts`
4. **Add React**: Integrate with React/Vue/Svelte if needed
5. **Add WebSockets**: For real-time game updates

See `FRONTEND_BACKEND_INTEGRATION.md` for complete details and advanced patterns!
