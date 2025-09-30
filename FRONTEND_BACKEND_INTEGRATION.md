# Frontend-Backend Integration Guide

**A comprehensive guide for connecting independently developed frontends and backends with type safety and best practices.**

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Type Safety Strategy](#type-safety-strategy)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [API Contract Management](#api-contract-management)
6. [Testing the Integration](#testing-the-integration)
7. [Common Pitfalls](#common-pitfalls)
8. [Scaling to Larger Projects](#scaling-to-larger-projects)

---

## Overview

This guide documents the pattern used to connect our tic-tac-toe frontend and backend, providing a reusable blueprint for future projects where frontend and backend are developed independently.

### Key Principles

1. **Type Safety**: Frontend types mirror backend Pydantic schemas
2. **Service Layer**: All API calls go through a dedicated service
3. **Error Handling**: Centralized error handling with custom error classes
4. **Contract-First**: API contract is the source of truth
5. **Environment Configuration**: API URLs and keys via environment variables

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Components/Pages                                           │
│       │                                                     │
│       ├──> API Service Layer (services/api.ts)             │
│       │         │                                           │
│       │         └──> Type Definitions (types/api.ts)       │
│       │                      │                              │
│       │                      │ Matches                      │
│       │                      ▼                              │
└───────┼──────────────────────┼──────────────────────────────┘
        │                      │
        │    HTTP/REST         │
        │      (JSON)          │
        │                      │
┌───────▼──────────────────────▼──────────────────────────────┐
│                         BACKEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FastAPI Application (main.py)                              │
│       │                                                     │
│       ├──> Pydantic Models                                 │
│       │         ├── PlayerConfig                            │
│       │         ├── GameConfig                              │
│       │         └── Response Models                         │
│       │                                                     │
│       ├──> Business Logic (game.py, player.py)             │
│       │                                                     │
│       └──> OpenAPI Schema Generation (/openapi.json)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Type Safety Strategy

### Backend: Pydantic Models (Python)

**File: `backend/main.py`**

```python
from pydantic import BaseModel
from typing import Optional

class PlayerConfig(BaseModel):
    """Player configuration."""
    use_llm: bool = False
    provider: str = "openai"
    model: str = "gpt-4o-mini"
    temperature: float = 0.7

class GameConfig(BaseModel):
    """Game configuration."""
    player_x: Optional[PlayerConfig] = None
    player_o: Optional[PlayerConfig] = None
    enable_logging: bool = True
```

### Frontend: TypeScript Types

**File: `frontend/src/types/api.ts`**

```typescript
/**
 * CRITICAL: These types MUST match backend Pydantic models exactly.
 * Synchronization strategy:
 * 1. Manual updates when backend changes
 * 2. OR use OpenAPI code generation tools
 * 3. OR build a custom sync script
 */

export interface PlayerConfig {
  use_llm: boolean;
  provider: 'openai' | 'mistral';
  model: string;
  temperature: number;
}

export interface GameConfig {
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging: boolean;
}
```

### Synchronization Methods

#### Method 1: Manual Synchronization (Current)
- ✅ Simple and direct
- ✅ No extra tools needed
- ❌ Risk of drift
- ❌ Manual maintenance

**Best Practice**: Add comments linking types to backend models:
```typescript
/**
 * Matches backend: PlayerConfig (main.py:43-48)
 * Last synced: 2025-09-30
 */
```

#### Method 2: OpenAPI Code Generation (Recommended for Large Projects)

```bash
# Install OpenAPI generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript types from backend
openapi-generator-cli generate \
  -i http://localhost:8000/openapi.json \
  -g typescript-fetch \
  -o frontend/src/generated
```

#### Method 3: Custom Sync Script

Create `scripts/sync-types.py`:

```python
#!/usr/bin/env python3
"""Generate TypeScript types from Pydantic models."""

from pydantic2ts import generate_typescript_defs

generate_typescript_defs(
    "main.py",
    "frontend/src/types/generated.ts"
)
```

---

## Step-by-Step Integration

### Step 1: Define Backend API

**1.1 Create Pydantic Models**

```python
# backend/main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="Your API",
    version="1.0.0",
    openapi_url="/openapi.json"
)

class RequestModel(BaseModel):
    field1: str
    field2: int

class ResponseModel(BaseModel):
    result: str
    data: dict

@app.post("/endpoint")
async def create_something(request: RequestModel) -> ResponseModel:
    return ResponseModel(result="success", data={})
```

**1.2 Test Backend Independently**

```bash
# Start backend
uvicorn main:app --reload

# Test endpoint
curl -X POST http://localhost:8000/endpoint \
  -H "Content-Type: application/json" \
  -d '{"field1": "test", "field2": 123}'

# View OpenAPI schema
curl http://localhost:8000/openapi.json
```

### Step 2: Create TypeScript Types

**2.1 Create Type Definitions**

```typescript
// frontend/src/types/api.ts

/**
 * Request and Response types matching backend Pydantic models.
 * Source: backend/main.py
 */

// REQUEST MODELS
export interface RequestModel {
  field1: string;
  field2: number;
}

// RESPONSE MODELS
export interface ResponseModel {
  result: string;
  data: Record<string, any>;
}
```

**2.2 Add Constants**

```typescript
// frontend/src/types/api.ts

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
} as const;
```

### Step 3: Create API Service Layer

**3.1 Base API Client**

```typescript
// frontend/src/services/api.ts

import type { RequestModel, ResponseModel } from '../types/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.detail || `HTTP ${response.status}`,
      response.status,
      error
    );
  }
  return response.json();
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  return handleResponse<T>(response);
}
```

**3.2 Endpoint-Specific Methods**

```typescript
// frontend/src/services/api.ts

export class ApiClient {
  static async createSomething(
    data: RequestModel
  ): Promise<ResponseModel> {
    return apiRequest<ResponseModel>('/endpoint', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export default ApiClient;
```

### Step 4: Use in Frontend Components

```typescript
// frontend/src/components/MyComponent.tsx

import { useState } from 'react';
import ApiClient from '../services/api';
import type { RequestModel, ResponseModel } from '../types/api';

export function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResponseModel | null>(null);

  const handleSubmit = async (data: RequestModel) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiClient.createSomething(data);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // ... render component
}
```

### Step 5: Environment Configuration

**5.1 Backend `.env`**

```bash
# backend/.env
OPENAI_API_KEY=sk-your-key
MISTRAL_API_KEY=your-key
```

**5.2 Frontend `.env.local`**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**5.3 Docker Compose**

```yaml
services:
  backend:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
  
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
```

---

## API Contract Management

### Documentation First

1. **OpenAPI/Swagger Docs**
   - Access at: `http://localhost:8000/docs`
   - Interactive testing
   - Schema validation

2. **ReDoc**
   - Access at: `http://localhost:8000/redoc`
   - Better for documentation reading

3. **OpenAPI JSON**
   - Access at: `http://localhost:8000/openapi.json`
   - Use for code generation

### Version Control

**File: `API_CHANGELOG.md`**

```markdown
# API Changelog

## v1.1.0 - 2025-09-30
### Added
- `/games` endpoint now accepts `GameConfig`
- New `PlayerConfig` model with LLM support

### Changed
- `temperature` field now accepts 0-2 (was 0-1)

### Breaking Changes
- None
```

### Contract Testing

```typescript
// frontend/tests/api-contract.test.ts

describe('API Contract Tests', () => {
  it('should match expected PlayerConfig shape', () => {
    const config: PlayerConfig = {
      use_llm: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
    };
    
    // This will fail at compile time if types don't match
    expect(config).toBeDefined();
  });
});
```

---

## Testing the Integration

### Backend Tests

```python
# backend/test_api.py

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_game():
    response = client.post("/games", json={
        "player_x": {"use_llm": True, "provider": "openai"},
        "player_o": {"use_llm": False}
    })
    assert response.status_code == 200
    data = response.json()
    assert "game_id" in data
```

### Frontend Tests

```typescript
// frontend/tests/api.test.ts

import ApiClient from '../services/api';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  it('should create game with correct payload', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ game_id: '123', /* ... */ }),
    });

    const config = {
      player_x: { use_llm: true, provider: 'openai' as const },
      player_o: { use_llm: false, provider: 'openai' as const },
      enable_logging: true,
    };

    await ApiClient.createGame(config);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/games',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(config),
      })
    );
  });
});
```

### Integration Tests

```bash
#!/bin/bash
# scripts/test-integration.sh

# Start backend
docker-compose up -d backend

# Wait for backend
sleep 3

# Run frontend integration tests
cd frontend
npm run test:integration

# Cleanup
docker-compose down
```

---

## Common Pitfalls

### 1. Type Drift

**Problem**: Frontend types don't match backend
**Solution**: 
- Use OpenAPI code generation
- Add pre-commit hooks to verify alignment
- Document synchronization process

### 2. Hardcoded URLs

**Problem**: API URLs hardcoded in components
**Solution**:
- Always use environment variables
- Centralize configuration

### 3. Missing Error Handling

**Problem**: Network errors crash the app
**Solution**:
- Use try/catch in all API calls
- Implement global error boundary
- Show user-friendly error messages

### 4. CORS Issues

**Backend Solution**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Be specific in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 5. TypeScript Any Abuse

**Bad**:
```typescript
const data: any = await fetch('/api/endpoint').then(r => r.json());
```

**Good**:
```typescript
const data: ResponseModel = await ApiClient.getEndpoint();
```

---

## Scaling to Larger Projects

### Project Structure

```
project/
├── backend/
│   ├── app/
│   │   ├── models/          # Pydantic models
│   │   │   ├── requests.py
│   │   │   └── responses.py
│   │   ├── routers/         # API routes
│   │   └── schemas/         # OpenAPI customization
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── types/
│   │   │   ├── api/         # Generated or manual types
│   │   │   │   ├── requests.ts
│   │   │   │   └── responses.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── api/         # API clients by domain
│   │   │   │   ├── games.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── index.ts
│   │   │   └── base.ts      # Base API client
│   │   └── hooks/           # React hooks for API calls
│   │       ├── useGames.ts
│   │       └── useApiMutation.ts
│   └── tests/
│
└── shared/
    ├── scripts/
    │   └── sync-types.sh    # Type synchronization
    └── docs/
        └── API.md           # API documentation
```

### Advanced Patterns

#### 1. React Query Integration

```typescript
// frontend/src/hooks/useGames.ts

import { useQuery, useMutation } from '@tanstack/react-query';
import ApiClient from '../services/api';
import type { GameConfig } from '../types/api';

export function useCreateGame() {
  return useMutation({
    mutationFn: (config: GameConfig) => ApiClient.createGame(config),
    onSuccess: (data) => {
      // Invalidate and refetch game list
    },
  });
}

export function useGame(gameId: string) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: () => ApiClient.getGame(gameId),
    refetchInterval: 1000, // Poll every second
  });
}
```

#### 2. WebSocket Integration

```typescript
// frontend/src/services/websocket.ts

export class GameWebSocket {
  private ws: WebSocket;

  connect(gameId: string) {
    this.ws = new WebSocket(`ws://localhost:8000/games/${gameId}/ws`);
    
    this.ws.onmessage = (event) => {
      const data: GameUpdate = JSON.parse(event.data);
      // Handle update
    };
  }
}
```

#### 3. Optimistic Updates

```typescript
// frontend/src/hooks/useMakeMove.ts

export function useMakeMove(gameId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (move: MoveRequest) => 
      ApiClient.makeMove(gameId, move),
    
    onMutate: async (move) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['game', gameId]);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['game', gameId]);
      
      // Optimistically update
      queryClient.setQueryData(['game', gameId], (old: any) => ({
        ...old,
        board: updateBoard(old.board, move),
      }));
      
      return { previous };
    },
    
    onError: (err, move, context) => {
      // Rollback on error
      queryClient.setQueryData(['game', gameId], context?.previous);
    },
  });
}
```

---

## Checklist for New Projects

- [ ] Backend: FastAPI with Pydantic models
- [ ] Backend: OpenAPI documentation enabled
- [ ] Backend: CORS configured
- [ ] Frontend: TypeScript types matching backend
- [ ] Frontend: API service layer created
- [ ] Frontend: Error handling implemented
- [ ] Frontend: Environment variables configured
- [ ] Docker: Both services containerized
- [ ] Docker: Environment variables passed correctly
- [ ] Testing: Backend API tests
- [ ] Testing: Frontend API client tests
- [ ] Testing: Integration tests
- [ ] Documentation: API changelog
- [ ] Documentation: Integration guide
- [ ] CI/CD: Type sync verification
- [ ] CI/CD: Contract testing

---

## Resources

### Tools

- **OpenAPI Generator**: https://openapi-generator.tech/
- **Pydantic**: https://docs.pydantic.dev/
- **FastAPI**: https://fastapi.tiangolo.com/
- **TypeScript**: https://www.typescriptlang.org/

### Libraries

- `pydantic2ts`: Python to TypeScript type generation
- `@tanstack/react-query`: Data fetching for React
- `zod`: Runtime type validation for TypeScript

### Best Practices

- Martin Fowler: [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [API Design Guide](https://cloud.google.com/apis/design)

---

## Summary

This integration pattern provides:

✅ **Type Safety**: Compile-time guarantees  
✅ **Separation of Concerns**: Clean architecture  
✅ **Maintainability**: Clear synchronization strategy  
✅ **Scalability**: Patterns that grow with your project  
✅ **Developer Experience**: IntelliSense and autocomplete  
✅ **Testing**: Easy to mock and test  

Follow this guide when building your next project for a robust, type-safe frontend-backend connection!
