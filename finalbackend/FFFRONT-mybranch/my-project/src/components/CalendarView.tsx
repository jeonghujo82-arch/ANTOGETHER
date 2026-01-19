import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, Bell, Plus } from 'lucide-react';
import { 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatYear, 
  formatMonth, 
  getYearOptions, 
  getMonthOptions, 
  getEventsForDate 
} from '../utils/calendarHelpers';
import { DAY_HEADERS, CALENDAR_INFO, TOTAL_CALENDAR_CELLS } from '../constants/calendar';

interface Event {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  color: string;
  calendarId: string;
}

interface CalendarViewProps {
  calendarId?: string;
  calendarName?: string;
  currentDate?: Date;
  events?: Event[];
  onDateChange?: (newDate: Date) => void;
  onDateClick?: (date: Date) => void;
  onBackToList?: () => void;
  onDeleteEvent?: (eventId: string) => void;
  user?: { email: string; name: string; user_num?: number } | null;
  onAiAssist?: () => void;
}

export function CalendarView(props: CalendarViewProps) {
  const {
    calendarId,
    calendarName,
    currentDate,
    events: externalEvents,
    onDateChange,
    onDateClick,
    onBackToList,
    onDeleteEvent,
    user,
    onAiAssist,
  } = props;
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [localCurrentDate, setLocalCurrentDate] = useState(new Date());
  useEffect(() => {
    if (currentDate && currentDate.getTime() !== localCurrentDate.getTime()) {
      setLocalCurrentDate(currentDate);
    }
  }, [currentDate]);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // 항상 내부 상태 사용
  const effectiveCurrentDate = localCurrentDate;
  const setCurrentDate = setLocalCurrentDate;
  // 외부에서 전달받은 이벤트를 사용하거나 기본 이벤트 사용
  const events = externalEvents || [];
  
  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('CalendarView에서 받은 이벤트:', externalEvents);
    console.log('CalendarView에서 사용할 이벤트:', events);
    console.log('캘린더 ID:', calendarId);
  }, [externalEvents, events, calendarId]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(effectiveCurrentDate.getFullYear(), effectiveCurrentDate.getMonth() + (direction === 'next' ? 1 : -1), 1);
    setCurrentDate(newDate);
  };

  // 연도 선택 함수
  const handleYearSelect = (year: number) => {
  const newDate = new Date(year, effectiveCurrentDate.getMonth(), 1);
  setCurrentDate(newDate);
  if (onDateChange) onDateChange(newDate);
  setShowYearDropdown(false);
  };

  // 월 선택 함수
  const handleMonthSelect = (month: number) => {
  const newDate = new Date(effectiveCurrentDate.getFullYear(), month, 1);
  setCurrentDate(newDate);
  if (onDateChange) onDateChange(newDate);
  setTimeout(() => setShowMonthDropdown(false), 0);
  };

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowYearDropdown(false);
        setShowMonthDropdown(false);
      }
    };

    if (showYearDropdown || showMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showYearDropdown, showMonthDropdown]);

  // 드롭다운 위치 계산을 위한 ref
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const [yearDropdownPosition, setYearDropdownPosition] = useState({ top: 0, left: 0 });
  const [monthDropdownPosition, setMonthDropdownPosition] = useState({ top: 0, left: 0 });

  // 드롭다운 위치 계산
  const calculateDropdownPosition = (triggerElement: HTMLElement) => {
    const rect = triggerElement.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 8, // 8px margin
      left: rect.left + window.scrollX + rect.width / 2 - 64 // 64px는 드롭다운 너비의 절반 (128px / 2)
    };
  };

  // 연도 드롭다운 토글
  const handleYearDropdownToggle = (event: React.MouseEvent) => {
    if (!showYearDropdown) {
      const position = calculateDropdownPosition(event.currentTarget as HTMLElement);
      setYearDropdownPosition(position);
    }
    setShowYearDropdown(!showYearDropdown);
    setShowMonthDropdown(false); // 다른 드롭다운 닫기
  };

  // 월 드롭다운 토글
  const handleMonthDropdownToggle = (event: React.MouseEvent) => {
    if (!showMonthDropdown) {
      const position = calculateDropdownPosition(event.currentTarget as HTMLElement);
      setMonthDropdownPosition(position);
    }
    setShowMonthDropdown(!showMonthDropdown);
    setShowYearDropdown(false); // 다른 드롭다운 닫기
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(effectiveCurrentDate);
    const firstDay = getFirstDayOfMonth(effectiveCurrentDate);
    const days = [];

    // 이전 달의 마지막 날들 계산
    const prevMonth = new Date(effectiveCurrentDate.getFullYear(), effectiveCurrentDate.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    // 이전 달 날짜들 (연하게 표시)
    for (let i = firstDay - 1; i >= 0; i--) {
      const prevDate = daysInPrevMonth - i;
      days.push(
        <div 
          key={`prev-${prevDate}`} 
          className="min-h-28 lg:min-h-0 flex flex-col items-center justify-start pt-2 lg:pt-4 relative"
        >
          <div className="text-lg mb-4 text-gray-300 font-semibold">
            {prevDate}
          </div>
        </div>
      );
    }

    // 실제 날짜들
    for (let date = 1; date <= daysInMonth; date++) {
      const dayEvents = getEventsForDate(date, effectiveCurrentDate, events);
      const isToday = new Date().getDate() === date && 
                     new Date().getMonth() === effectiveCurrentDate.getMonth() && 
                     new Date().getFullYear() === effectiveCurrentDate.getFullYear();

      const handleDateClick = () => {
        if (onDateClick) {
          const clickedDate = new Date(effectiveCurrentDate.getFullYear(), effectiveCurrentDate.getMonth(), date);
          onDateClick(clickedDate);
        }
      };

      const hasEvents = dayEvents.length > 0;
      
      days.push(
        <div 
          key={date} 
          className="min-h-24 lg:min-h-28 cursor-pointer transition-colors hover:bg-gray-50 flex flex-col items-center justify-start pt-2 lg:pt-4 relative"
          onClick={handleDateClick}
          title={hasEvents ? `${dayEvents.length}개의 일정 보기` : '새 일정 추가'}
        >
          <div 
            className={`text-sm lg:text-lg mb-1 lg:mb-2 font-semibold ${isToday ? 'text-white w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs lg:text-base' : 'text-black'}`}
            style={isToday ? { backgroundColor: '#000000' } : { color: '#000000' }}
          >
            {date}
          </div>
          <div className="w-full space-y-1 absolute top-10 lg:top-14 left-0 right-0 overflow-hidden px-1">
            {dayEvents.slice(0, 2).map((event) => {
              // 이벤트가 여러 날에 걸치는지 확인
              const isMultiDay = event.startDate.toDateString() !== event.endDate.toDateString();
              // 현재 날짜가 시작일인지 확인
              const currentDateObj = new Date(effectiveCurrentDate.getFullYear(), effectiveCurrentDate.getMonth(), date);
              const isStartDate = event.startDate.toDateString() === currentDateObj.toDateString();
              const isEndDate = event.endDate.toDateString() === currentDateObj.toDateString();
              
              const handleEventClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (onDateClick) {
                  const clickedDate = new Date(effectiveCurrentDate.getFullYear(), effectiveCurrentDate.getMonth(), date);
                  onDateClick(clickedDate);
                }
              };
              
              // 컬러 바 모서리 둥글기와 확장 스타일 결정
              const getBarStyle = () => {
                if (!isMultiDay) {
                  // 단일일 이벤트: 양쪽 모두 둥글게, 일반 마진
                  return {
                    rounded: 'rounded-sm',
                    marginClass: 'mx-1',
                    paddingClass: 'px-2',
                    textVisible: true,
                    width: 'calc(100% - 8px)'
                  };
                } else if (isStartDate && isEndDate) {
                  // 시작일과 끝일이 같은 경우 (하루짜리)
                  return {
                    rounded: 'rounded-sm',
                    marginClass: 'mx-1',
                    paddingClass: 'px-2',
                    textVisible: true,
                    width: 'calc(100% - 8px)'
                  };
                } else if (isStartDate) {
                  // 시작일: 왼쪽만 둥글게, 오른쪽으로 완전히 확장
                  return {
                    rounded: 'rounded-l-sm rounded-r-none',
                    marginClass: 'ml-1',
                    paddingClass: 'pl-2 pr-0',
                    textVisible: true,
                    width: 'calc(100% - 4px)'
                  };
                } else if (isEndDate) {
                  // 끝일: 오른쪽만 둥글게, 왼쪽으로 완전히 확장
                  return {
                    rounded: 'rounded-r-sm rounded-l-none',
                    marginClass: 'mr-1',
                    paddingClass: 'pl-0 pr-2',
                    textVisible: false,
                    width: 'calc(100% - 4px)'
                  };
                } else {
                  // 중간일: 직사각형, 양쪽으로 완전히 확장하여 연결
                  return {
                    rounded: 'rounded-none',
                    marginClass: '',
                    paddingClass: 'px-0',
                    textVisible: false,
                    width: '100%'
                  };
                }
              };

              const barStyle = getBarStyle();

              return (
                <div 
                  key={event.id} 
                  className={`text-white text-[10px] lg:text-xs py-1 lg:py-1.5 ${barStyle.paddingClass} ${barStyle.rounded} ${barStyle.marginClass} cursor-pointer hover:opacity-90 transition-all duration-200 hover:shadow-md h-5 lg:h-6 flex items-center relative z-10 border border-white/20`}
                  onClick={handleEventClick}
                  title={`${event.title} - 클릭하여 자세히 보기`}
                  style={{
                    backgroundColor: event.color,
                    width: barStyle.width,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  <div className="truncate w-full font-medium">
                    {barStyle.textVisible ? event.title : ''}
                  </div>
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className="text-[10px] lg:text-xs text-gray-500 mx-1">+{dayEvents.length - 2}개</div>
            )}
          </div>
        </div>
      );
    }

    // 다음 달 날짜들 계산 (총 42칸 채우기 위해)
    const remainingCells = TOTAL_CALENDAR_CELLS - (firstDay + daysInMonth);
    
    // 다음 달 날짜들 (연하게 표시)
    for (let date = 1; date <= remainingCells; date++) {
      days.push(
        <div 
          key={`next-${date}`} 
          className="min-h-28 lg:min-h-0 flex flex-col items-center justify-start pt-2 lg:pt-4 relative"
        >
          <div className="text-lg mb-4 text-gray-300 font-semibold">
            {date}
          </div>
        </div>
      );
    }

    return days;
  };

  const currentCalendar = calendarId ? CALENDAR_INFO[calendarId as keyof typeof CALENDAR_INFO] : null;

  return (
    <div className="flex-1 p-1 lg:p-4 overflow-hidden bg-white pb-0 lg:pb-4 flex flex-col max-w-full">
      {/* Header */}
      <div className="mb-2 lg:mb-6 w-full overflow-hidden">
        {/* Mobile Header */}
        <div className="flex flex-col space-y-2 lg:hidden w-full">
          <div className="flex items-center justify-between min-w-0 m-[0px]">
            {onBackToList && (
              <Button variant="ghost" size="sm" onClick={onBackToList} className="flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-lg text-center flex-1 min-w-0 truncate px-2 text-[rgba(255,255,255,1)]">{calendarName || '캘린더'}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAiAssist}
              className="h-9 w-9 p-0 text-black hover:bg-gray-100 flex-shrink-0 mt-4 mr-3"
              title="AI 비서"
            >
              <Bell className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center justify-center space-x-4 w-full m-[0px] my-[7px] mx-[0px] mt-[0px] mr-[0px] mb-[7px] ml-[0px]">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} className="flex-shrink-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center flex-1 min-w-0">
              <div className="flex items-center justify-center space-x-2">
                <div className="relative dropdown-container">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span
                        className="text-[45px] text-[rgba(0,0,0,1)] font-bold cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                        title="월 선택"
                      >
                        {effectiveCurrentDate.getMonth() + 1}월
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32 max-h-60 overflow-y-auto">
                      {getMonthOptions().map(month => (
                        <DropdownMenuItem
                          key={month}
                          onSelect={() => handleMonthSelect(month)}
                          className={`text-center cursor-pointer hover:bg-gray-100 transition-colors ${month === effectiveCurrentDate.getMonth() ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                        >
                          {month + 1}월
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="relative dropdown-container">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span
                        className="text-[45px] text-[rgba(0,0,0,1)] font-bold cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
                        title="월 선택"
                      >
                        {effectiveCurrentDate.getMonth() + 1}월
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32 max-h-60 overflow-y-auto">
                      {getMonthOptions().map(month => (
                        <DropdownMenuItem
                          key={month}
                          onSelect={() => handleMonthSelect(month)}
                          className={`text-center cursor-pointer hover:bg-gray-100 transition-colors ${month === effectiveCurrentDate.getMonth() ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                        >
                          {month + 1}월
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} className="flex-shrink-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Year Dropdown Menu for Mobile - Fixed Positioning */}
          {showYearDropdown && (
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[99999] w-32 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{
                top: `${yearDropdownPosition.top}px`,
                left: `${yearDropdownPosition.left}px`
              }}
            >
              {getYearOptions(effectiveCurrentDate).map((year) => (
                <div
                  key={year}
                  className={`px-4 py-2 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    year === effectiveCurrentDate.getFullYear() ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                          onMouseDown={() => handleYearSelect(year)}
                >
                  {year}
                </div>
              ))}
            </div>
          )}

          {/* Month Dropdown Menu for Mobile - Fixed Positioning */}
          {showMonthDropdown && (
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[99999] w-32 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{
                top: `${monthDropdownPosition.top}px`,
                left: `${monthDropdownPosition.left}px`
              }}
            >
              {getMonthOptions().map((month) => (
                <div
                  key={month}
                  className={`px-4 py-2 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                    month === effectiveCurrentDate.getMonth() ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                  onMouseDown={() => handleMonthSelect(month)}
                >
                  {month + 1}월
                </div>
              ))}
            </div>
          )}

          {currentCalendar && (
            <div className="flex items-center justify-center space-x-2 w-full min-w-0">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: currentCalendar.color }}
              />
              <span className="text-sm text-[rgba(0,0,0,1)] min-w-0 truncate">{currentCalendar.name}</span>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {events.length}개 일정
              </Badge>
            </div>
          )}
        </div>
        
        {/* Desktop Header */}
        <div className="hidden lg:flex flex-col space-y-6 w-full overflow-hidden">
          <div className="flex items-center justify-between min-w-0">
            {onBackToList && (
              <Button variant="ghost" size="sm" onClick={onBackToList} className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-xl text-center flex-1 min-w-0 truncate px-4">{calendarName || '캘린더'}</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAiAssist}
              title="AI 비서"
              className="h-8 w-8 p-0 text-black hover:bg-gray-100 flex-shrink-0"
            >
              <Bell className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Navigation - Dropdown Style */}
          <div className="flex flex-col items-center space-y-2 w-full overflow-visible">
            {/* Year Dropdown */}
            <div className="relative dropdown-container">
              <div 
                className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-md transition-colors"
                onClick={handleYearDropdownToggle}
                title="연도 선택"
              >
                <span
                  className={`text-3xl text-[36px] font-bold px-2 py-1 rounded-md transition-colors ${showYearDropdown ? 'bg-black text-white' : 'text-gray-800'}`}
                  style={showYearDropdown ? { backgroundColor: '#000000', color: '#fff' } : {}}
                >
                  {formatYear(effectiveCurrentDate)}
                </span>
                <ChevronDown className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            
            {/* Month Dropdown */}
            <div className="relative dropdown-container">
              <div 
                className="flex items-center justify-center space-x-2 cursor-pointer hover:bg-gray-50 px-4 py-2 rounded-md transition-colors"
                onClick={handleMonthDropdownToggle}
                title="월 선택"
              >
                <span
                  className={`text-4xl font-bold text-[40px] px-2 py-1 rounded-md transition-colors ${showMonthDropdown ? 'bg-black text-white' : 'text-gray-900'}`}
                  style={showMonthDropdown ? { backgroundColor: '#000000', color: '#fff' } : {}}
                >
                  {effectiveCurrentDate.getMonth() + 1}월
                </span>
                <ChevronDown className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Year Dropdown Menu - Fixed Positioning */}
          {showYearDropdown && (
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[99999] w-32 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{
                top: `${yearDropdownPosition.top}px`,
                left: `${yearDropdownPosition.left}px`
              }}
            >
              {getYearOptions(effectiveCurrentDate).map((year) => (
                <div
                  key={year}
                  className={`px-4 py-2 text-center cursor-pointer transition-colors rounded-md ${
                    year === effectiveCurrentDate.getFullYear()
                      ? 'bg-black text-white font-bold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  style={year === effectiveCurrentDate.getFullYear() ? { backgroundColor: '#000000', color: '#fff' } : {}}
                  onMouseDown={() => handleYearSelect(year)}
                >
                  {year}
                </div>
              ))}
            </div>
          )}

          {/* Month Dropdown Menu for Fixed Positioning */}
          {showMonthDropdown && (
            <div 
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-[99999] w-32 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{
                top: `${monthDropdownPosition.top}px`,
                left: `${monthDropdownPosition.left}px`
              }}
            >
              {getMonthOptions().map((month) => (
                <div
                  key={month}
                  className={`px-4 py-2 text-center cursor-pointer transition-colors rounded-md ${
                    month === effectiveCurrentDate.getMonth()
                      ? 'bg-black text-white font-bold'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  style={month === effectiveCurrentDate.getMonth() ? { backgroundColor: '#000000', color: '#fff' } : {}}
                  onMouseDown={() => handleMonthSelect(month)}
                >
                  {month + 1}월
                </div>
              ))}
            </div>
          )}

          {currentCalendar && (
            <div className="flex items-center justify-center space-x-3 w-full min-w-0">
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: currentCalendar.color }}
              />
              <span className="text-base text-[rgba(9,9,9,1)] min-w-0 truncate">{currentCalendar.name}</span>
              <Badge variant="secondary" className="flex-shrink-0">
                {events.length}개 일정
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="w-full mb-0 flex-1 flex flex-col min-h-[720px] lg:min-h-0 max-w-full overflow-auto">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-0 mb-0 lg:mb-2 w-full min-w-0 sticky top-0 bg-white z-10">
          {DAY_HEADERS.map((day, index) => (
            <div 
              key={day} 
              className={`py-2 lg:py-4 text-center text-lg lg:text-xl font-bold min-w-0 ${
                index === 0 ? 'text-red-500' : // Sunday
                index === 6 ? 'text-blue-500' : // Saturday
                'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 bg-white flex-1 w-full max-w-full min-h-[500px] lg:min-h-[600px]">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Floating Action Button */}
      {onDateClick && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-black hover:bg-gray-800 text-white shadow-lg z-50"
          onClick={() => onDateClick(new Date())}
          title="새 일정 추가"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* NOTE: The original notification toast for invitations is removed for now to avoid confusion. */}
      {/* You can add it back if you need both features. */}

    </div>
  );
}
