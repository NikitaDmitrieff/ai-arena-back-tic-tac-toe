/**
 * API Client for Tic-Tac-Toe Backend
 * 
 * This service layer provides type-safe methods for communicating with the FastAPI backend.
 * All methods use the types defined in ../types/api.ts which match the backend Pydantic schemas.
 * 
 * BEST PRACTICES:
 * 1. All API calls go through this service (no direct fetch in components)
 * 2. Type safety is enforced at compile time
 * 3. Error handling is centralized
 * 4. Base URL is configurable via environment
 */

import type {
  GameConfig,
  CreateGameResponse,
  GetGameResponse,
  MoveRequest,
  MakeMoveResponse,
  PlayAutoResponse,
  ResetGameResponse,
  DeleteGameResponse,
  ListGamesResponse,
  LogsResponse,
  RootResponse,
} from '../types/api';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for the API.
 * In production, this should come from environment variables.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper function to handle fetch responses.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    let errorData;

    try {
      errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Response body is not JSON
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json() as Promise<T>;
}

/**
 * Helper function to make API requests.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// API CLIENT METHODS
// ============================================================================

/**
 * API Client class with all backend endpoints.
 */
export class TicTacToeApi {
  /**
   * Get API root information.
   */
  static async getRoot(): Promise<RootResponse> {
    return apiRequest<RootResponse>('/');
  }

  /**
   * Create a new game with optional configuration.
   * 
   * @param config - Game configuration (optional)
   * @returns Created game information
   */
  static async createGame(config?: GameConfig): Promise<CreateGameResponse> {
    return apiRequest<CreateGameResponse>('/games', {
      method: 'POST',
      body: config ? JSON.stringify(config) : undefined,
    });
  }

  /**
   * Get the current state of a game.
   * 
   * @param gameId - Game ID
   * @returns Current game state
   */
  static async getGame(gameId: string): Promise<GetGameResponse> {
    return apiRequest<GetGameResponse>(`/games/${gameId}`);
  }

  /**
   * Make a move in a game.
   * If row and col are not provided, the current player chooses automatically.
   * 
   * @param gameId - Game ID
   * @param move - Move request (optional row/col)
   * @returns Move result
   */
  static async makeMove(
    gameId: string,
    move?: MoveRequest
  ): Promise<MakeMoveResponse> {
    return apiRequest<MakeMoveResponse>(`/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(move || {}),
    });
  }

  /**
   * Play the entire game automatically.
   * 
   * @param gameId - Game ID
   * @returns Complete game result
   */
  static async playAuto(gameId: string): Promise<PlayAutoResponse> {
    return apiRequest<PlayAutoResponse>(`/games/${gameId}/auto`, {
      method: 'POST',
    });
  }

  /**
   * Reset a game to initial state.
   * 
   * @param gameId - Game ID
   * @returns Reset confirmation
   */
  static async resetGame(gameId: string): Promise<ResetGameResponse> {
    return apiRequest<ResetGameResponse>(`/games/${gameId}/reset`, {
      method: 'POST',
    });
  }

  /**
   * Delete a game.
   * 
   * @param gameId - Game ID
   * @returns Deletion confirmation
   */
  static async deleteGame(gameId: string): Promise<DeleteGameResponse> {
    return apiRequest<DeleteGameResponse>(`/games/${gameId}`, {
      method: 'DELETE',
    });
  }

  /**
   * List all active games.
   * 
   * @returns List of games
   */
  static async listGames(): Promise<ListGamesResponse> {
    return apiRequest<ListGamesResponse>('/games');
  }

  /**
   * Get log file paths.
   * 
   * @returns Log file information
   */
  static async getLogs(): Promise<LogsResponse> {
    return apiRequest<LogsResponse>('/logs');
  }
}

/**
 * Default export for convenience.
 */
export default TicTacToeApi;

