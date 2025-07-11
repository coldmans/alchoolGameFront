# 펜션 뽑기 게임 프론트엔드

React + TypeScript로 개발된 실시간 멀티플레이어 벌칙 뽑기 게임입니다.

## 기능

- 실시간 방 생성 및 참여
- WebSocket을 통한 실시간 알림
- 스크래치 카드 방식의 벌칙 공개
- 벌칙 랭킹 시스템
- 푸시 알림 지원
- 실시간 채팅

## 설치 및 실행

```bash
npm install
npm start
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 값들을 설정하세요:

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WEBSOCKET_URL=http://localhost:8080/ws
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## 빌드

```bash
npm run build
```
