import { useState, useEffect } from 'react';
import { CalendarSidebar } from './components/CalendarSidebar';
import type { CalendarItem } from './components/CalendarSidebar';
import { CalendarView } from './components/CalendarView';
import { ChatBot } from './components/ChatBot';
import { Community } from './components/Community';
import { PostDetailView } from './components/PostDetailView';
import { MobileNavigation } from './components/MobileNavigation';
import { AddEventDialog } from './components/AddEventDialog';
import { DayEventsDialog } from './components/DayEventsDialog';
import { AuthScreen } from './components/AuthScreen';
import { SignupScreen } from './components/SignupScreen';
import { RegularSignupForm } from './components/RegularSignupForm';
import { FeaturePanel } from './components/FeaturePanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { Menu, Bot, Bell } from 'lucide-react';
import { AiPreviewDialog } from './components/AiPreviewDialog';
import { fetchAiEventPreview } from './utils/notificationApi';

interface Event {
  id: string;
  title: string;
  content: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  color: string;
  calendarId: string;
  images?: string[]; // 이벤트 이미지 URL 배열
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  isPinned: boolean;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  announcementId: string;
}

interface Notification {
  share_id: string;
  calendar_id: string;
  calendar_name: string;
  inviter_name: string;
  role: string;
  created_at: string;
}

type AuthView = 'login' | 'signup' | 'regular-signup';

