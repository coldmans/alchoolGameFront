import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface WebSocketCallbacks {
  onPlayerUpdate?: (data: any) => void;
  onPenaltyDrawn?: (data: any) => void;
  onChatMessage?: (data: any) => void;
  onPlayerKicked?: (data: any) => void;
}

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private subscriptions: Map<string, any> = new Map();

  async connect(roomId: string, callbacks: WebSocketCallbacks = {}): Promise<void> {
    if (this.connected) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: () => {
          console.log('WebSocket 연결됨');
          this.connected = true;
          this.setupSubscriptions(roomId, callbacks);
          resolve();
        },
        onStompError: (frame) => {
          console.error('STOMP 에러:', frame);
          reject(frame);
        },
        onWebSocketError: (error) => {
          console.error('WebSocket 에러:', error);
          reject(error);
        }
      });

      this.client.activate();
    });
  }

  private setupSubscriptions(roomId: string, callbacks: WebSocketCallbacks): void {
    if (!this.client) return;

    // 플레이어 변동 알림
    this.subscribe(`/topic/room/${roomId}/players`, (message) => {
      const data = JSON.parse(message.body);
      if (callbacks.onPlayerUpdate) {
        callbacks.onPlayerUpdate(data);
      }
    });

    // 벌칙 뽑기 알림
    this.subscribe(`/topic/room/${roomId}/penaltyDrawn`, (message) => {
      const data = JSON.parse(message.body);
      if (callbacks.onPenaltyDrawn) {
        callbacks.onPenaltyDrawn(data);
      }
    });

    // 채팅 메시지
    this.subscribe(`/topic/room/${roomId}/chat`, (message) => {
      const data = JSON.parse(message.body);
      if (callbacks.onChatMessage) {
        callbacks.onChatMessage(data);
      }
    });

    // 플레이어 강퇴 알림
    this.subscribe(`/topic/room/${roomId}/players`, (message) => {
      const data = JSON.parse(message.body);
      if (data.type === 'PLAYER_KICKED' && callbacks.onPlayerKicked) {
        callbacks.onPlayerKicked(data);
      }
    });
  }

  private subscribe(destination: string, callback: (message: any) => void): void {
    if (!this.client || !this.connected) return;

    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
  }

  sendChatMessage(roomId: string, message: any): void {
    if (!this.client || !this.connected) return;

    this.client.publish({
      destination: `/app/room/${roomId}/chat`,
      body: JSON.stringify(message)
    });
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach(subscription => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.connected = false;
    }
  }
}

export default new WebSocketService();