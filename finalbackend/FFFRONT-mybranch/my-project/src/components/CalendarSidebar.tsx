import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Plus, Share2, Calendar as CalendarIcon, Users, MessageSquare, Palette, Trash2, LogOut, User } from 'lucide-react';
import antLogo from '../assets/antogether-logo.svg';

export interface CalendarItem {
  id: string;
  name: string;
  purpose: string;
  color: string;
  isActive: boolean;
  memberCount: number;
}

interface CalendarSidebarProps {
  onCommunityClick?: (calendarId: string) => void;
  onCalendarClick?: (calendarId: string) => void;
  onCreateCalendar?: (calendar: CalendarItem) => void;
  onDeleteCalendar?: (calendarId: string) => void;
  calendars?: CalendarItem[];
  user?: { email: string; name: string } | null;
  onLogout?: () => void;
}

export function CalendarSidebar({ 
  onCommunityClick, 
  onCalendarClick, 
  onCreateCalendar, 
  onDeleteCalendar,
  calendars: externalCalendars,
  user,
  onLogout
}: CalendarSidebarProps) {
  const calendars = externalCalendars || [];

  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarPurpose, setNewCalendarPurpose] = useState('');
  const [newCalendarColor, setNewCalendarColor] = useState('rgb(176, 224, 230)');
  const [shareCode, setShareCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const colorOptions = [
    { value: 'rgb(255, 182, 193)', label: '베이비핑크' },
    { value: 'rgb(247, 202, 201)', label: '로즈쿼츠' },
    { value: 'rgb(221, 191, 255)', label: '라벤더' },
    { value: 'rgb(176, 224, 230)', label: '파우더블루' },
    { value: 'rgb(189, 236, 182)', label: '민트그린' },
    { value: 'rgb(255, 253, 208)', label: '크림옐로' },
    { value: 'rgb(255, 218, 185)', label: '피치' },
    { value: 'rgb(230, 223, 250)', label: '페일퍼플' }
  ];

  const handleCreateCalendar = () => {
    if (!newCalendarName.trim() || !newCalendarPurpose.trim()) return;
    
    const newCalendar: CalendarItem = {
      id: Date.now().toString(),
      name: newCalendarName.trim(),
      purpose: newCalendarPurpose.trim(),
      color: newCalendarColor,
      isActive: false,
      memberCount: 1
    };
    
    if (onCreateCalendar) {
      onCreateCalendar(newCalendar);
    }
    
    setNewCalendarName('');
    setNewCalendarPurpose('');
    setNewCalendarColor('rgb(176, 224, 230)');
    setIsCreateDialogOpen(false);
  };

  const handleShare = (calendarId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setShareCode(code);
  };

  const handleJoinCalendar = () => {
    if (!joinCode) return;
    // 실제로는 서버에서 코드를 검증하고 캘린더를 가져옴
    alert(`코드 ${joinCode}로 캘린더에 참여했습니다!`);
    setJoinCode('');
  };

  const handleDeleteCalendar = (calendarId: string) => {
    const calendar = calendars.find(cal => cal.id === calendarId);
    
    if (onDeleteCalendar) {
      onDeleteCalendar(calendarId);
    } else {
      setInternalCalendars(prev => prev.filter(cal => cal.id !== calendarId));
    }
    
    // 삭제 완료 토스트
    toast.success(`'${calendar?.name}' 캘린더가 삭제되었습니다.`);
  };

  // 모든 캘린더 삭제 가능

  const handleCommunityAccess = (calendarId: string) => {
    if (onCommunityClick) {
      onCommunityClick(calendarId);
    }
  };

  const handleCalendarSelect = (calendarId: string) => {
    if (onCalendarClick) {
      onCalendarClick(calendarId);
    }
  };

  return (
    <div className="w-full lg:w-80 bg-[rgba(0,0,0,1)] lg:border-r border-border p-4 lg:p-6 space-y-4 lg:space-y-6 h-full pt-12 lg:pt-16">
      {/* 사용자 정보 영역 */}
      {user && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-[12px] border border-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[rgba(0,0,0,1)] rounded-full flex items-center justify-center border border-border">
                <img 
                  src={antLogo} 
                  alt="사용자 프로필" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[rgba(0,0,0,1)] truncate">{user.name}</p>
                <p className="text-xs truncate text-black">{user.email}</p>
              </div>
            </div>
          </div>
          
          {/* 로그아웃 버튼 */}
          {onLogout && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full justify-center space-x-2 text-muted-foreground hover:text-destructive hover:border-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg lg:text-xl text-foreground font-bold">내 캘린더</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mt-[0px] mr-[20px] mb-[0px] ml-[0px]">
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">새 캘린더</span>
                <span className="sm:hidden">추가</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 캘린더 생성</DialogTitle>
                <DialogDescription>
                  새로운 캘린더를 생성하면 해당 캘린더 전용 커뮤니티도 함께 생성됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm">캘린더 이름</label>
                  <Input
                    placeholder="예: 개발팀 일정"
                    value={newCalendarName}
                    onChange={(e) => setNewCalendarName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">목적</label>
                  <Input
                    placeholder="예: 게임, 운동, 스터디, 업무"
                    value={newCalendarPurpose}
                    onChange={(e) => setNewCalendarPurpose(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm flex items-center space-x-1">
                    <Palette className="h-4 w-4" />
                    <span>색상</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`w-8 h-8 rounded-full transition-all ${
                          newCalendarColor === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setNewCalendarColor(color.value)}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button 
                    onClick={handleCreateCalendar} 
                    className="flex-1"
                    disabled={!newCalendarName.trim() || !newCalendarPurpose.trim()}
                  >
                    생성
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {calendars.length > 0 ? calendars.map((calendar) => (
            <Card key={calendar.id} className="p-3 transition-all bg-card/50 border border-border hover:bg-gray-100 bg-[rgba(255,255,255,1)] rounded-[12px]">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center space-x-3 min-w-0 flex-1 cursor-pointer hover:opacity-80"
                  onClick={() => handleCalendarSelect(calendar.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: calendar.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[rgba(0,0,0,1)] truncate">{calendar.name}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 rounded-[12px]">
                        {calendar.purpose}
                      </Badge>
                      <div className="flex items-center bg-[rgba(0,0,0,0)] text-black">
                        <Users className="h-3 w-3 mr-1" />
                        {calendar.memberCount}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCommunityAccess(calendar.id)}
                    title="커뮤니티"
                    className="px-2 text-[rgba(0,0,0,1)]"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleShare(calendar.id)}
                        title="공유"
                        className="px-2 text-[rgba(0,0,0,1)]"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>캘린더 공유</DialogTitle>
                        <DialogDescription>
                          다른 사용자가 이 코드를 입력하면 현재 상태의 캘린더 복사본을 받을 수 있습니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Input value={shareCode} readOnly className="text-center" />
                          <Button variant="outline" onClick={() => navigator.clipboard.writeText(shareCode)}>
                            복사
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="삭제"
                        className="px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>캘린더 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          '{calendar.name}' 캘린더를 삭제하시겠습니까? 
                          <br />
                          <span className="text-destructive">이 작업은 되돌릴 수 없으며, 모든 일정과 커뮤니티 데이터가 함께 삭제됩니다.</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteCalendar(calendar.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          )) : (
            <div className="text-center text-muted-foreground py-8">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-60 text-muted-foreground" />
              <p className="text-foreground/80">캘린더가 없습니다.</p>
              <p className="text-sm mb-4 text-muted-foreground">새 캘린더를 생성하여 일정을 관리하세요.</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="mx-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    새 캘린더 만들기
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 캘린더 만들기</DialogTitle>
                    <DialogDescription>
                      새로운 캘린더를 생성하면 전용 커뮤니티가 함께 만들어집니다.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="calendar-name">캘린더 이름</Label>
                      <Input
                        id="calendar-name"
                        placeholder="예: 프로젝트 일정, 운동 계획 등"
                        value={newCalendarName}
                        onChange={(e) => setNewCalendarName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calendar-purpose">목적</Label>
                      <Input
                        id="calendar-purpose"
                        placeholder="예: 업무, 개인, 취미 등"
                        value={newCalendarPurpose}
                        onChange={(e) => setNewCalendarPurpose(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>색상 선택</Label>
                      <div className="flex space-x-2 flex-wrap gap-2">
                        {colorOptions.map((color) => (
                          <Button
                            key={color.value}
                            type="button"
                            variant={newCalendarColor === color.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewCalendarColor(color.value)}
                            className="p-2"
                          >
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: color.value }}
                            />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleCreateCalendar}>
                      생성하기
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base lg:text-lg text-foreground font-bold">캘린더 참여</h3>
        <div className="flex space-x-2">
          <Input
            placeholder="공유 코드 입력"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="text-sm"
          />
          <Button onClick={handleJoinCalendar} size="sm">
            참여
          </Button>
        </div>
      </div>
    </div>
  );
}