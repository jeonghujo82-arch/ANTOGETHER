import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Send, User, Calendar, Clock, Bot, Search, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from "sonner";
import antogetherLogo from '../assets/antogether-logo.svg';

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
  images?: string[];
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestedEvent?: {
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    calendarId: string;
  };
  isProcessing?: boolean;
}

interface ChatBotProps {
  currentCalendarId?: string;
  calendars?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  onAddEvent?: (eventData: {
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    color: string;
    images?: string[];
  }) => void;
}

export function ChatBot({ currentCalendarId, calendars = [], onAddEvent }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: '안녕하세요! 저는 antogether의 AI 일정 관리 도우미입니다. \n\n자연스럽게 말씀해주시면 자동으로 일정을 분석하고 캘린더에 추가해드릴게요!\n\n예시:\n• "내일 오후 8시에 게임 스트리밍"\n• "다음 주 화요일부터 금요일까지 운동"\n• "12월 25일 크리스마스 파티 준비"',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 간단한 일정 파싱 함수 (실제로는 백엔드 AI가 처리)
  const parseEventFromText = async (text: string): Promise<{
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    calendarId: string;
  } | null> => {
    // 실제 구현에서는 백엔드 API 호출
    // 여기서는 간단한 키워드 기반 파싱
    
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    let startTime = '09:00';
    let endTime = '10:00';
    let title = text.slice(0, 50);
    let content = text;

    // 날짜 파싱
    if (text.includes('내일')) {
      startDate.setDate(now.getDate() + 1);
      endDate.setDate(now.getDate() + 1);
    } else if (text.includes('모레')) {
      startDate.setDate(now.getDate() + 2);
      endDate.setDate(now.getDate() + 2);
    } else if (text.includes('다음주')) {
      startDate.setDate(now.getDate() + 7);
      endDate.setDate(now.getDate() + 7);
    }

    // 시간 파싱
    const timeMatch = text.match(/(\d{1,2}):?(\d{0,2})\s*(시|오전|오후|am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      
      if (timeMatch[3] && (timeMatch[3].includes('오후') || timeMatch[3].toLowerCase().includes('pm'))) {
        if (hour !== 12) hour += 12;
      }
      
      startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // 기본적으로 1시간 일정
      const endHour = hour + 1;
      endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    // 기간 일정 파싱 (from ~ to)
    if (text.includes('부터') && text.includes('까지')) {
      // 며칠간의 일정으로 처리
      endDate.setDate(startDate.getDate() + 1);
    }

    // 제목 추출 (더 정교한 파싱 필요)
    const keywords = ['게임', '스트리밍', '운동', '미팅', '회의', '약속', '파티', '공부', '수업'];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        title = text.substring(0, text.indexOf(keyword) + keyword.length);
        break;
      }
    }

    return {
      title: title.trim() || '새로운 일정',
      content: content.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      calendarId: currentCalendarId || '1'
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // 일정 분석 중 메시지 추가
      const processingMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: '메시지를 분석하고 있습니다... 🔍',
        timestamp: new Date(),
        isProcessing: true
      };

      setMessages(prev => [...prev, processingMessage]);

      // 실제로는 백엔드 API 호출
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 일정 파싱
      const parsedEvent = await parseEventFromText(currentInput);

      setMessages(prev => prev.filter(msg => !msg.isProcessing));

      if (parsedEvent) {
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: '다음과 같은 일정을 찾았습니다. 캘린더에 추가하시겠습니까?',
          timestamp: new Date(),
          suggestedEvent: parsedEvent
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        const botMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: '죄송합니다. 일정 정보를 인식하지 못했습니다. 다음과 같은 형태로 다시 말씀해주세요:\n\n• "내일 오후 3시 회의"\n• "다음주 월요일부터 수요일까지 출장"\n• "12월 1일 저녁 7시 친구 만남"',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        type: 'bot',
        content: '일정 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddEvent = (suggestedEvent: Message['suggestedEvent']) => {
    if (!suggestedEvent || !onAddEvent) return;

    try {
      onAddEvent({
        title: suggestedEvent.title,
        content: suggestedEvent.content,
        startDate: suggestedEvent.startDate,
        endDate: suggestedEvent.endDate,
        startTime: suggestedEvent.startTime,
        endTime: suggestedEvent.endTime,
        color: '#8B5CF6' // 기본 보라색 설정
      });

      const confirmMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `✅ "${suggestedEvent.title}" 일정이 성공적으로 추가되었습니다!\n\n다른 일정도 추가하시겠습니까?`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, confirmMessage]);
      toast.success('일정이 추가되었습니다!');
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('일정 추가 중 오류가 발생했습니다.');
    }
  };

  const handleRejectEvent = () => {
    const rejectMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: '알겠습니다. 다른 일정을 말씀해주시거나 기존 내용을 수정해서 다시 알려주세요.',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, rejectMessage]);
  };

  const currentCalendar = calendars.find(cal => cal.id === currentCalendarId);

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border border-border overflow-hidden">
            <img 
              src={antogetherLogo} 
              alt="AI 도우미" 
              className="w-6 h-6 object-contain"
            />
          </div>
          <div>
            <h3 className="text-white">AI 일정 도우미</h3>
            {currentCalendar && (
              <p className="text-xs text-muted-foreground">
                {currentCalendar.name}에 추가
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="bg-muted text-muted-foreground border-border">
          New
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`flex items-center space-x-2 mb-1 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'bot' && (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.type === 'user' && <User className="h-4 w-4 text-primary" />}
                </div>
                
                <Card className={`p-3 ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* 제안된 일정 표시 */}
                  {message.suggestedEvent && (
                    <div className="mt-4 p-4 bg-muted rounded-lg border space-y-3">
                      <div className="flex items-start space-x-2">
                        <Calendar className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <h4 className="font-medium text-foreground">{message.suggestedEvent.title}</h4>
                          <p className="text-sm text-muted-foreground">{message.suggestedEvent.content}</p>
                          
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {message.suggestedEvent.startDate.toDateString() === message.suggestedEvent.endDate.toDateString() 
                                  ? formatDate(message.suggestedEvent.startDate)
                                  : `${formatDate(message.suggestedEvent.startDate)} ~ ${formatDate(message.suggestedEvent.endDate)}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {message.suggestedEvent.startTime} ~ {message.suggestedEvent.endTime}
                              </span>
                            </div>
                          </div>

                          {currentCalendar && (
                            <Badge variant="secondary" className="text-xs">
                              {currentCalendar.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          onClick={() => handleAddEvent(message.suggestedEvent)}
                          className="bg-white text-black hover:bg-gray-200 flex-1"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          일정 추가
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleRejectEvent}
                          className="border-border text-muted-foreground hover:bg-muted flex-1"
                          size="sm"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          다시 입력
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          ))}
          
          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4 text-primary" />
                <Card className="p-3 bg-card">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Input */}
      <div className="p-4">
        {!currentCalendarId && (
          <div className="mb-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-600 text-sm">
              ⚠️ 캘린더를 선택해야 일정을 추가할 수 있습니다.
            </p>
          </div>
        )}
        
        <div className="bg-black rounded-full flex items-center space-x-3 px-4 py-3 border border-gray-700">
          <Plus className="h-5 w-5 text-white flex-shrink-0" />
          <Input
            placeholder="자연스럽게 일정을 말씀해주세요..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            className="bg-transparent border-0 text-white placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            disabled={!currentCalendarId || isTyping}
          />
          <Button 
            onClick={handleSendMessage} 
            size="sm" 
            className="bg-white text-black hover:bg-gray-200 rounded-full h-8 w-8 p-0 flex-shrink-0"
            disabled={!currentCalendarId || isTyping || !inputMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          "내일 오후 8시 게임", "다음 주 화요일 미팅" 등 자연스럽게 말해보세요
        </p>
      </div>
    </div>
  );
}