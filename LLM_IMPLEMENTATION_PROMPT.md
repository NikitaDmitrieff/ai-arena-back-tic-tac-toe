# LLM Implementation Prompt - Tic-Tac-Toe API Integration

Copy and paste this prompt to an LLM to implement the API connection for your frontend.

---

## 📋 PROMPT START

I need you to implement a complete frontend integration for a Tic-Tac-Toe API backend. The backend is already built and running at `http://localhost:8000`.

### Project Context

**What exists:**
- ✅ FastAPI backend fully operational (Python)
- ✅ Complete API documentation in `API_INTEGRATION_GUIDE.md`
- ✅ Real-time move display documentation in `REALTIME_MOVES_UPDATE.md`
- ✅ Reference implementation in `frontend/index.html`
- ✅ Supporting docs in `.docs/` directory

**What I need:**
A production-ready frontend that connects to this API and displays tic-tac-toe games with real-time move visualization.

---

### 📚 Required Reading

**CRITICAL - Read these files first:**

1. **`API_INTEGRATION_GUIDE.md`** (PRIMARY REFERENCE)
   - Complete API documentation
   - All 10 endpoints with request/response formats
   - TypeScript type definitions
   - Code examples in multiple languages
   - Error handling patterns
   - Testing strategies

2. **`REALTIME_MOVES_UPDATE.md`**
   - How to display moves in real-time (not just final result)
   - Sequential move execution pattern
   - Move history log implementation

3. **`.docs/README_API.md`**
   - Documentation navigation guide
   - Quick reference index

---

### 🎯 Implementation Requirements

#### Technology Stack

Choose ONE of the following:
- [ ] **React + TypeScript** (preferred)
- [ ] **Vue.js + TypeScript**
- [ ] **Next.js + TypeScript**
- [ ] **Vanilla JavaScript + HTML/CSS**
- [ ] **Other:** _______________

#### Core Features (MUST HAVE)

1. **Player Configuration**
   - UI to configure Player X and Player O
   - Toggle between LLM and Random players
   - For LLM players:
     - Select provider (OpenAI or Mistral)
     - Select model (e.g., gpt-4o-mini, gpt-4o, mistral-small-latest)
     - Adjust temperature (0.0 - 2.0)
   - Enable/disable logging

2. **Game Board**
   - 3x3 grid display
   - Show current cell values (X, O, or empty)
   - Visual distinction between X and O
   - Cell click handlers (for human players)
   - Disable occupied cells

3. **Game Controls**
   - "Create New Game" button
   - "Make Move" button (single move)
   - "Play Auto" button (play until game ends)
   - "Reset Game" button
   - "New Configuration" button

4. **Real-Time Move Display**
   - Display moves one-by-one (NOT all at once)
   - Configurable delay between moves (0.5s - 3s)
   - Visual feedback while LLM is "thinking"
   - Board updates immediately after each move

5. **Move History Log**
   - Scrollable list of all moves
   - Show: Player, Position (row, col), LLM reasoning (if available)
   - Color-coded by player (Red for X, Blue for O)
   - Display response time for LLM moves
   - Auto-scroll to latest move

6. **Game Status Display**
   - Current player indicator
   - Move count
   - Player types (LLM model name or "Random")
   - Game result (winner or draw)
   - Game ID

7. **Error Handling**
   - Display API errors to user
   - Handle network failures gracefully
   - Retry logic for failed requests
   - Validation before API calls

---

### 🔧 Technical Specifications

#### API Integration

**Base URL:** `http://localhost:8000`

**Key Endpoints to Use:**

```typescript
// 1. Create game
POST /games
Body: { player_x?: PlayerConfig, player_o?: PlayerConfig, enable_logging: boolean }
Returns: { game_id, state, player_x, player_o }

// 2. Make move
POST /games/{game_id}/move
Body: { row?: number, col?: number }  // Empty body = player chooses
Returns: { success, board, game_over, winner, move, metadata }

// 3. Get game state
GET /games/{game_id}
Returns: { game_id, state }

// 4. Reset game
POST /games/{game_id}/reset
Returns: { game_id, message, state }
```

