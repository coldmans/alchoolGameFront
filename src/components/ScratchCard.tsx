import React, { useState, useEffect } from 'react';
import ScratchCard from 'react-scratchcard-v2';
import { getDrawResult, revealPenalty } from '../services/api';
import { PenaltyResult } from '../types';
import HiddenCardAnimation from './HiddenCardAnimation';

interface ScratchCardProps {
  drawResultId: string;
  onComplete: () => void;
  currentPlayerNickname?: string;
}

function ScratchCardComponent({ drawResultId, onComplete, currentPlayerNickname }: ScratchCardProps) {
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [scratched, setScratched] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showHiddenCard, setShowHiddenCard] = useState(false);
  const [hiddenCardAnimation, setHiddenCardAnimation] = useState(false);
  const [glitchPhase, setGlitchPhase] = useState(0); // 0: 원래이름, 1: 글리치중, 2: 새이름
  const [displayedName, setDisplayedName] = useState('');


  useEffect(() => {
    loadResult();
  }, [drawResultId]);

  const loadResult = async () => {
    try {
      const data = await getDrawResult(drawResultId);
      
      // 히든카드 판단: 내가 뽑았는데 winnerNickname이 다른 사람이면 히든카드!
      const isHiddenCard = currentPlayerNickname && data.winnerNickname !== currentPlayerNickname;
      
      if (isHiddenCard) {
        data.isRandomTarget = true;
        data.originalDrawerNickname = currentPlayerNickname; // 원래 뽑은 사람 = 나
        console.log('🎯 히든카드 발동! 원래:', currentPlayerNickname, '→ 실제:', data.winnerNickname);
      } else {
        data.isRandomTarget = false;
        console.log('😐 일반 벌칙:', data.winnerNickname);
      }
      
      setResult(data);
      // 초기 표시될 이름 설정 (히든카드든 아니든 일단 원래 뽑은 사람으로 시작)
      setDisplayedName(currentPlayerNickname || data.winnerNickname);
    } catch (error) {
      console.error('결과 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScratchStart = () => {
    console.log('스크래치 시작!');
  };

  const handleScratchComplete = async () => {
    setScratched(true);

    // 히든카드 체크
    console.log('🔥 스크래치 완료, result:', result);
    if (result?.isRandomTarget) {
      console.log('🎯 히든카드 발동! 애니메이션 + 이름 변경 시작');
      setShowHiddenCard(true);
      // 스크래치 카드 내 이름 변경 애니메이션 시작
      startGlitchAnimation();
    } else {
      console.log('😐 일반 벌칙 (히든카드 없음)');
    }

    // 스크래치 카드를 다 긁었을 때 다른 사람들에게 알림 전송
    try {
      await revealPenalty(drawResultId);
      setRevealed(true);
    } catch (error) {
      console.error('벌칙 공개 알림 전송 실패:', error);
    }

    // 히든카드가 있으면 8초, 없으면 3초 후 닫기
    const closeDelay = result?.isRandomTarget ? 8000 : 3000;
    setTimeout(() => {
      onComplete();
    }, closeDelay);
  };

  const handleHiddenCardComplete = () => {
    console.log('🏁 handleHiddenCardComplete 호출됨');
    setShowHiddenCard(false);
  };

  const startGlitchAnimation = () => {
    if (!result?.isRandomTarget) return;

    console.log('🎯 스크래치 카드 내 이름 변경 애니메이션 시작!');

    const glitchChars = ['█', '▓', '▒', '░', '◆', '■', '●', '▲', '▼', '◄', '►'];
    const originalName = result.originalDrawerNickname || currentPlayerNickname || '';
    const finalName = result.winnerNickname || '';
    
    console.log('카드 내 이름 변경:', originalName, '→', finalName);
    
    // 1초 후 글리치 시작
    setTimeout(() => {
      console.log('스크래치 카드 글리치 시작');
      setGlitchPhase(1);
      
      // 글리치 효과 (0.8초 동안)
      let glitchInterval = setInterval(() => {
        const randomGlitch = Array.from({length: Math.max(originalName.length, 3)}, () => 
          glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join('');
        setDisplayedName(randomGlitch);
      }, 80);
      
      // 0.8초 후 글리치 종료하고 새 이름 표시
      setTimeout(() => {
        console.log('스크래치 카드 이름 변경 완료:', finalName);
        clearInterval(glitchInterval);
        setGlitchPhase(2);
        setDisplayedName(finalName);
      }, 800);
      
    }, 1000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const isCurrentPlayer = result?.winnerNickname === currentPlayerNickname;

  // SVG 이미지를 base64로 인코딩 (한글 지원)
  const scratchImage = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`
    <svg width="280" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6000;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff9900;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="280" height="200" fill="url(#gradient)"/>
      <text x="140" y="100" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
            fill="white" text-anchor="middle" dominant-baseline="central">긁어서 확인하세요!</text>
    </svg>
  `)))}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">
          {isCurrentPlayer ? '😅 당신의 벌칙!' : '🎲 벌칙 결과'}
        </h2>

        <div className="mb-4">
          <ScratchCard
            width={280}
            height={200}
            image={scratchImage}
            finishPercent={75}
            onComplete={handleScratchComplete}
            onMouseDown={handleScratchStart}
            onTouchStart={handleScratchStart}
          >
            <div className={`w-full h-full ${
              isCurrentPlayer 
                ? 'bg-gradient-to-br from-red-400 to-pink-500' 
                : 'bg-gradient-to-br from-purple-400 to-pink-400'
            } flex flex-col items-center justify-center text-white p-4 relative overflow-hidden`}>
              
              {/* 글리치 배경 효과 */}
              {result?.isRandomTarget && glitchPhase === 1 && (
                <div className="absolute inset-0 bg-black opacity-20 animate-pulse"></div>
              )}
              
              <div className="text-lg font-bold mb-2">
                {isCurrentPlayer ? '😅 당신의 벌칙' : '🎯 당첨자'}
              </div>
              
              <div className={`text-2xl font-bold mb-3 transition-all duration-200 ${
                glitchPhase === 1 ? 'text-red-300 animate-ping' : ''
              } ${
                glitchPhase === 2 ? 'text-yellow-300 animate-pulse' : ''
              }`} style={{
                filter: glitchPhase === 1 ? 'blur(1px) brightness(2)' : 'none',
                textShadow: glitchPhase === 1 ? '2px 2px #ff0000, -2px -2px #00ff00' : 'none'
              }}>
                {displayedName}
              </div>
              
              {/* 글리치 중일 때 추가 효과 */}
              {result?.isRandomTarget && glitchPhase === 1 && (
                <>
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-ping"></div>
                  <div className="absolute bottom-0 right-0 w-full h-0.5 bg-yellow-500 animate-ping"></div>
                  <div className="absolute top-1/2 left-0 w-0.5 h-full bg-blue-500 animate-ping"></div>
                  <div className="absolute top-1/2 right-0 w-0.5 h-full bg-green-500 animate-ping"></div>
                </>
              )}
              
              <div className="text-lg font-semibold text-center leading-tight">
                {result?.penaltyContent}
              </div>
            </div>
          </ScratchCard>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {isCurrentPlayer
            ? '카드를 긁어서 당신의 벌칙을 확인하세요!'
            : '카드를 긁어서 결과를 확인하세요!'
          }
        </p>

        {/* 히든카드 전체화면 극적 애니메이션 - 테스트용 */}
        {glitchPhase >= 1 && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90">
            
            {/* 글리치 중 - 화면 전체가 번쩍번쩍 */}
            {glitchPhase === 1 && (
              <>
                {/* 빨간 오버레이가 깜빡임 */}
                <div className="absolute inset-0 bg-red-600 opacity-70 animate-ping"></div>
                <div className="absolute inset-0 bg-yellow-400 opacity-30 animate-pulse"></div>
                
                {/* 번개 라인들이 화면을 가로지름 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-ping"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-500 animate-ping"></div>
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 animate-ping"></div>
                <div className="absolute top-0 right-0 w-1 h-full bg-green-500 animate-ping"></div>
                
                {/* 대각선 번개 */}
                <div className="absolute top-0 left-0 w-full h-full"
                     style={{
                       background: 'linear-gradient(45deg, transparent 48%, #ff0000 49%, #ff0000 51%, transparent 52%)',
                       animation: 'pulse 0.1s infinite'
                     }}></div>
              </>
            )}
            
            {/* 메인 메시지 - 화면 중앙에 크게 */}
            <div className="text-center z-50 relative">
              
              {/* 큰 이모지 - 회전하면서 깜빡임 */}
              <div className={`text-8xl mb-6 ${
                glitchPhase === 1 ? 'animate-spin' : 'animate-bounce'
              }`}>
                {glitchPhase === 1 ? '💀⚡💀' : '🎴⚡🎯'}
              </div>
              
              {/* 메인 텍스트 */}
              <div className={`text-5xl font-bold mb-8 ${
                glitchPhase === 1 ? 'text-red-400 animate-pulse' : 'text-yellow-400 animate-bounce'
              }`}>
                {glitchPhase === 1 ? '치지직... ERROR!' : 'HIDDEN CARD!'}
              </div>
              
              {/* 이름 변경 애니메이션 */}
              <div className={`text-3xl font-bold p-4 rounded-lg ${
                glitchPhase === 1 
                  ? 'bg-red-700 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black animate-bounce'
              }`}>
                {glitchPhase === 1 
                  ? `${displayedName} ???` 
                  : `${result.originalDrawerNickname} → ${result.winnerNickname}`
                }
              </div>
              
              {/* 하단 메시지 */}
              {glitchPhase === 2 && (
                <div className="text-2xl text-yellow-300 font-bold mt-6 animate-pulse">
                  🎯 벌칙 대상이 바뀌었습니다! 🎯
                </div>
              )}
            </div>
          </div>
        )}

        {scratched && (
          <div className="space-y-2">
            <p className={`font-medium ${
              isCurrentPlayer ? 'text-red-600' : 'text-green-600'
            }`}>
              {result?.isRandomTarget ? (
                result.originalDrawerNickname === currentPlayerNickname ? 
                  '🍀 운이 좋네요! 다른 사람이 벌칙을 받게 되었습니다!' :
                  result.winnerNickname === currentPlayerNickname ?
                    '😱 히든카드에 당첨되어 벌칙을 받게 되었습니다!' :
                    '🎴 히든카드가 발동되었습니다!'
              ) : (
                isCurrentPlayer
                  ? '😅 당신이 벌칙을 받았습니다!'
                  : '🎉 결과가 공개되었습니다!'
              )}
            </p>
            {revealed && (
              <p className="text-sm text-blue-600">
                📢 다른 참가자들에게 알림이 전송되었습니다!
              </p>
            )}
            {!hiddenCardAnimation && (
              <button
                onClick={onComplete}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                확인
              </button>
            )}
          </div>
        )}
      </div>

      {/* 새로운 히든카드 애니메이션 */}
      <HiddenCardAnimation
        isVisible={showHiddenCard}
        originalName={result?.originalDrawerNickname || ''}
        finalName={result?.winnerNickname || ''}
        onComplete={handleHiddenCardComplete}
      />
    </div>
  );
}

export default ScratchCardComponent;