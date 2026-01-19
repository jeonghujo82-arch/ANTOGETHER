// 백엔드 API 통신을 위한 유틸리티 함수들
export const sendNotificationResponse = async (shareId: string, response: 'yes' | 'no') => {
  try {
    const status = response === 'yes' ? 'accepted' : 'declined';
    const result = await fetch('/api/notifications/respond', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}` // 인증 토큰
      },
      body: JSON.stringify({
        share_id: shareId,
        status: status
      })
    });
    
    if (!result.ok) {
      throw new Error('응답 전송 실패');
    }
    
    return await result.json();
  } catch (error) {
    console.error('알림 응답 전송 중 오류:', error);
    // 실제 환경에서는 에러 처리 로직 추가
    throw error;
  }
};

export const fetchNotifications = async (userNum: number) => {
  try {
    // 실제 환경에서는 백엔드에서 알림 목록을 가져옴
    const result = await fetch(`/api/notifications?user_num=${userNum}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!result.ok) {
      throw new Error('알림 가져오기 실패');
    }
    
    return await result.json();
  } catch (error) {
    console.error('알림 가져오기 중 오류:', error);
    // 목 데이터 반환 (개발용)
    return {
      id: 'notification_001',
      title: '일정 참여 요청',
      message: '게임 대회에 참여하시겠습니까? 참여하시면 자동으로 캘린더에 일정이 추가됩니다.',
      type: 'consent',
      badge: '요청',
      timestamp: new Date().toISOString()
    };
  }
};

export const fetchAiEventPreview = async (userNum: number, calendarId: string) => {
  try {
    const response = await fetch('/api/ai-assistant/preview-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ user_num: userNum, calendar_id: calendarId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'AI 이벤트 미리보기 실패');
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI 이벤트 미리보기 중 오류:', error);
    throw error;
  }
};