export default function App() {
  // Force dark theme on app initialization
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // 인증 API 연동 함수
  async function apiRegister(user: any) {
    const res = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return res.json();
  }

  async function apiLogin(user: any) {
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(user)
    });
    return res.json();
  }

  async function apiLogout() {
    const res = await fetch('http://localhost:5000/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  }

  async function apiGetNotifications(userNum: number) {
    const res = await fetch(`http://localhost:5000/api/notifications?user_num=${userNum}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }

  async function apiRespondToNotification(shareId: string, status: 'accepted' | 'declined') {
    const res = await fetch('http://localhost:5000/api/notifications/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_id: shareId, status: status })
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  }

  // 이벤트 API 연동 함수
  async function apiCreateEvent(eventData: any) {
    console.log('이벤트 생성 요청 데이터:', eventData);
    
    const res = await fetch('http://localhost:5000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`HTTP error! status: ${res.status}, response: ${errorText}`);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  }

  async function apiGetEvents(calendarId: string, userNum: number) {
    const res = await fetch(`http://localhost:5000/api/events/${calendarId}/${userNum}`);
    return res.json();
  }

  // 캘린더 API 연동 함수
  async function apiCreateCalendar(calendarData: any) {
    const res = await fetch('http://localhost:5000/api/calendars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarData)
    });
    return res.json();
  }

  async function apiGetUserCalendars(userNum: number) {
    const res = await fetch(`http://localhost:5000/api/calendars/${userNum}`);
    return res.json();
  }

  // 사용자의 모든 이벤트 가져오기 API
  async function apiGetUserAllEvents(userNum: number) {
    const res = await fetch(`http://localhost:5000/api/user/${userNum}/events`);
    return res.json();
  }

  // 이벤트 삭제 API
  async function apiDeleteEvent(eventId: string) {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('이벤트 삭제 오류 응답:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      
      const result = await res.json();
      console.log('이벤트 삭제 결과:', result);
      return result;
    } catch (error) {
      console.error('이벤트 삭제 API 오류:', error);
      throw error;
    }
  }

  // 인증 상태 관리
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [user, setUser] = useState<{ email: string; name: string; user_num?: number } | null>(null);

  // 알림 상태 관리
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);

  // AI 비서 상태 관리
  const [aiEventPreview, setAiEventPreview] = useState<any | null>(null);
  const [showAiPreviewDialog, setShowAiPreviewDialog] = useState(false);

  // 페이지 로드 시 사용자 상태 복원
  useEffect(() => {
    console.log('페이지 로드: 사용자 상태 복원 시작');
    const savedUser = localStorage.getItem('user');
    const savedAuthState = localStorage.getItem('isAuthenticated');
    
    console.log('저장된 사용자 정보:', savedUser);
    console.log('저장된 인증 상태:', savedAuthState);
    
    if (savedUser && savedAuthState === 'true') {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log('파싱된 사용자 데이터:', parsedUser);
        
        // user_num이 있는지 확인
        if (parsedUser && parsedUser.user_num) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('사용자 상태 복원 성공:', parsedUser);
        } else {
          console.error('사용자 데이터에 user_num이 없음:', parsedUser);
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
        }
      } catch (error) {
        console.error('사용자 상태 복원 실패:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
      }
    }
  }, []);

  // 사용자가 로그인된 상태에서 캘린더와 이벤트 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      if (user && user.user_num && isAuthenticated) {
        try {
          console.log('사용자 데이터 로드 시작:', user);
          
          // 캘린더 로드
          const calendarsResult = await apiGetUserCalendars(user.user_num);
          console.log('캘린더 조회 결과:', calendarsResult);
          
          if (calendarsResult.message === '캘린더 조회 성공' && calendarsResult.calendars) {
            if (calendarsResult.calendars.length === 0) {
              // 캘린더가 없으면 기본 캘린더 생성
              console.log('캘린더가 없어서 기본 캘린더 생성');
              const defaultCalendarData = {
                calendar_name: '내 캘린더',
                calendar_purpose: '개인',
                calendar_color: 'rgb(176, 224, 230)',
                user_num: user.user_num
              };
              
              const createResult = await apiCreateCalendar(defaultCalendarData);
              if (createResult.message === '캘린더 생성 성공') {
                const newCalendar = {
                  id: createResult.calendar_id.toString(),
                  name: '내 캘린더',
                  purpose: '개인',
                  color: 'rgb(176, 224, 230)',
                  isActive: true,
                  memberCount: 1
                };
                setCalendars([newCalendar]);
                setSelectedCalendarId(newCalendar.id);
                setEvents([]);
              }
            } else {
              // 기존 캘린더들 로드
              const userCalendars = calendarsResult.calendars.map((cal: any) => ({
                id: cal.calendar_id.toString(),
                name: cal.calendar_name,
                purpose: cal.calendar_purpose,
                color: cal.calendar_color,
                isActive: true,
                memberCount: 1
              }));
              
              setCalendars(userCalendars);
              
              // 선택된 캘린더가 없을 때만 첫 번째 캘린더 선택
              setSelectedCalendarId(prev => prev || userCalendars[0]?.id || null);
            }
          }
          
          // 이벤트 로드
          const eventsResult = await apiGetUserAllEvents(user.user_num);
          if (eventsResult.message === '사용자 전체 이벤트 조회 성공' && eventsResult.events) {
            const fetchedEvents = eventsResult.events.map((event: any) => ({
              id: event.event_id.toString(),
              title: event.title,
              content: event.content || '',
              startDate: new Date(event.start_date + 'T' + (event.start_time || '00:00')),
              endDate: new Date(event.end_date + 'T' + (event.end_time || '23:59')),
              startTime: event.start_time || '00:00',
              endTime: event.end_time || '23:59',
              color: event.color || 'rgb(220, 53, 69)',
              calendarId: event.calendar_id.toString(),
              images: []
            }));
            setEvents(fetchedEvents);
            console.log('이벤트 로드 완료:', fetchedEvents);
          }
          
          // Fetch notifications
          try {
            console.log('Fetching notifications for user_num:', user.user_num);
            const fetchedNotifications = await apiGetNotifications(user.user_num);
            setNotifications(fetchedNotifications);
            if (fetchedNotifications.length > 0) {
              setCurrentNotification(fetchedNotifications[0]);
              setShowNotificationToast(true);
            }
          } catch (error) {
            console.error('알림 로드 실패:', error);
          }

        } catch (error) {
          console.error('사용자 데이터 로드 실패:', error);
        }
      }
    };
    
    loadUserData();
  }, [user?.user_num, isAuthenticated]); // selectedCalendarId 제거

  const handleLogin = async (email: string, password: string) => {
    console.log('로그인 시도:', email, password); // 디버깅용
    
    try {
      const result = await apiLogin({ email, password });
      console.log('로그인 API 응답:', result); // 디버깅용
      
      if (result.message === '로그인 성공' && result.user) {
        console.log('백엔드 사용자 데이터:', result.user);
        
        const userData = { 
          email, 
          name: result.user.username || email.split('@')[0],
          user_num: result.user.user_num || result.user.id // user_num이 없으면 id 사용
        };
        
        console.log('처리된 사용자 데이터:', userData);
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // localStorage에 사용자 상태 저장
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAuthenticated', 'true');
        
        toast.success('로그인 성공!');
        
        // useEffect에서 자동으로 데이터가 로드됩니다
      } else {
        console.log('로그인 실패:', result);
        toast.error('로그인 실패: 아이디 또는 비밀번호를 확인하세요.');
      }
    } catch (error) {
      console.error('로그인 API 호출 실패:', error);
      toast.error('네트워크 오류가 발생했습니다.');
    }
  };

  const [currentView, setCurrentView] = useState<'calendar' | 'community' | 'post-detail' | 'chat' | 'features'>('calendar');
  const [mobileView, setMobileView] = useState<'calendar' | 'chat'>('calendar');
  const [selectedCommunity, setSelectedCommunity] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedPost, setSelectedPost] = useState<Announcement | null>(null);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [isCalendarsOpen, setIsCalendarsOpen] = useState(false);
  
  // 캘린더 데이터 상태
  const [calendars, setCalendars] = useState<CalendarItem[]>([
    {
      id: '1',
      name: '게임 스케줄',
      purpose: '게임',
      color: 'rgb(176, 224, 230)', // 파우더블루
      isActive: true,
      memberCount: 12
    },
    {
      id: '2',
      name: '운동 계획',
      purpose: '운동',
      color: 'rgb(189, 236, 182)', // 민트그린
      isActive: false,
      memberCount: 5
    }
  ]);
  
  // 각 캘린더별 독립적인 현재 날짜 상태
  const [calendarDates, setCalendarDates] = useState<{ [key: string]: Date }>({
    '1': new Date(), // 게임 스케줄
    '2': new Date()  // 운동 계획
  });

  // 이벤트 다이얼로그 상태들
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isDayEventsOpen, setIsDayEventsOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<Date | null>(null);

  // 이벤트 데이터 상태
  const [events, setEvents] = useState<Event[]>([
    // 게임 스케줄 일정들
    {
      id: '1',
      title: '팀 게임 대회',
      content: '월간 팀 토너먼트 참가',
      startDate: new Date(2025, 0, 15),
      endDate: new Date(2025, 0, 15),
      startTime: '20:00',
      endTime: '23:00',
      color: 'rgb(176, 224, 230)', // 파우더블루
      calendarId: '1'
    },
    {
      id: '3',
      title: '게임 스트리밍',
      content: '신작 게임 첫 플레이 스트리밍',
      startDate: new Date(2025, 0, 20),
      endDate: new Date(2025, 0, 20),
      startTime: '19:00',
      endTime: '21:00',
      color: 'rgb(221, 191, 255)', // 라벤더
      calendarId: '1'
    },
    {
      id: '4',
      title: '온라인 토너먼트',
      content: '시즌 마지막 토너먼트',
      startDate: new Date(2025, 0, 25),
      endDate: new Date(2025, 0, 26),
      startTime: '21:00',
      endTime: '02:00',
      color: 'rgb(135, 206, 235)', // 스카이블루
      calendarId: '1'
    },
    {
      id: '5',
      title: '게임 리뷰 미팅',
      content: '팀원들과 전략 논의',
      startDate: new Date(2025, 0, 28),
      endDate: new Date(2025, 0, 28),
      startTime: '18:30',
      endTime: '20:00',
      color: 'rgb(173, 216, 230)', // 베이비블루
      calendarId: '1'
    },
    // 운동 계획 일정들
    {
      id: '2',
      title: '운동 모임',
      content: '주간 그룹 운동 세션',
      startDate: new Date(2025, 0, 18),
      endDate: new Date(2025, 0, 18),
      startTime: '18:00',
      endTime: '19:30',
      color: 'rgb(189, 236, 182)', // 민트그린
      calendarId: '2'
    },
    {
      id: '6',
      title: '주말 등산',
      content: '북한산 등반',
      startDate: new Date(2025, 0, 22),
      endDate: new Date(2025, 0, 22),
      startTime: '08:00',
      endTime: '17:00',
      color: 'rgb(197, 225, 197)', // 세이지민트
      calendarId: '2'
    },
    {
      id: '7',
      title: '헬스장 PT',
      content: '개인 트레이너 세션',
      startDate: new Date(2025, 0, 24),
      endDate: new Date(2025, 0, 24),
      startTime: '19:00',
      endTime: '20:00',
      color: 'rgb(192, 242, 233)', // 소프트민트
      calendarId: '2'
    },
    {
      id: '8',
      title: '수영 레슨',
      content: '자유형 기술 향상',
      startDate: new Date(2025, 0, 26),
      endDate: new Date(2025, 0, 26),
      startTime: '10:00',
      endTime: '11:00',
      color: 'rgb(255, 182, 193)', // 베이비핑크
      calendarId: '2'
    }
  ]);

  // 커뮤니티 게시글 및 댓글 데이터 (샘플)
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: '월간 토너먼트 공지',
      content: '다음 달 토너먼트 일정을 안내드립니다.\n\n참가 신청은 커뮤니티 게시판에 댓글로 남겨주세요.',
      author: '관리자',
      timestamp: new Date(2025, 0, 10),
      isPinned: true
    },
    {
      id: '2',
      title: '새로운 멤버 환영',
      content: '새롭게 합류한 멤버들을 환영합니다!',
      author: '김게임',
      timestamp: new Date(2025, 0, 12),
      isPinned: false
    }
  ]);

  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      content: '토너먼트 참가 신청합니다!',
      author: '플레이어1',
      timestamp: new Date(2025, 0, 11),
      announcementId: '1'
    },
    {
      id: '2',
      content: '저도 참가하고 싶어요',
      author: '게이머2',
      timestamp: new Date(2025, 0, 11, 14, 30),
      announcementId: '1'
    },
    {
      id: '3',
      content: '환영합니다!',
      author: '베테랑',
      timestamp: new Date(2025, 0, 12, 10, 15),
      announcementId: '2'
    }
  ]);

  // 인증 관련 핸들러들

  const handleSocialLogin = async (provider: 'naver' | 'kakao' | 'google' | 'apple') => {
    // 실제 구현에서는 소셜 로그인 API 연동
    console.log('소셜 로그인:', provider);
    const providerNames = {
      naver: '네이버',
      kakao: '카카오',
      google: '구글',
      apple: '애플'
    };
    setUser({ email: `user@${provider}.com`, name: `${providerNames[provider]} 사용자` });
    setIsAuthenticated(true);
    toast.success(`${providerNames[provider]} 로그인되었습니다!`);
  };

  const handleSocialSignup = async (provider: 'naver' | 'kakao' | 'google' | 'apple') => {
    const providerNames = {
      naver: '네이버',
      kakao: '카카오',
      google: '구글',
      apple: '애플'
    };
    const user = {
      user_id: `newuser_${provider}`,
      user_mail: `newuser@${provider}.com`,
      user_name: `${providerNames[provider]} 사용자`,
      user_pass: 'social',
      user_phone: ''
    };
    const result = await apiRegister(user);
    if (result.message === '가입 성공') {
      setUser({ email: user.user_mail, name: user.user_name });
      setIsAuthenticated(true);
      toast.success(`${providerNames[provider]} 계정으로 가입되었습니다!`);
    } else {
      toast.error(`회원가입 실패: ${result.message}`);
    }
  };

  const handleRegularSignup = async (data: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone: string;
    agreeTerms: boolean;
    agreePrivacy: boolean;
  }) => {
    try {
      const user = {
        email: data.email,
        username: data.name,
        password: data.password,
        phone: data.phone
      };
      
      const result = await apiRegister(user);
      console.log('회원가입 결과:', result);
      
      if (result.message === '가입 성공') {
        toast.success('회원가입이 완료되었습니다!');
        
        // 회원가입 성공 후 자동 로그인 시도
        try {
          const loginResult = await apiLogin({ email: data.email, password: data.password });
          
          if (loginResult.message === '로그인 성공' && loginResult.user) {
            console.log('자동 로그인 백엔드 사용자 데이터:', loginResult.user);
            
            const userData = { 
              email: data.email, 
              name: loginResult.user.username || data.name,
              user_num: loginResult.user.user_num || loginResult.user.id // user_num이 없으면 id 사용
            };
            
            console.log('자동 로그인 처리된 사용자 데이터:', userData);
            
            setUser(userData);
            setIsAuthenticated(true);
            
            // localStorage에 사용자 상태 저장
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('isAuthenticated', 'true');
            
            toast.success('자동 로그인되었습니다!');
          } else {
            // 자동 로그인 실패 시 로그인 화면으로 이동
            setAuthView('login');
          }
        } catch (loginError) {
          console.error('자동 로그인 실패:', loginError);
          setAuthView('login');
        }
      } else {
        toast.error(`회원가입 실패: ${result.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('회원가입 API 오류:', error);
      toast.error('회원가입 중 네트워크 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      console.log('로그아웃 API 호출 성공');
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
      // API 호출 실패해도 프론트엔드 상태는 초기화
    }
    
    // localStorage에서 사용자 상태 제거
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // 인증 상태만 초기화 (캘린더와 이벤트는 DB에 저장되므로 유지)
    setIsAuthenticated(false);
    setUser(null);
    setAuthView('login');
    
    // UI 상태만 초기화
    setSelectedCalendarId(null);
    setSelectedPost(null);
    setSelectedDateForEvent(null);
    setIsAddEventOpen(false);
    setIsDayEventsOpen(false);
    
    toast.success('로그아웃되었습니다.');
  };

  const handleAcceptNotification = async () => {
    if (currentNotification && user?.user_num) {
      try {
        console.log('Accepting notification:', currentNotification.share_id, 'Status: accepted');
        await apiRespondToNotification(currentNotification.share_id, 'accepted');
        toast.success(`'${currentNotification.calendar_name}' 캘린더 초대를 수락했습니다.`);
        // Remove the accepted notification and show the next one if available
        setNotifications(prev => prev.filter(n => n.share_id !== currentNotification.share_id));
        setShowNotificationToast(false); // Hide current toast
        setCurrentNotification(null); // Clear current notification
        if (notifications.length > 0) { // If there are more notifications
          setCurrentNotification(notifications[0]); // Set next notification
          setShowNotificationToast(true); // Show next toast
        }
        // Re-fetch calendars to update the UI with the newly joined calendar
        if (user.user_num) {
          const calendarsResult = await apiGetUserCalendars(user.user_num);
          if (calendarsResult.message === '캘린더 조회 성공' && calendarsResult.calendars) {
            const userCalendars = calendarsResult.calendars.map((cal: any) => ({
              id: cal.calendar_id.toString(),
              name: cal.calendar_name,
              purpose: cal.calendar_purpose,
              color: cal.calendar_color,
              isActive: true,
              memberCount: 1
            }));
            setCalendars(userCalendars);
          }
        }
      } catch (error) {
        console.error('알림 수락 실패:', error);
        toast.error('알림 수락에 실패했습니다.');
      }
    }
  };

  const handleDeclineNotification = async () => {
    if (currentNotification) {
      try {
        console.log('Declining notification:', currentNotification.share_id, 'Status: declined');
        await apiRespondToNotification(currentNotification.share_id, 'declined');
        toast.info(`'${currentNotification.calendar_name}' 캘린더 초대를 거절했습니다.`);
        // Remove the declined notification and show the next one if available
        setNotifications(prev => prev.filter(n => n.share_id !== currentNotification.share_id));
        setShowNotificationToast(false); // Hide current toast
        setCurrentNotification(null); // Clear current notification
        if (notifications.length > 0) { // If there are more notifications
          setCurrentNotification(notifications[0]); // Set next notification
          setShowNotificationToast(true); // Show next toast
        }
      } catch (error) {
        console.error('알림 거절 실패:', error);
        toast.error('알림 거절에 실패했습니다.');
      }
    }
  };

  // AI 비서 관련 핸들러
  const handleShowAiPreview = async () => {
    if (!user || !user.user_num) {
      toast.error('AI 비서를 사용하려면 로그인이 필요합니다.');
      return;
    }
    if (!selectedCalendarId) {
      toast.error('AI 일정을 추가할 캘린더를 먼저 선택해주세요.');
      return;
    }

    try {
      toast.info('AI 비서가 일정을 분석하고 있습니다...');
      const previewData = await fetchAiEventPreview(user.user_num, selectedCalendarId);
      if (previewData) {
        setAiEventPreview(previewData);
        setShowAiPreviewDialog(true);
      } else {
        toast.error('AI 일정 정보를 가져오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('AI Preview Fetch Error:', error);
      toast.error('AI 비서 호출 중 오류가 발생했습니다.');
    }
  };

  const handleConfirmAiEvent = () => {
    if (!aiEventPreview) return;

    // Map snake_case from AI preview to camelCase for handleAddEvent
    const eventDataForCreation = {
      title: aiEventPreview.title,
      content: aiEventPreview.content,
      startDate: new Date(aiEventPreview.start_date),
      endDate: new Date(aiEventPreview.end_date),
      startTime: aiEventPreview.start_time,
      endTime: aiEventPreview.end_time,
      color: aiEventPreview.color,
    };
    
    handleAddEvent(eventDataForCreation);
    setShowAiPreviewDialog(false);
    setAiEventPreview(null);
  };

  // 인증되지 않은 상태에서 인증 화면 렌더링
  if (!isAuthenticated) {
    switch (authView) {
      case 'login':
        return (
          <>
            <AuthScreen
              onLogin={handleLogin}
              onSocialLogin={handleSocialLogin}
              onShowSignup={() => setAuthView('signup')}
            />
            <Toaster />
          </>
        );
      case 'signup':
        return (
          <>
            <SignupScreen
              onSocialSignup={handleSocialSignup}
              onShowRegularSignup={() => setAuthView('regular-signup')}
              onBack={() => setAuthView('login')}
            />
            <Toaster />
          </>
        );
      case 'regular-signup':
        return (
          <>
            <RegularSignupForm
              onSignup={handleRegularSignup}
              onBack={() => setAuthView('signup')}
            />
            <Toaster />
          </>
        );
      default:
        return null;
    }
  }

  // 기존 캘린더 앱 로직 (인증 후)
  const handleCalendarClick = (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    setCurrentView('calendar');
    setIsCalendarsOpen(false);
  };

  const handleCommunityClick = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    
    setSelectedCommunity({
      id: calendarId,
      name: calendar?.name || '알 수 없는 캘린더'
    });
    setCurrentView('community');
    setIsCalendarsOpen(false);
    // 모바일에서 커뮤니티 접근 시 캘린더 뷰로 설정 (커뮤니티는 오버레이로 표시)
    setMobileView('calendar');
  };

  const handlePostClick = (announcement: Announcement) => {
    setSelectedPost(announcement);
    setCurrentView('post-detail');
  };

  const handleBackToCommunity = () => {
    setSelectedPost(null);
    setCurrentView('community');
  };

  const handleBackToCalendar = () => {
    setCurrentView('calendar');
    setSelectedCommunity(null);
    setSelectedPost(null);
    setMobileView('calendar');
  };

  const handleBackToCalendarList = () => {
    setSelectedCalendarId(null);
    setCurrentView('calendar');
  };

  const handleDateChange = (calendarId: string, newDate: Date) => {
    setCalendarDates(prev => ({
      ...prev,
      [calendarId]: newDate
    }));
  };

  const handleDateClick = (date: Date) => {
    // 사용자 인증 상태 확인
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setSelectedDateForEvent(date);
    
    // 해당 날짜에 이벤트가 있는지 확인
    const eventsOnDate = selectedCalendarId ? getEventsForDate(date, selectedCalendarId) : [];
    
    if (eventsOnDate.length > 0) {
      // 이벤트가 있으면 이벤트 보기 다이얼로그 열기
      setIsDayEventsOpen(true);
    } else {
      // 이벤트가 없으면 바로 이벤트 추가 다이얼로그 열기
      setIsAddEventOpen(true);
    }
  };

  const handleAddNewEventFromDayView = () => {
    setIsDayEventsOpen(false);
    setIsAddEventOpen(true);
  };

  // 특정 날짜의 이벤트 가져오기 (시작일과 종료일 사이의 날짜 포함)
  const getEventsForDate = (date: Date, calendarId: string) => {
    return events.filter(event => {
      if (event.calendarId !== calendarId) return false;
      
      const eventStartDate = new Date(event.startDate);
      const eventEndDate = new Date(event.endDate);
      const targetDate = new Date(date);
      
      // 시간 정보를 제거하고 날짜만 비교
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      return targetDate >= eventStartDate && targetDate <= eventEndDate;
    });
  };

  const handleCreateCalendar = async (calendarData: CalendarItem | {
    name: string;
    purpose: string;
    color: string;
  }) => {
    if (!user?.user_num) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const newCalendarData = {
        calendar_name: calendarData.name,
        calendar_purpose: calendarData.purpose,
        calendar_color: calendarData.color,
        user_num: user.user_num
      };

      const result = await apiCreateCalendar(newCalendarData);
      
      if (result.message === 'Calendar created successfully') {
        const newCalendar = {
          id: result.calendar_id.toString(),
          name: calendarData.name,
          purpose: calendarData.purpose,
          color: calendarData.color,
          isActive: true,
          memberCount: 1
        };
        
        setCalendars(prev => [...prev, newCalendar]);
        setSelectedCalendarId(newCalendar.id);
        setCurrentView('calendar');
        setIsCalendarsOpen(false);
        
        // 새 캘린더의 현재 날짜 설정
        setCalendarDates(prev => ({
          ...prev,
          [newCalendar.id]: new Date()
        }));
        
        toast.success('새 캘린더가 생성되었습니다!');
      } else {
        toast.error('캘린더 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('캘린더 생성 에러:', error);
      toast.error('캘린더 생성 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCalendar = (calendarId: string) => {
    // 캘린더 목록에서 제거
    setCalendars(prev => prev.filter(cal => cal.id !== calendarId));
    
    // 해당 캘린더의 모든 이벤트 제거
    setEvents(prev => prev.filter(event => event.calendarId !== calendarId));
    
    // 해당 캘린더의 날짜 상태 제거
    setCalendarDates(prev => {
      const newDates = { ...prev };
      delete newDates[calendarId];
      return newDates;
    });
    
    // 현재 선택된 캘린더가 삭제되는 경우 처리
    if (selectedCalendarId === calendarId) {
      setSelectedCalendarId(null);
      setCurrentView('calendar');
    }
    
    // 현재 커뮤니티가 삭제되는 캘린더인 경우 처리
    if (selectedCommunity?.id === calendarId) {
      setSelectedCommunity(null);
      setCurrentView('calendar');
    }
  };

  const handleAddEvent = async (eventData: {
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    color: string;
    images?: string[];
  }) => {
    // 디버깅을 위한 로그
    console.log('handleAddEvent 호출됨');
    console.log('현재 사용자 상태:', user);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('selectedCalendarId:', selectedCalendarId);
    
    // 사용자 인증 확인
    if (!isAuthenticated || !user || !user.user_num) {
      console.error('인증 실패 - isAuthenticated:', isAuthenticated, 'user:', user);
      toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }

    if (!selectedCalendarId) {
      console.error('캘린더 선택 안됨 - selectedCalendarId:', selectedCalendarId);
      toast.error('캘린더를 선택해주세요.');
      return;
    }

    // 날짜를 로컬 시간으로 포맷 (UTC 변환으로 인한 날짜 변경 방지)
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const backendEventData = {
      title: eventData.title,
      content: eventData.content,
      start_date: formatLocalDate(eventData.startDate),
      end_date: formatLocalDate(eventData.endDate),
      start_time: eventData.startTime,
      end_time: eventData.endTime,
      color: eventData.color,
      calendar_id: selectedCalendarId,
      user_num: user.user_num
    };

    try {
      // 백엔드로 이벤트 데이터 전송
      const result = await apiCreateEvent(backendEventData);
      
      if (result.message === '이벤트 생성 성공') {
        // 프론트엔드 상태 업데이트
        const newEvent: Event = {
          id: result.event_id.toString(),
          title: eventData.title,
          content: eventData.content,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          color: eventData.color,
          calendarId: selectedCalendarId || '',
          images: eventData.images
        };

        console.log('새 이벤트 추가 중:', newEvent);
        console.log('이전 이벤트 상태:', events);
        
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        console.log('업데이트된 이벤트 상태:', updatedEvents);
        
        // 이벤트 추가 후 AddEventDialog 닫기
        setIsAddEventOpen(false);
        
        toast.success('일정이 추가되었습니다!');
        
        // 현재 선택된 캘린더의 이벤트를 다시 불러오기
        if (selectedCalendarId && user?.user_num) {
          apiGetUserAllEvents(user.user_num).then(result => {
            if (result.message === '사용자 전체 이벤트 조회 성공' && result.events) {
              const fetchedEvents = result.events.map((event: any) => ({
                id: event.event_id.toString(),
                title: event.title,
                content: event.content || '',
                startDate: new Date(event.start_date + 'T' + (event.start_time || '00:00')),
                endDate: new Date(event.end_date + 'T' + (event.end_time || '23:59')),
                startTime: event.start_time || '00:00',
                endTime: event.end_time || '23:59',
                color: event.color || 'rgb(220, 53, 69)',
                calendarId: event.calendar_id.toString(),
                images: []
              }));
              setEvents(fetchedEvents);
            }
          }).catch(error => {
            console.error('이벤트 새로고침 실패:', error);
          });
        }
      } else {
        console.error('이벤트 생성 실패:', result);
        toast.error('일정 추가에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('이벤트 생성 API 에러:', error);
      
      // 더 구체적인 에러 메시지
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          toast.error('잘못된 요청입니다. 모든 필드를 올바르게 입력했는지 확인해주세요.');
        } else if (error.message.includes('401')) {
          toast.error('인증이 필요합니다. 다시 로그인해주세요.');
        } else if (error.message.includes('500')) {
          toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          toast.error('일정 추가 중 네트워크 오류가 발생했습니다.');
        }
      } else {
        toast.error('일정 추가 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    // 디버깅을 위한 로그
    console.log('handleDeleteEvent 호출됨');
    console.log('삭제할 이벤트 ID:', eventId);
    console.log('현재 사용자 상태:', user);
    console.log('isAuthenticated:', isAuthenticated);
    
    // 사용자 인증 확인
    if (!isAuthenticated || !user || !user.user_num) {
      console.error('삭제 권한 없음 - isAuthenticated:', isAuthenticated, 'user:', user);
      toast.error('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }

    if (!eventId) {
      console.error('이벤트 ID가 없음');
      toast.error('삭제할 이벤트를 선택해주세요.');
      return;
    }

    try {
      // 사용자에게 삭제 확인
      if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
        return;
      }

      console.log('이벤트 삭제 API 호출 시작');
      
      // 백엔드로 이벤트 삭제 요청
      const result = await apiDeleteEvent(eventId);
      
      if (result.message === '이벤트 삭제 성공') {
        // 프론트엔드 상태에서 이벤트 제거
        const updatedEvents = events.filter(event => event.id !== eventId);
        setEvents(updatedEvents);
        console.log('이벤트 삭제 완료. 업데이트된 이벤트 상태:', updatedEvents);
        
        toast.success('일정이 삭제되었습니다!');
      } else {
        console.error('이벤트 삭제 실패:', result);
        toast.error('일정 삭제에 실패했습니다: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('이벤트 삭제 API 에러:', error);
      
      // 더 구체적인 에러 메시지
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          toast.error('존재하지 않는 일정입니다.');
        } else if (error.message.includes('401')) {
          toast.error('삭제 권한이 없습니다. 다시 로그인해주세요.');
        } else if (error.message.includes('500')) {
          toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          toast.error('일정 삭제 중 네트워크 오류가 발생했습니다.');
        }
      } else {
        toast.error('일정 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleUpdateEvent = (eventId: string, updatedEvent: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, ...updatedEvent }
        : event
    ));
  };

  // 커뮤니티 관련 핸들러들
  const handleAddComment = (announcementId: string, content: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author: user?.name || '나',
      timestamp: new Date(),
      announcementId
    };
    setComments(prev => [...prev, newComment]);
    toast.success('댓글이 추가되었습니다.');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    toast.success('댓글이 삭제되었습니다.');
  };

  // 선택된 캘린더의 이벤트만 필터링
  const getEventsForCalendar = (calendarId: string) => {
    console.log('필터링 중 - 전체 이벤트:', events);
    console.log('필터링 중 - 캘린더 ID:', calendarId);
    const filteredEvents = events.filter(event => event.calendarId === calendarId);
    console.log('필터링된 이벤트:', filteredEvents);
    return filteredEvents;
  };

  const handleToggleCommunity = () => {
    // 토글 버튼을 누르면 캘린더 뷰로 돌아감
    setCurrentView('calendar');
    setSelectedCommunity(null);
  };

  const handleViewChange = (view: 'calendar' | 'community' | 'chat' | 'features') => {
    setCurrentView(view);
    if (view !== 'community') {
      setSelectedCommunity(null);
    }
  };

  const handleOpenFeatures = () => {
    setCurrentView('features');
  };

  const handleBackFromFeatures = () => {
    setCurrentView('calendar');
  };

  const handleMobileViewChange = (view: 'calendar' | 'chat') => {
    setMobileView(view);
    // 모바일에서는 커뮤니티 뷰를 직접 접근하지 않으므로 커뮤니티 상태 정리
    if (view === 'calendar') {
      setSelectedCommunity(null);
    }
  };

  const renderMobileView = () => {
    // 게시글 상세 뷰가 선택된 경우
    if (currentView === 'post-detail' && selectedPost && selectedCommunity) {
      return (
        <PostDetailView
          announcement={selectedPost}
          comments={comments.filter(comment => comment.announcementId === selectedPost.id)}
          calendarName={selectedCommunity.name}
          onBack={handleBackToCommunity}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      );
    }

    // 커뮤니티가 선택된 경우 커뮤니티 화면 표시 (사이드바에서 접근)
    if (selectedCommunity && currentView === 'community') {
      return (
        <Community 
          calendarId={selectedCommunity.id}
          calendarName={selectedCommunity.name}
          announcements={announcements}
          comments={comments}
          onBack={handleBackToCalendar}
          onPostClick={handlePostClick}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      );
    }

    switch (mobileView) {
      case 'calendar':
        return selectedCalendarId ? (
          <CalendarView 
            calendarId={selectedCalendarId}
            calendarName={calendars.find(cal => cal.id === selectedCalendarId)?.name}
            currentDate={calendarDates[selectedCalendarId]}
            events={getEventsForCalendar(selectedCalendarId)}
            onDateChange={(newDate) => handleDateChange(selectedCalendarId, newDate)}
            onDateClick={handleDateClick}
            onBackToList={handleBackToCalendarList}
            onDeleteEvent={handleDeleteEvent}
            user={user}
            onAiAssist={handleShowAiPreview}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
            <div className="text-center text-muted-foreground max-w-sm mx-auto">
              <h3 className="mb-2 font-bold text-[20px]">캘린더를 선택해주세요</h3>
              <p className="text-sm">하단의 "내 캘린더"를 눌러<br />캘린더를 선택하여 일정을 확인하세요.</p>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              {/* AI 일정 도우미 아이콘 */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                  <Bot className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="mb-2">일정 관리 봇</h3>
              <p className="text-sm mb-4">AI가 도와주는 스마트한 일정 관리를 경험해보세요.</p>
              <Button onClick={handleOpenFeatures}>
                일정 관리 봇 열기
              </Button>
            </div>
          </div>
        );
      default:
        return <CalendarView />;
    }
  };

  if (currentView === 'ai-assistant') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 p-4">
          <AiAssistantPage />
        </div>
        <Button onClick={() => setCurrentView('calendar')} className="m-4">
          캘린더로 돌아가기
        </Button>
        <Toaster />
      </div>
    );
  }

  // 기능 패널이 활성화된 경우 전체 화면으로 렌더링
  if (currentView === 'features') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <FeaturePanel
          onBack={handleBackFromFeatures}
          currentCalendarId={selectedCalendarId ?? undefined}
          calendars={calendars}
          onAddEvent={handleAddEvent}
        />
        <Toaster />
      </div>
    );
  }

  // 게시글 상세 뷰가 활성화된 경우 전체 화면으로 렌더링
  if (currentView === 'post-detail' && selectedPost && selectedCommunity) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PostDetailView
          announcement={selectedPost}
          comments={comments.filter(comment => comment.announcementId === selectedPost.id)}
          calendarName={selectedCommunity.name}
          onBack={handleBackToCommunity}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
        <Toaster />
      </div>
    );
  }

  // 커뮤니티 뷰가 활성화된 경우 전체 화면으로 렌더링
  if (currentView === 'community' && selectedCommunity) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Community 
          calendarId={selectedCommunity.id}
          calendarName={selectedCommunity.name}
          announcements={announcements}
          comments={comments}
          onBack={handleBackToCalendar}
          onPostClick={handlePostClick}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        <CalendarSidebar 
          onCommunityClick={handleCommunityClick} 
          onCalendarClick={handleCalendarClick}
          onCreateCalendar={handleCreateCalendar}
          onDeleteCalendar={handleDeleteCalendar}
          calendars={calendars}
          user={user}
          onLogout={handleLogout}
        />
        {currentView === 'calendar' ? (
          selectedCalendarId ? (
            <CalendarView 
              calendarId={selectedCalendarId}
              calendarName={calendars.find(cal => cal.id === selectedCalendarId)?.name}
              currentDate={calendarDates[selectedCalendarId]}
              events={getEventsForCalendar(selectedCalendarId)}
              onDateChange={(newDate) => handleDateChange(selectedCalendarId, newDate)}
              onDateClick={handleDateClick}
              onBackToList={handleBackToCalendarList}
              onDeleteEvent={handleDeleteEvent}
              user={user}
              onAiAssist={handleShowAiPreview}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center text-muted-foreground">
                <h3 className="mb-2">캘린더를 선택해주세요</h3>
                <p className="text-sm">좌측 사이드바에서 캘린더를 선택하면 해당 캘린더의 일정을 확인할 수 있습니다.</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <h3 className="mb-2">선택된 뷰가 없습니다</h3>
              <p className="text-sm">좌측 사이드바에서 캘린더나 커뮤니티를 선택해주세요.</p>
            </div>
          </div>
        )}

        {/* 기능 패널 버튼 - 우상단 작은 버튼 */}
        <Button
          onClick={handleOpenFeatures}
          className="hidden lg:flex fixed top-16 right-4 h-12 w-12 bg-transparent hover:bg-transparent text-black hover:text-gray-700 transition-colors duration-200 z-40 items-center justify-center border-0 shadow-none"
          title="추가 기능 (일정 관리 봇, 설정 등)"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Notification Bell Icon */}
        {notifications.length > 0 && (
          <Button
            onClick={() => {
              if (notifications.length > 0) {
                setCurrentNotification(notifications[0]);
                setShowNotificationToast(true);
              }
            }}
            className="hidden lg:flex fixed top-32 right-4 h-12 w-12 bg-transparent hover:bg-transparent text-black hover:text-gray-700 transition-colors duration-200 z-40 items-center justify-center border-0 shadow-none"
            title={`새 알림 (${notifications.length}개)`}
          >
            <Bell className="h-6 w-6 text-red-500" /> {/* Red bell for unread notifications */}
            <span className="absolute top-2 right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{notifications.length}</span>
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="flex flex-col flex-1 lg:hidden">
        <main className="flex-1 pb-6 overflow-hidden min-h-0">
          {renderMobileView()}
        </main>
        
        <MobileNavigation 
          currentView={mobileView}
          onViewChange={handleMobileViewChange}
          onCalendarsClick={() => setIsCalendarsOpen(true)}
          onFeaturesClick={handleOpenFeatures}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Calendar Sidebar Sheet */}
      <Sheet open={isCalendarsOpen} onOpenChange={setIsCalendarsOpen}>
        <SheetContent side="left" className="w-full sm:max-w-sm p-0" aria-describedby={undefined}>
          <SheetHeader className="sr-only">
            <SheetTitle>캘린더 관리</SheetTitle>
            <SheetDescription>
              캘린더를 선택하고 커뮤니티에 참여하거나 새 캘린더를 만들 수 있습니다.
            </SheetDescription>
          </SheetHeader>
          <CalendarSidebar 
            onCommunityClick={handleCommunityClick} 
            onCalendarClick={handleCalendarClick}
            onCreateCalendar={handleCreateCalendar}
            onDeleteCalendar={handleDeleteCalendar}
            calendars={calendars}
            user={user}
            onLogout={handleLogout}
          />
        </SheetContent>
      </Sheet>

      {/* Day Events Dialog */}
      {selectedCalendarId && selectedDateForEvent && (
        <DayEventsDialog
          open={isDayEventsOpen}
          onOpenChange={setIsDayEventsOpen}
          selectedDate={selectedDateForEvent}
          events={getEventsForDate(selectedDateForEvent, selectedCalendarId)}
          calendarId={selectedCalendarId}
          onAddNewEvent={handleAddNewEventFromDayView}
          onDeleteEvent={handleDeleteEvent}
          onUpdateEvent={handleUpdateEvent}
        />
      )}

      {/* Add Event Dialog */}
      {selectedCalendarId && (
        <AddEventDialog
          open={isAddEventOpen}
          onOpenChange={setIsAddEventOpen}
          selectedDate={selectedDateForEvent}
          calendarId={selectedCalendarId}
          onAddEvent={handleAddEvent}
        />
      )}

      {/* Notification Toast */}
      {showNotificationToast && currentNotification && (
        <NotificationToast
          open={showNotificationToast}
          onOpenChange={setShowNotificationToast}
          variant="consent"
          title="캘린더 초대"
          message={`${currentNotification.inviter_name}님이 '${currentNotification.calendar_name}' 캘린더에 초대했습니다.`}
          showYesNo={true}
          onYes={handleAcceptNotification}
          onNo={handleDeclineNotification}
          yesLabel="수락"
          noLabel="거절"
          autoClose={false} // Don't auto-close for consent notifications
        />
      )}

      {/* AI Preview Dialog */}
      <AiPreviewDialog
        open={showAiPreviewDialog}
        onOpenChange={setShowAiPreviewDialog}
        eventData={aiEventPreview}
        onConfirm={handleConfirmAiEvent}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}