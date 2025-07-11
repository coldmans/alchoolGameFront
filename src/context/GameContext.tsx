import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Player, Notification, ChatMessage } from '../types';

interface GameState {
  sessionId: string | null;
  currentRoom: { roomId: string; hostSessionId?: string; inviteLink?: string } | null;
  currentPlayer: { playerId: string; nickname: string; roomId: string } | null;
  players: Player[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  isConnected: boolean;
  loading: boolean;
  error: string | null;
}

type GameAction =
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_CURRENT_ROOM'; payload: { roomId: string; hostSessionId?: string; inviteLink?: string } }
  | { type: 'SET_CURRENT_PLAYER'; payload: { playerId: string; nickname: string; roomId: string } }
  | { type: 'SET_PLAYERS'; payload: Player[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: GameState = {
  sessionId: null,
  currentRoom: null,
  currentPlayer: null,
  players: [],
  notifications: [],
  chatMessages: [],
  isConnected: false,
  loading: false,
  error: null
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload };
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 10)
      };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    // 세션 ID 생성 (브라우저 세션 동안 유지)
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem('sessionId', sessionId);
    }
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};