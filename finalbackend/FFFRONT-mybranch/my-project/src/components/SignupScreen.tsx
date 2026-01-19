import { Button } from './ui/button';
import { X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import antogetherLogo from '../assets/antogether-logo.svg';
import naverLogo from '../assets/naver-logo.svg';
import kakaoLogo from '../assets/KakaoTalk_logo.svg';
import googleLogo from '../assets/google.svg';
import appleLogo from '../assets/Apple.svg';

interface SignupScreenProps {
  onSocialSignup: (provider: 'naver' | 'kakao' | 'google' | 'apple') => Promise<void>;
  onShowRegularSignup: () => void;
  onBack: () => void;
}

export function SignupScreen({ onSocialSignup, onShowRegularSignup, onBack }: SignupScreenProps) {
  return (
    <div className="min-h-screen bg-[#0E0E0E] flex flex-col items-center justify-center p-4 text-white">
      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 text-white">
        <div className="flex items-center space-x-2">
          <span className="text-sm">회원가입</span>
        </div>
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="w-full max-w-sm space-y-8 mt-16">
        {/* 로고 */}
        <div className="text-center space-y-6 mt-16">
          <div className="w-80 h-60 mx-auto p-6 bg-[#0E0E0E]">
            <img 
              src={antogetherLogo} 
              alt="ANT TOGETHER" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* 소셜 회원가입 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={async () => await onSocialSignup('naver')}
            className="w-full h-12 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center space-x-2 transition-colors"
          >
            <img 
              src={naverLogo} 
              alt="Naver" 
              className="w-6 h-6 object-contain"
            />
            <span>네이버 계정으로 가입하기</span>
          </button>

          <button
            onClick={async () => await onSocialSignup('kakao')}
            className="w-full h-12 bg-[#FAE200] hover:bg-[#E6CC00] text-black rounded-full flex items-center justify-center space-x-2 transition-colors"
          >
            <img 
              src={kakaoLogo} 
              alt="Kakao" 
              className="w-6 h-6 object-contain"
            />
            <span>카카오 계정으로 가입하기</span>
          </button>

          <button
            onClick={async () => await onSocialSignup('google')}
            className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-full flex items-center justify-center space-x-2 transition-colors"
          >
            <img 
              src={googleLogo} 
              alt="Google" 
              className="w-6 h-6 object-contain"
            />
            <span>google 계정으로 가입하기</span>
          </button>

          <button
            onClick={async () => await onSocialSignup('apple')}
            className="w-full h-12 bg-white hover:bg-gray-100 text-black rounded-full flex items-center justify-center space-x-2 transition-colors"
          >
            <img 
              src={appleLogo} 
              alt="Apple" 
              className="w-6 h-6 object-contain"
            />
            <span>Apple로 계속</span>
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-gray-400 text-sm">또는</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {/* 일반 가입하기 버튼 */}
        <Button
          onClick={onShowRegularSignup}
          className="w-full h-12 bg-gray-200 hover:bg-gray-300 text-black rounded-full text-base"
        >
          일반 가입하기
        </Button>
      </div>
    </div>
  );
}