import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { getPlayers, drawPenalty, getPenaltyRanking, kickPlayer, getRoomInfo, getRecentPenalties } from '../services/api';
import webSocketService from '../services/websocket';
import ScratchCard from '../components/ScratchCard';
import Notification from '../components/Notification';
import { RankingItem, PenaltyLog } from '../types';

function GameRoomPage() {
  const [activeTab, setActiveTab] = useState('penalty');
  const [currentDrawResult, setCurrentDrawResult] = useState<string | null>(null);
  const [showScratchCard, setShowScratchCard] = useState(false);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [penaltyHistory, setPenaltyHistory] = useState<PenaltyLog[]>([]);

  const { roomId } = useParams<{ roomId: string }>();
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state.currentPlayer && !state.currentRoom) {
      navigate('/');
      return;
    }

    if (roomId) {
      initializeRoom();
      connectWebSocket();
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [roomId]);

  const initializeRoom = async () => {
    if (!roomId) return;

    try {
      // 방 정보와 플레이어 목록을 동시에 가져오기
      const [roomInfo, players] = await Promise.all([
        getRoomInfo(roomId),
        getPlayers(roomId)
      ]);

      // 방 정보 저장
      dispatch({ type: 'SET_CURRENT_ROOM', payload: roomInfo });

      // 플레이어에 방장 정보 추가
      const playersWithHost = players.map(player => ({
        ...player,
        isHost: player.sessionId === roomInfo.hostSessionId
      }));

      dispatch({ type: 'SET_PLAYERS', payload: playersWithHost });

      if (activeTab === 'ranking') {
        const rankingData = await getPenaltyRanking(roomId);
        setRanking(rankingData);
      }
    } catch (error) {
      console.error('방 초기화 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '방 정보를 불러오는데 실패했습니다.' });
    }
  };

  const connectWebSocket = async () => {
    if (!roomId) return;

    try {
      await webSocketService.connect(roomId, {
        onPlayerUpdate: (data) => {
          console.log('플레이어 업데이트:', data);
          
          // 플레이어 조인/재조인 메시지 처리
          if (data.type === 'PLAYER_JOINED') {
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
              id: Date.now(),
              type: 'PLAYER_UPDATE',
              message: `🎉 ${data.nickname}님이 입장했습니다!`,
              timestamp: Date.now()
            }});
          } else if (data.type === 'PLAYER_REJOINED') {
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
              id: Date.now(),
              type: 'PLAYER_UPDATE',
              message: `👋 ${data.nickname}님이 다시 오셨네욥👍`,
              timestamp: Date.now()
            }});
          } else {
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
              id: Date.now(),
              type: 'PLAYER_UPDATE',
              message: '플레이어 목록이 업데이트되었습니다.',
              timestamp: Date.now()
            }});
          }
          initializeRoom();
        },
        onPenaltyDrawn: (data) => {
          console.log('벌칙 뽑기 알림:', data);
          dispatch({ type: 'ADD_NOTIFICATION', payload: {
            id: Date.now(),
            type: 'PENALTY_DRAWN',
            message: `😱 ${data.winnerNickname}님의 벌칙: ${data.penaltyContent}`,
            timestamp: Date.now()
          }});
          initializeRoom();
        },
        onChatMessage: (data) => {
          dispatch({ type: 'ADD_CHAT_MESSAGE', payload: data });
        },
        onPlayerKicked: (data) => {
          console.log('플레이어 강퇴 알림:', data);
          
          // 강퇴된 플레이어가 현재 사용자인지 확인
          if (data.nickname === state.currentPlayer?.nickname) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
              id: Date.now(),
              type: 'PLAYER_KICKED',
              message: '😱 방장에 의해 강퇴되었습니다.',
              timestamp: Date.now()
            }});
            // 3초 후 홈페이지로 이동
            setTimeout(() => {
              navigate('/');
            }, 3000);
          } else {
            dispatch({ type: 'ADD_NOTIFICATION', payload: {
              id: Date.now(),
              type: 'PLAYER_KICKED',
              message: `👋 ${data.nickname}님이 방장에 의해 강퇴되었습니다.`,
              timestamp: Date.now()
            }});
            initializeRoom();
          }
        }
      });
      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
    }
  };

  const handleDrawPenalty = async () => {
    if (!state.currentPlayer || !roomId) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await drawPenalty(roomId, { playerId: state.currentPlayer.playerId });
      setCurrentDrawResult(response.drawResultId);
      setShowScratchCard(true);
    } catch (error) {
      console.error('벌칙 뽑기 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '벌칙 뽑기에 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleScratchComplete = () => {
    setShowScratchCard(false);
    setCurrentDrawResult(null);
    initializeRoom();
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !roomId || !state.currentPlayer) return;

    const message = {
      nickname: state.currentPlayer.nickname,
      content: chatMessage.trim()  // message → content로 변경
    };

    webSocketService.sendChatMessage(roomId, message);
    setChatMessage('');
  };

  const loadRanking = async () => {
    if (!roomId) return;
    
    try {
      const rankingData = await getPenaltyRanking(roomId);
      setRanking(rankingData);
    } catch (error) {
      console.error('랭킹 조회 실패:', error);
    }
  };

  const loadPenaltyHistory = async () => {
    if (!roomId) return;
    
    try {
      const historyData = await getRecentPenalties(roomId);
      setPenaltyHistory(historyData);
    } catch (error) {
      console.error('벌칙 히스토리 조회 실패:', error);
    }
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!roomId || !state.sessionId || !state.currentPlayer) return;

    try {
      await kickPlayer(roomId, playerId, state.sessionId);
      dispatch({ type: 'ADD_NOTIFICATION', payload: {
        id: Date.now(),
        type: 'SUCCESS',
        message: '플레이어를 강퇴했습니다.',
        timestamp: Date.now()
      }});
    } catch (error) {
      console.error('강퇴 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '강퇴에 실패했습니다.' });
    }
  };

  // 현재 플레이어가 방장인지 확인
  const currentPlayerData = state.players.find(p => p.playerId === state.currentPlayer?.playerId);
  const isHost = currentPlayerData?.isHost || false;

  // 초대 링크 복사 함수
  const handleCopyInviteLink = async () => {
    if (!state.currentRoom?.inviteLink) return;

    try {
      // navigator.clipboard이 지원되는 경우
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(state.currentRoom.inviteLink);
      } else {
        // 대체 방법: textarea를 이용한 복사
        const textArea = document.createElement('textarea');
        textArea.value = state.currentRoom.inviteLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopySuccess(true);
      dispatch({ type: 'ADD_NOTIFICATION', payload: {
        id: Date.now(),
        type: 'SUCCESS',
        message: '📋 초대 링크가 복사되었습니다!',
        timestamp: Date.now()
      }});
      
      // 3초 후 복사 성공 상태 초기화
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('링크 복사 실패:', error);
      
      // 복사 실패 시 링크를 직접 보여주기
      const link = state.currentRoom.inviteLink;
      if (confirm(`링크 복사에 실패했습니다. 링크를 수동으로 복사하시겠습니까?\n\n${link}`)) {
        // 사용자가 확인을 누르면 링크가 선택된 상태로 표시됨
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'ranking') {
      loadRanking();
    } else if (activeTab === 'history') {
      loadPenaltyHistory();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h1 className="text-xl font-bold text-gray-800">🍻 펜션 뽑기 게임</h1>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-gray-600">참여자 {state.players.length}명</p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyInviteLink}
              disabled={!state.currentRoom?.inviteLink}
              className={`px-3 py-1 rounded text-sm transition-all duration-200 ${
                copySuccess
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copySuccess ? '✓ 복사됨!' : '🔗 초대링크'}
            </button>
            {state.isConnected ? (
              <span className="text-green-600 text-sm">● 연결됨</span>
            ) : (
              <span className="text-red-600 text-sm">● 연결 끊김</span>
            )}
          </div>
        </div>
      </div>

      {/* 알림 */}
      <Notification notifications={state.notifications} />

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-md mb-4">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'penalty', label: '벌칙 뽑기', icon: '🎯' },
            { key: 'ranking', label: '랭킹', icon: '🏆' },
            { key: 'history', label: '히스토리', icon: '📋' },
            { key: 'chat', label: '채팅', icon: '💬' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* 벌칙 뽑기 탭 */}
          {activeTab === 'penalty' && (
            <div className="space-y-4">
              <div className="text-center">
                <button
                  onClick={handleDrawPenalty}
                  disabled={state.loading || showScratchCard}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-4 px-8 rounded-full text-lg 
                    hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed 
                    transform hover:scale-105 transition-all duration-200"
                >
                  {state.loading ? '뽑는 중...' : '😱 내가 벌칙 뽑기'}
                </button>
              </div>

              {/* 참여자 목록 */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">참여자 목록</h3>
                <div className="grid grid-cols-1 gap-2">
                  {state.players.map(player => (
                    <div key={player.playerId} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.nickname}</span>
                          {player.isHost && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                              👑 방장
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">벌칙 {player.penaltyCount}회</div>
                      </div>
                      {/* 방장만 강퇴 버튼을 볼 수 있고, 자기 자신은 강퇴할 수 없음 */}
                      {isHost && player.playerId !== state.currentPlayer?.playerId && (
                        <button
                          onClick={() => handleKickPlayer(player.playerId)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          강퇴
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 랭킹 탭 */}
          {activeTab === 'ranking' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">🏆 벌칙 랭킹</h3>
              <div className="space-y-2">
                {ranking.map((player, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </span>
                      <span className="font-medium">{player.nickname}</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{player.penaltyCount}회</span>
                  </div>
                ))}
                {ranking.length === 0 && (
                  <p className="text-gray-500 text-center py-4">아직 벌칙 기록이 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {/* 벌칙 히스토리 탭 */}
          {activeTab === 'history' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">📋 벌칙 히스토리</h3>
              <div className="space-y-3">
                {penaltyHistory.map((log) => (
                  <div key={log.logId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-lg">{log.winnerNickname}</span>
                        {log.isRandomTarget && (
                          <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                            🎴 히든카드
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.drawnAt).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="text-gray-700 mb-2">
                      {log.penaltyContent}
                    </div>
                    
                    {log.isRandomTarget && log.originalDrawerNickname && (
                      <div className="text-sm text-purple-600 bg-purple-50 rounded px-2 py-1">
                        원래 뽑은 사람: {log.originalDrawerNickname} → {log.winnerNickname}
                      </div>
                    )}
                  </div>
                ))}
                
                {penaltyHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>아직 벌칙 기록이 없습니다.</p>
                    <p className="text-sm">첫 벌칙을 뽑아보세요!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 채팅 탭 */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              <div className="h-64 bg-gray-50 rounded-lg p-3 overflow-y-auto">
                {state.chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center">아직 채팅이 없습니다.</p>
                ) : (
                  state.chatMessages.map((msg, index) => (
                    <div key={index} className="mb-2">
                      <span className="font-medium text-blue-600">{msg.nickname}:</span>
                      <span className="ml-2">{msg.content}</span>
                      {msg.timestamp && (
                        <div className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  전송
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 스크래치 카드 모달 */}
      {showScratchCard && currentDrawResult && (
        <ScratchCard
          drawResultId={currentDrawResult}
          currentPlayerNickname={state.currentPlayer?.nickname}
          onComplete={handleScratchComplete}
        />
      )}

      {/* 에러 메시지 */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
          {state.error}
          <button
            onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
            className="ml-2 underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* 방 나가기 버튼 */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/')}
          className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          🚪 방 나가기
        </button>
      </div>
    </div>
  );
}

export default GameRoomPage;