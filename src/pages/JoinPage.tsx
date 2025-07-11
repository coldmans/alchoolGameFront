import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { joinRoom } from '../services/api';

function JoinPage() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  const roomIdFromUrl = searchParams.get('roomId');
  const isHost = searchParams.get('host') === 'true';

  useEffect(() => {
    if (roomIdFromUrl) {
      setRoomCode(roomIdFromUrl);
    }
  }, [roomIdFromUrl]);

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim() || !state.sessionId) return;

    const targetRoomId = roomCode || roomIdFromUrl;
    if (!targetRoomId) {
      dispatch({ type: 'SET_ERROR', payload: '방 코드를 입력해주세요.' });
      return;
    }

    setLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await joinRoom(targetRoomId, {
        sessionId: state.sessionId,
        nickname: nickname.trim()
      });
      
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: response });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: { roomId: targetRoomId } });

      // 방 참여 후 게임룸으로 이동
      navigate(`/room/${targetRoomId}`);
    } catch (error: any) {
      console.error('방 참여 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.error || '방 참여에 실패했습니다.' });
    } finally {
      setLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isHost ? '🎮 방 호스트 설정' : '🚪 방 참여하기'}
        </h1>

        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              닉네임을 입력하세요
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 철수"
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {!roomIdFromUrl && (
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
                방 코드 (UUID)
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="방 코드를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {roomIdFromUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>방 코드:</strong> {roomIdFromUrl}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-4 rounded-md 
              hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? '참여 중...' : isHost ? '방 입장하기' : '게임 참여하기'}
          </button>
        </form>

        {state.error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
            {state.error}
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="ml-2 underline"
            >
              닫기
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            새 방 만들기
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinPage;