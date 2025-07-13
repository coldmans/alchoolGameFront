import React, { useState, useEffect } from 'react';

interface HiddenCardAnimationProps {
  isVisible: boolean;
  originalName: string;
  finalName: string;
  onComplete: () => void;
}

function HiddenCardAnimation({ isVisible, originalName, finalName, onComplete }: HiddenCardAnimationProps) {
  const [phase, setPhase] = useState(0); // 0: 숨김, 1: 글리치, 2: 완료

  useEffect(() => {
    console.log('🎯 HiddenCardAnimation useEffect - isVisible:', isVisible);
    if (isVisible) {
      console.log('✅ 애니메이션 시작! phase를 1로 설정');
      setPhase(1);
      
      // 2.5초 후 완료 페이즈
      setTimeout(() => {
        console.log('⏰ 2.5초 후 - phase를 2로 설정');
        setPhase(2);
      }, 2500);
      
      // 5초 후 종료
      setTimeout(() => {
        console.log('⏰ 5초 후 - 애니메이션 종료');
        setPhase(0);
        onComplete();
      }, 5000);
    }
  }, [isVisible, onComplete]);

  console.log('🔍 렌더링 체크 - isVisible:', isVisible, 'phase:', phase);
  
  if (!isVisible || phase === 0) {
    console.log('💀 return null');
    return null;
  }
  
  console.log('✅ 실제 렌더링 진행');

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-95 flex items-center justify-center">
      {/* 글리치 중일 때 번쩍번쩍 효과 */}
      {phase === 1 && (
        <>
          <div className="absolute inset-0 bg-red-600 opacity-50 animate-ping"></div>
          <div className="absolute inset-0 bg-yellow-400 opacity-30 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-ping"></div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 animate-ping"></div>
          <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500 animate-ping"></div>
          <div className="absolute top-0 right-0 w-1 h-full bg-green-500 animate-ping"></div>
        </>
      )}
      
      <div className="text-center z-50 relative">
        {/* 메인 이모지 - 극적 효과 */}
        <div className={`text-9xl mb-6 drop-shadow-2xl ${
          phase === 1 ? 'animate-spin text-red-400' : 'animate-bounce text-yellow-400'
        }`} style={{
          filter: phase === 1 ? 'brightness(2) drop-shadow(0 0 30px #ff0000)' : 'drop-shadow(0 0 20px #ffff00)',
          textShadow: phase === 1 ? '0 0 50px #ff0000' : '0 0 30px #ffff00'
        }}>
          {phase === 1 ? '💀⚡💀' : '🎴✨🎯'}
        </div>
        
        {/* 메인 텍스트 - 극적 효과 */}
        <div className={`text-6xl font-bold mb-8 drop-shadow-2xl ${
          phase === 1 ? 'text-red-300 animate-pulse' : 'text-yellow-300 animate-bounce'
        }`} style={{
          textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
          filter: phase === 1 ? 'brightness(1.5)' : 'brightness(1.2)'
        }}>
          {phase === 1 ? '치지직... SYSTEM ERROR!' : '🎴 HIDDEN CARD 발동! 🎴'}
        </div>
        
        {/* 이름 변경 박스 - 극적 효과 */}
        <div className={`text-4xl font-bold p-6 rounded-2xl border-4 ${
          phase === 1 
            ? 'bg-red-700 text-white border-red-300 animate-pulse shadow-red-500/50' 
            : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black border-yellow-200 animate-bounce shadow-yellow-500/50'
        } shadow-2xl`} style={{
          boxShadow: phase === 1 
            ? '0 0 40px rgba(239, 68, 68, 0.8), inset 0 0 20px rgba(0,0,0,0.3)' 
            : '0 0 40px rgba(251, 191, 36, 0.8), inset 0 0 20px rgba(0,0,0,0.2)'
        }}>
          {phase === 1 ? (
            <div>
              <div className="text-2xl mb-2">슈퍼 크랙!!!!!!!.</div>
              <div>{originalName || 'Player'} → ???</div>
            </div>
          ) : (
            <div>
              <div className="text-2xl mb-2">🎯 타겟 스위치!</div>
              <div className="flex items-center justify-center gap-4">
                <span>{originalName || 'Player1'}</span>
                <span className="text-5xl animate-ping">→</span>
                <span className="animate-pulse">{finalName || 'Player2'}</span>
              </div>
            </div>
          )}
        </div>
      
        
        {/* 하단 메시지 */}
        {phase === 2 && (
          <div className="text-3xl text-yellow-200 font-bold mt-8 animate-pulse drop-shadow-lg">
            🎯 벌칙 대상이 바뀌었습니다! 🎯
          </div>
        )}
      </div>
    </div>
  );
}

export default HiddenCardAnimation;