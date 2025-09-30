/**
 * TypeScript types matching the FastAPI Pydantic schemas.
 * These types ensure type safety between frontend and backend.
 * 
 * IMPORTANT: Keep these in sync with backend Pydantic models in main.py
 */

// ============================================================================
// REQUEST MODELS (Client -> Server)
// ============================================================================

/**
 * Configuration for a single player.
 * Matches backend: PlayerConfig (main.py)
 */
export interface PlayerConfig {
  use_llm: boolean;
  provider: 'openai' | 'mistral';
  model: string;
  temperature: number;
}

/**
 * Configuration for creating a new game.
 * Matches backend: GameConfig (main.py)
 */
export interface GameConfig {
  player_x?: PlayerConfig;
  player_o?: PlayerConfig;
  enable_logging: boolean;
}

/**
 * Request to make a move.
 * Matches backend: MoveRequest (main.py)
 */
export interface MoveRequest {
  row?: number;
  col?: number;
}

// ============================================================================
// RESPONSE MODELS (Server -> Client)
// ============================================================================

/**
 * Information about a player in responses.
 */
export interface PlayerInfo {
  type: 'random' | 'llm';
  model: string | null;
}

/**
 * Current state of the game board and game.
 */
export interface GameState {
  board: (string | null)[][];
  current_player: 'X' | 'O' | null;
  winner: 'X' | 'O' | null;
  is_draw: boolean;
  game_over: boolean;
  move_history: MoveHistoryItem[];
  available_moves: [number, number][];
}

/**
 * A single move in the game history.
 */
export interface MoveHistoryItem {
  player: 'X' | 'O';
  row: number;
  col: number;
  reasoning?: string;
}

/**
 * Move information returned after making a move.
 */
export interface MoveInfo {
  row: number;
  col: number;
  player: 'X' | 'O';
}

/**
 * Metadata about a move (LLM details).
 */
export interface MoveMetadata {
  player_type: 'random' | 'llm';
  prompt?: string;
  response?: string;
  reasoning?: string;
  response_time_ms?: number;
  error?: string;
}

/**
 * Response from creating a game.
 */
export interface CreateGameResponse {
  game_id: string;
  message: string;
  state: GameState;
  player_x: PlayerInfo;
  player_o: PlayerInfo;
}

/**
 * Response from getting game state.
 */
export interface GetGameResponse {
  game_id: string;
  state: GameState;
}

/**
 * Response from making a move.
 */
export interface MakeMoveResponse {
  game_id: string;
  success: boolean;
  message: string;
  board: (string | null)[][];
  game_over: boolean;
  winner?: 'X' | 'O' | null;
  is_draw?: boolean;
  current_player?: 'X' | 'O';
  move?: MoveInfo;
  metadata?: MoveMetadata;
}

/**
 * Response from playing auto game.
 */
export interface PlayAutoResponse {
  game_id: string;
  winner: 'X' | 'O' | null;
  is_draw: boolean;
  board: (string | null)[][];
  moves: MakeMoveResponse[];
  total_moves: number;
}

/**
 * Response from resetting a game.
 */
export interface ResetGameResponse {
  game_id: string;
  message: string;
  state: GameState;
}

/**
 * Response from deleting a game.
 */
export interface DeleteGameResponse {
  game_id: string;
  message: string;
}

/**
 * Game summary for list endpoint.
 */
export interface GameSummary {
  game_id: string;
  player_x_type: 'random' | 'llm';
  player_o_type: 'random' | 'llm';
  game_over: boolean;
  winner: 'X' | 'O' | null;
}

/**
 * Response from listing games.
 */
export interface ListGamesResponse {
  total_games: number;
  games: GameSummary[];
}

/**
 * Response from getting log paths.
 */
export interface LogsResponse {
  moves_log: string;
  games_log: string;
  note: string;
}

/**
 * Root endpoint response.
 */
export interface RootResponse {
  message: string;
  endpoints: Record<string, string>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Supported LLM providers.
 */
export const PROVIDERS = ['openai', 'mistral'] as const;
export type Provider = typeof PROVIDERS[number];

/**
 * Supported models by provider.
 */
export const MODELS: Record<Provider, string[]> = {
  openai: [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ],
  mistral: [
    'mistral-small-latest',
    'mistral-medium-latest',
    'mistral-large-latest',
  ],
};

/**
 * Default player configuration.
 */
export const DEFAULT_PLAYER_CONFIG: PlayerConfig = {
  use_llm: false,
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7,
};

/**
 * Default game configuration.
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  enable_logging: true,
};
