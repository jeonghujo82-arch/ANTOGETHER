import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import antogetherLogo from "../assets/antogether-logo.svg";
import { toast } from 'sonner';

interface RegularSignupFormProps {
  onSignup: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    agreeTerms: boolean;
    agreePrivacy: boolean;
  }) => void;
  onBack: () => void;
}

export function RegularSignupForm({ onSignup, onBack }: RegularSignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    agreeTerms: false,
    agreePrivacy: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string; confirmPassword?: string }>({});

  // 유효성 검사 함수
  const validateEmail = (value: string) => /^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(value);
  const validatePhone = (value: string) => /^01[016789]-\d{3,4}-\d{4}$/.test(value);
  const validatePassword = (value: string) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=]).{8,20}$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('회원가입 폼 제출 시작'); // 디버깅용
    
    const newErrors: typeof errors = {};
    if (!validateEmail(formData.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    if (!validatePhone(formData.phone)) newErrors.phone = '휴대폰 번호는 010-0000-0000 형식이어야 합니다.';
    if (!validatePassword(formData.password)) newErrors.password = '비밀번호는 8~20자, 영문/숫자/특수문자를 모두 포함해야 합니다.';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    
    console.log('유효성 검사 결과:', newErrors); // 디버깅용
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.log('유효성 검사 실패로 종료'); // 디버깅용
      return;
    }
    
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      console.log('약관 동의 체크 실패'); // 디버깅용
      toast.error('이용약관과 개인정보처리방침에 동의해주세요.');
      return;
    }
    
    console.log('모든 검증 통과, API 호출 시작'); // 디버깅용
    // 모든 유효성 통과 시 users.sql에 저장(백엔드 API 호출)
    const user = {
      email: formData.email,
      password: formData.password,
      username: formData.name,
      phone: formData.phone
    };
    
    console.log('회원가입 요청 데이터:', user); // 디버깅용
    
    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(user)
      });
      
      console.log('응답 상태:', res.status);
      console.log('응답 헤더:', Object.fromEntries(res.headers.entries()));
      
      const responseText = await res.text();
      console.log('응답 텍스트:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        toast.error('서버 응답 형식이 올바르지 않습니다.');
        return;
      }
      
      console.log('회원가입 응답:', result); // 디버깅용
      
      if (res.ok && result.message === '회원가입 성공') {
        toast.success('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
        // 폼 데이터 초기화
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          phone: '',
          agreeTerms: false,
          agreePrivacy: false
        });
        setErrors({});
        onSignup(formData); // 화면 전환 (App.tsx에서 setAuthView('login') 실행)
      } else {
        toast.error(result.message || '회원가입 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('회원가입 API 호출 실패:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
      } else {
        toast.error('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // API 테스트 함수 (임시)
  const testAPI = async () => {
    console.log('API 테스트 시작');
    try {
      const res = await fetch('http://localhost:5000/test');
      const result = await res.json();
      console.log('API 테스트 결과:', result);
      toast.success('API 연결 성공!');
    } catch (error) {
      console.error('API 테스트 실패:', error);
      toast.error('API 연결 실패!');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col text-white">
      {/* 상단 헤더 */}
      <div className="h-14 flex items-center justify-between px-4 text-white">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-base">회원가입</span>
        <div className="w-9"></div>
      </div>

      <div className="flex-1 px-4 pb-8 overflow-y-auto">
        <div className="max-w-sm mx-auto space-y-6">
          {/* 로고 */}
          <div className="text-center space-y-2 mt-8">
            <div className="w-12 h-12 mx-auto mb-3">
              <div className="w-full h-full bg-white rounded-lg flex items-center justify-center p-2">
                <img 
                  src={antogetherLogo} 
                  alt="ANT TOGETHER" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="이메일"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full h-12 bg-white text-black rounded-full px-4 border-0 placeholder:text-gray-400"
                required
              />
              {errors.email && <div className="text-red-500 text-xs mt-1">{errors.email}</div>}

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호 (8~20자, 영문/숫자/특수문자 포함)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full h-12 bg-white text-black rounded-full px-4 pr-12 border-0 placeholder:text-gray-400"
                  required
                />
                {errors.password && <div className="text-red-500 text-xs mt-1">{errors.password}</div>}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full h-12 bg-white text-black rounded-full px-4 pr-12 border-0 placeholder:text-gray-400"
                  required
                />
                {errors.confirmPassword && <div className="text-red-500 text-xs mt-1">{errors.confirmPassword}</div>}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <Input
                type="text"
                placeholder="이름"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full h-12 bg-white text-black rounded-full px-4 border-0 placeholder:text-gray-400"
                required
              />

              <Input
                type="tel"
                placeholder="휴대폰 번호 (예: 010-0000-0000)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full h-12 bg-white text-black rounded-full px-4 border-0 placeholder:text-gray-400"
                required
              />
              {errors.phone && <div className="text-red-500 text-xs mt-1">{errors.phone}</div>}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 mt-6">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => handleInputChange('agreeTerms', checked as boolean)}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <label htmlFor="terms" className="text-sm text-gray-300">
                  이용약관에 동의합니다 (필수)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="privacy"
                  checked={formData.agreePrivacy}
                  onCheckedChange={(checked) => handleInputChange('agreePrivacy', checked as boolean)}
                  className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                />
                <label htmlFor="privacy" className="text-sm text-gray-300">
                  개인정보처리방침에 동의합니다 (필수)
                </label>
              </div>
            </div>

            {/* 임시 API 테스트 버튼 */}
            <Button
              type="button"
              onClick={testAPI}
              className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm mb-2"
            >
              API 연결 테스트
            </Button>

            <Button
              type="submit"
              className="w-full h-12 bg-gray-200 hover:bg-gray-300 text-black rounded-full text-base mt-6"
            >
              가입하기
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}