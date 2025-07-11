import { subscribePush } from './api';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(playerId: string): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('푸시 알림이 지원되지 않습니다.');
      return false;
    }

    try {
      // 서비스 워커 등록
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('서비스 워커 등록 성공');

      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('알림 권한이 거부되었습니다.');
        return false;
      }

      // 푸시 구독
      if (VAPID_PUBLIC_KEY) {
        await this.subscribeToPush(playerId);
      }
      return true;
    } catch (error) {
      console.error('푸시 알림 초기화 실패:', error);
      return false;
    }
  }

  private async subscribeToPush(playerId: string): Promise<void> {
    if (!this.registration) return;

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // 백엔드에 구독 정보 전송
      await subscribePush(playerId, subscription.toJSON());
      console.log('푸시 구독 성공');
    } catch (error) {
      console.error('푸시 구독 실패:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PushNotificationService();