import axios from 'axios';
import {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  Player,
  DrawPenaltyRequest,
  DrawPenaltyResponse,
  PenaltyResult,
  RankingItem,
  PenaltyLog
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 방 생성
export const createRoom = async (request: CreateRoomRequest): Promise<CreateRoomResponse> => {
  const response = await api.post('/rooms', request);
  return response.data;
};

// 방 참여
export const joinRoom = async (roomId: string, request: JoinRoomRequest): Promise<JoinRoomResponse> => {
  const response = await api.post(`/rooms/${roomId}/join`, request);
  return response.data;
};

// 플레이어 목록 조회
export const getPlayers = async (roomId: string): Promise<Player[]> => {
  const response = await api.get(`/rooms/${roomId}/players`);
  return response.data;
};

// 방 정보 조회
export const getRoomInfo = async (roomId: string): Promise<{roomId: string; hostSessionId: string; inviteLink: string}> => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

// 벌칙 뽑기
export const drawPenalty = async (roomId: string, request: DrawPenaltyRequest): Promise<DrawPenaltyResponse> => {
  const response = await api.post(`/rooms/${roomId}/drawPenalty`, request);
  return response.data;
};

// 스크래치 카드 결과 조회
export const getDrawResult = async (drawResultId: string): Promise<PenaltyResult> => {
  const response = await api.get(`/drawResults/${drawResultId}`);
  return response.data;
};

// 벌칙 랭킹 조회
export const getPenaltyRanking = async (roomId: string): Promise<RankingItem[]> => {
  const response = await api.get(`/rooms/${roomId}/rankings/penalty`);
  return response.data;
};

// 벌칙 공개 알림 (스크래치 카드 완료 시 호출)
export const revealPenalty = async (drawResultId: string): Promise<{status: string}> => {
  const response = await api.post(`/drawResults/${drawResultId}/reveal`);
  return response.data;
};

// 푸시 알림 구독
export const subscribePush = async (playerId: string, subscription: PushSubscriptionJSON): Promise<{status: string}> => {
  const response = await api.post('/push/subscribe', {
    playerId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys?.p256dh,
    auth: subscription.keys?.auth
  });
  return response.data;
};

// 플레이어 강퇴
export const kickPlayer = async (roomId: string, playerId: string, hostSessionId: string): Promise<{status: string}> => {
  const response = await api.post(`/rooms/${roomId}/kick`, {
    playerId,
    hostSessionId
  });
  return response.data;
};

// 최근 벌칙 목록 조회
export const getRecentPenalties = async (roomId: string): Promise<PenaltyLog[]> => {
  const response = await api.get(`/rooms/${roomId}/penalties/recent`);
  return response.data;
};