export interface Player {
  playerId: string;
  nickname: string;
  penaltyCount: number;
  sessionId?: string;
  isHost?: boolean;
}

export interface CreateRoomRequest {
  hostSessionId: string;
}

export interface CreateRoomResponse {
  roomId: string;
  inviteLink: string;
}

export interface JoinRoomRequest {
  sessionId: string;
  nickname: string;
}

export interface JoinRoomResponse {
  playerId: string;
  nickname: string;
  roomId: string;
}

export interface DrawPenaltyRequest {
  playerId: string;
}

export interface DrawPenaltyResponse {
  drawResultId: string;
}

export interface PenaltyResult {
  winnerNickname: string;
  penaltyContent: string;
  isRandomTarget?: boolean;
  originalDrawerNickname?: string;
}

export interface RankingItem {
  nickname: string;
  penaltyCount: number;
}

export interface WebSocketMessage {
  type: string;
  winnerNickname?: string;
  penaltyContent?: string;
  timestamp?: number;
  nickname?: string;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: number;
}

export interface ChatMessage {
  nickname: string;
  content: string;  // message → content로 변경
  timestamp?: number;
}

export interface PenaltyLog {
  logId: string;
  winnerNickname: string;
  penaltyContent: string;
  drawnAt: string;
  isRandomTarget?: boolean;
  originalDrawerNickname?: string;
}