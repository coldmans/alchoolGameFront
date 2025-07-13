import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { createRoom } from '../services/api';

function HomePage() {
  const [loading, setLoading] = useState(false);
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!state.sessionId) return;

    setLoading(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await createRoom({ hostSessionId: state.sessionId });
      dispatch({ type: 'SET_CURRENT_ROOM', payload: { roomId: response.roomId } });

      // 방 생성 후 조인 페이지로 이동 (호스트용)
      navigate(`/join?roomId=${response.roomId}&host=true`);
    } catch (error) {
      console.error('방 생성 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '방 생성에 실패했습니다.' });
    } finally {
      setLoading(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🍻문병신 게임</h1>
        <p className="text-gray-600 mb-8">뽑아라 시발아...!</p>

        <button
          onClick={handleCreateRoom}
          disabled={loading}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold py-4 px-8 rounded-full text-lg 
            hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-all duration-200 transform hover:scale-105 mb-6"
        >
          {loading ? '방 생성 중...' : '🎮 새 방 만들기'}
        </button>

        {state.error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-md text-red-700">
            {state.error}
          </div>
        )}

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">초대 링크가 있나요?</p>
          <button
            onClick={() => navigate('/join')}
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            방 참여하기
          </button>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs text-gray-600">실시간 뽑기</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs text-gray-600">랭킹 시스템</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl mb-1">📱</div>
            <div className="text-xs text-gray-600">푸시 알림</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;