**See `API_INTEGRATION_GUIDE.md` for complete endpoint documentation.**

#### Type Definitions

Use these TypeScript interfaces (from API_INTEGRATION_GUIDE.md, "Data Models" section):

```typescript
interface PlayerConfig {
  use_llm: boolean;
  provider: 'openai' | 'mistral';
  model: string;
  temperature: number;
}

interface GameConfig {
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging: boolean;
}

interface GameState {
  board: (string | null)[][];
  current_player: string | null;
  winner: string | null;
  is_draw: boolean;
  game_over: boolean;
  move_history: Array<{
    player: string;
    row: number;
    col: number;
    reasoning?: string;
  }>;
  available_moves: [number, number][];
}

interface MoveMetadata {
  player_type: 'llm' | 'random';
  prompt?: string;
  response?: string;
  reasoning?: string;
  response_time_ms?: number;
  error?: string;
}
```

#### Real-Time Move Display (CRITICAL)

**From `REALTIME_MOVES_UPDATE.md`:**

```javascript
// DON'T use /games/{game_id}/auto (returns only final result)
// DO use sequential /games/{game_id}/move calls

async function playAutoWithRealTimeDisplay(gameId, delayMs = 1000) {
  let gameOver = false;
  
  while (!gameOver) {
    // Make single move
    const response = await fetch(`http://localhost:8000/games/${gameId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})  // Let player choose
    });
    
    const data = await response.json();
    
    // Update UI immediately
    updateBoard(data.board);
    addMoveToHistory(data.move, data.metadata);
    
    gameOver = data.game_over;
    
    // Add delay before next move (so user can see it)
    if (!gameOver) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  // Show final result
  displayGameResult(data.winner, data.is_draw);
}
```

---

### 🎨 UI/UX Requirements

#### Design Principles
- Clean, modern interface
- Clear visual hierarchy
- Responsive (works on mobile and desktop)
- Accessible (ARIA labels, keyboard navigation)
- Loading states for async operations
- Smooth animations for moves

#### Color Scheme (Suggested)
- Player X: Red (#e74c3c)
- Player O: Blue (#3498db)
- Success: Green (#27ae60)
- Warning: Orange (#f39c12)
- Background: Gradient (e.g., purple gradient like reference)

#### Reference Implementation
- See `frontend/index.html` for complete working example
- You can use this as inspiration or starting point
- Improve upon it with modern framework patterns

---

### 📝 Implementation Steps

**Follow this order:**

1. **Setup Project Structure**
   ```
   src/
   ├── types/
   │   └── api.ts          # Type definitions
   ├── services/
   │   └── api.ts          # API service layer
   ├── hooks/              # Custom hooks (if React)
   │   └── useTicTacToe.ts
   ├── components/
   │   ├── GameBoard.tsx
   │   ├── PlayerConfig.tsx
   │   ├── MoveHistory.tsx
   │   └── GameControls.tsx
   └── App.tsx
   ```

2. **Implement Type Definitions**
   - Copy types from `API_INTEGRATION_GUIDE.md`
   - Add any additional UI-specific types

3. **Create API Service Layer**
   - Implement all API calls
   - Add error handling
   - Add TypeScript types to all functions
   - See "Integration Walkthrough" in API_INTEGRATION_GUIDE.md

4. **Build UI Components**
   - PlayerConfig component (form for player settings)
   - GameBoard component (3x3 grid)
   - MoveHistory component (scrollable log)
   - GameControls component (buttons)
   - GameStatus component (current state display)

5. **Implement Game Logic**
   - Create game on configuration submit
   - Handle manual moves (cell clicks)
   - Implement auto-play with real-time display
   - Update UI after each move
   - Handle game end states

6. **Add Error Handling**
   - Try-catch around all API calls
   - Display user-friendly error messages
   - Log errors to console
   - Retry logic where appropriate

7. **Polish & Test**
   - Add loading spinners
   - Add animations
   - Test all user flows
   - Test error scenarios
   - Verify real-time display works smoothly

---

### ✅ Acceptance Criteria

The implementation is complete when:

- [ ] User can configure both players (LLM or random)
- [ ] User can create a new game
- [ ] Board displays correctly (3x3 grid)
- [ ] User can click "Play Auto" and watch moves happen one-by-one
- [ ] Moves appear with configurable delay (not all at once)
- [ ] Move history shows all moves with reasoning
- [ ] LLM reasoning is displayed for each move
- [ ] Game correctly detects winner or draw
- [ ] User can reset game
- [ ] User can start new game with different configuration
- [ ] Errors are handled and displayed to user
- [ ] UI is responsive and looks good
- [ ] Code is type-safe (TypeScript)
- [ ] Code is well-organized and commented

---

### 🧪 Testing Checklist

Test these scenarios:

1. **Random vs Random**
   - Create game with both random players
   - Click "Play Auto"
   - Verify moves display sequentially
   - Verify game ends correctly

2. **LLM vs LLM**
   - Configure both players with LLM
   - Create game
   - Click "Play Auto"
   - Verify LLM reasoning displays
   - Verify response times show
   - Watch full game play out

3. **Error Handling**
   - Try creating game with backend down
   - Try making move in non-existent game
   - Verify error messages display

4. **UI Interactions**
   - Change delay speed (0.5s to 3s)
   - Reset game mid-play
   - Start new configuration
   - Verify all buttons work

---

### 📖 Reference Materials

**Available documentation (all in project root or .docs/):**
- `API_INTEGRATION_GUIDE.md` - Complete API reference (2000+ lines)
- `REALTIME_MOVES_UPDATE.md` - Real-time display implementation
- `.docs/README_API.md` - Documentation index
- `.docs/QUICKSTART.md` - Quick start guide
- `frontend/index.html` - Working reference implementation

**Interactive API docs:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Schema: http://localhost:8000/openapi.json

---

### 🎁 Bonus Features (Optional)

If you have extra time, add these:

- [ ] Save game history to localStorage
- [ ] Export game log as JSON/CSV
- [ ] Game statistics (win rates, average moves)
- [ ] Multiple games side-by-side
- [ ] Dark mode toggle
- [ ] Sound effects for moves
- [ ] Animated board transitions
- [ ] Keyboard shortcuts
- [ ] Tournament mode (best of N games)

---

### ⚠️ Important Notes

1. **Read API_INTEGRATION_GUIDE.md FIRST** - It has everything you need
2. **Use real-time display pattern** from REALTIME_MOVES_UPDATE.md (NOT /auto endpoint)
3. **Follow TypeScript types** exactly as documented
4. **Handle errors gracefully** - network can fail
5. **Test with backend running** at http://localhost:8000
6. **Reference frontend/index.html** for working example

---

### 🚀 Deliverables

Please provide:

1. **Complete source code** with proper structure
2. **README.md** with:
   - Setup instructions
   - How to run
   - Available features
   - Dependencies
3. **Package.json** (or equivalent) with all dependencies
4. **Comments** explaining complex logic
5. **Type definitions** for all data structures

---

### ❓ Questions to Consider

Before starting, decide:
- Which framework/library? (React, Vue, vanilla JS, etc.)
- TypeScript or JavaScript? (TypeScript strongly recommended)
- Styling approach? (CSS modules, Tailwind, styled-components, etc.)
- State management? (React hooks, Zustand, Redux, etc.)
- Build tool? (Vite, Create React App, Next.js, etc.)

---

## 📋 PROMPT END

---

## Usage Instructions

1. Copy everything between "PROMPT START" and "PROMPT END"
2. Paste to your LLM (ChatGPT, Claude, etc.)
3. Add your framework preference if you have one
4. Attach or reference the API_INTEGRATION_GUIDE.md file
5. Let the LLM generate the code
6. Review, test, and iterate

## Tips for Best Results

- Mention which framework you prefer upfront
- Ask for the implementation in stages if it's too long
- Request specific files one at a time if needed
- Always test the generated code against the running backend
- Reference the API_INTEGRATION_GUIDE.md for any questions

---

**Good luck with your implementation! 🎮**

