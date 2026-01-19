import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Calendar as CalendarIcon, Clock, Plus, FileText, Trash2, Check, X, Edit3, Image as ImageIcon, Camera, Upload } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

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

interface DayEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  events: Event[];
  calendarId: string;
  onAddNewEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent?: (eventId: string, updatedEvent: Partial<Event>) => void;
}

export function DayEventsDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  events,
  calendarId,
  onAddNewEvent,
  onDeleteEvent,
  onUpdateEvent
}: DayEventsDialogProps) {
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<Event>>({});
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const ampm = hour24 >= 12 ? '오후' : '오전';
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
    return `${ampm} ${hour12}:${minutes}`;
  };

  const calendarInfo = {
    '1': { name: '게임 스케줄', color: 'bg-blue-500' },
    '2': { name: '운동 계획', color: 'bg-green-500' }
  };

  const currentCalendar = calendarInfo[calendarId as keyof typeof calendarInfo];

  const handleAddNewEvent = () => {
    onOpenChange(false);
    onAddNewEvent();
  };

  const handleEventClick = (eventId: string) => {
    if (editingEventId === eventId) return; // 편집 중이면 선택 방지
    
    setSelectedEventIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    const count = selectedEventIds.size;
    selectedEventIds.forEach(eventId => {
      onDeleteEvent(eventId);
    });
    setSelectedEventIds(new Set());
    
    toast.success(`${count}개의 이벤트가 삭제되었습니다`);
  };

  const handleSingleEventDelete = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      const eventToDeleteData = events.find(e => e.id === eventToDelete);
      onDeleteEvent(eventToDelete);
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
      
      toast.success(`"${eventToDeleteData?.title || '이벤트'}"가 삭제되었습니다`);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEventId(event.id);
    setEditingEvent({
      title: event.title,
      content: event.content,
      startTime: event.startTime,
      endTime: event.endTime,
      images: event.images || []
    });
  };

  const handleSaveEdit = () => {
    if (!editingEventId || !onUpdateEvent) return;
    
    onUpdateEvent(editingEventId, editingEvent);
    setEditingEventId(null);
    setEditingEvent({});
    toast.success('이벤트가 수정되었습니다');
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditingEvent({});
  };

  const handleImageUpload = (eventId: string, files: FileList | null) => {
    if (!files || !onUpdateEvent) return;
    
    // 실제 구현에서는 파일을 서버에 업로드하고 URL을 받아야 함
    // 여기서는 시뮬레이션을 위해 더미 URL 생성
    const newImageUrls = Array.from(files).map((file, index) => 
      `https://picsum.photos/400/300?random=${Date.now()}_${index}`
    );
    
    const event = events.find(e => e.id === eventId);
    if (event) {
      const updatedImages = [...(event.images || []), ...newImageUrls];
      onUpdateEvent(eventId, { images: updatedImages });
      toast.success(`${files.length}개의 이미지가 추가되었습니다`);
    }
  };

  const handleRemoveImage = (eventId: string, imageIndex: number) => {
    if (!onUpdateEvent) return;
    
    const event = events.find(e => e.id === eventId);
    if (event && event.images) {
      const updatedImages = event.images.filter((_, index) => index !== imageIndex);
      onUpdateEvent(eventId, { images: updatedImages });
      toast.success('이미지가 삭제되었습니다');
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedEventIds(new Set());
      setDeleteConfirmOpen(false);
      setEventToDelete(null);
      setEditingEventId(null);
      setEditingEvent({});
      setExpandedEventId(null);
    }
    onOpenChange(newOpen);
  };

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  // 시간순으로 이벤트 정렬
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.startTime.split(':').map(Number);
    const timeB = b.startTime.split(':').map(Number);
    return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
  });

  const formatEventTime = (event: Event) => {
    // 시작일과 종료일이 같은 날인지 확인
    const isSameDay = event.startDate.toDateString() === event.endDate.toDateString();
    
    if (isSameDay) {
      // 같은 날이면 시간만 표시
      return `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
    } else {
      // 다른 날이면 날짜와 시간 모두 표시
      const startDateStr = event.startDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      const endDateStr = event.endDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      return `${startDateStr} ${formatTime(event.startTime)} - ${endDateStr} ${formatTime(event.endTime)}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>일정 관리</span>
          </DialogTitle>
          <DialogDescription>
            {selectedEventIds.size > 0 
              ? `${selectedEventIds.size}개의 일정이 선택되었습니다. 삭제하려면 삭제 버튼을 클릭하세요.`
              : '일정을 클릭하여 선택하고 삭제하거나, 편집 버튼으로 수정하거나, 새로운 일정을 추가할 수 있습니다.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 날짜 및 캘린더 정보 */}
          <div className="bg-accent/50 p-3 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            {currentCalendar && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: 'rgb(176, 224, 230)' }}
                ></div>
                <span className="text-sm">{currentCalendar.name}</span>
              </div>
            )}
          </div>

          {/* 이벤트 목록 */}
          <ScrollArea className="max-h-96">
            <div className="space-y-3 pr-4">
              {sortedEvents.length > 0 ? (
                sortedEvents.map((event, index) => {
                  const isSelected = selectedEventIds.has(event.id);
                  const isEditing = editingEventId === event.id;
                  const isExpanded = expandedEventId === event.id;
                  
                  return (
                    <div key={event.id}>
                      <div 
                        className={`group relative flex flex-col space-y-3 p-4 rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20' 
                            : 'bg-card hover:bg-accent/50'
                        }`}
                      >
                        {/* 액션 버튼들 */}
                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-blue-500 hover:text-white"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              if (isEditing) {
                                handleCancelEdit();
                              } else {
                                handleEditEvent(event);
                              }
                            }}
                            title={isEditing ? "편집 취소" : "이벤트 편집"}
                          >
                            {isEditing ? <X className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleSingleEventDelete(event.id);
                            }}
                            title="이벤트 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {isEditing ? (
                          /* 편집 모드 */
                          <div className="space-y-3 pr-16">
                            <Input
                              value={editingEvent.title || ''}
                              onChange={(e) => setEditingEvent(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="이벤트 제목"
                              className="text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="time"
                                value={editingEvent.startTime || ''}
                                onChange={(e) => setEditingEvent(prev => ({ ...prev, startTime: e.target.value }))}
                                className="text-sm"
                              />
                              <Input
                                type="time"
                                value={editingEvent.endTime || ''}
                                onChange={(e) => setEditingEvent(prev => ({ ...prev, endTime: e.target.value }))}
                                className="text-sm"
                              />
                            </div>
                            <Textarea
                              value={editingEvent.content || ''}
                              onChange={(e) => setEditingEvent(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="이벤트 설명"
                              className="text-sm min-h-[60px] resize-none"
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={handleSaveEdit} className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                저장
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="text-xs">
                                취소
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* 보기 모드 */
                          <div 
                            className="flex items-start space-x-3 cursor-pointer pr-16"
                            onClick={() => handleEventClick(event.id)}
                          >
                            <div className={`w-1 h-full rounded-full ${event.color} min-h-[60px]`}></div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">{event.title}</h4>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span>{formatEventTime(event)}</span>
                                  </Badge>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                      <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* 이벤트 내용 */}
                              {event.content && (
                                <div className="flex items-start space-x-2">
                                  <FileText className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                  <p className={`text-sm text-muted-foreground leading-relaxed ${!isExpanded && event.content.length > 100 ? 'line-clamp-2' : ''}`}>
                                    {event.content}
                                  </p>
                                </div>
                              )}

                              {/* 이미지 섹션 */}
                              {event.images && event.images.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {event.images.length}개의 이미지
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    {(isExpanded ? event.images : event.images.slice(0, 3)).map((imageUrl, imageIndex) => (
                                      <div key={imageIndex} className="relative group">
                                        <ImageWithFallback
                                          src={imageUrl}
                                          alt={`${event.title} 이미지 ${imageIndex + 1}`}
                                          className="w-full h-16 object-cover rounded border"
                                        />
                                        {onUpdateEvent && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-0 right-0 h-4 w-4 p-0 bg-black/50 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e: React.MouseEvent) => {
                                              e.stopPropagation();
                                              handleRemoveImage(event.id, imageIndex);
                                            }}
                                          >
                                            <X className="h-2 w-2" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  {!isExpanded && event.images.length > 3 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-muted-foreground h-6"
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        toggleEventExpanded(event.id);
                                      }}
                                    >
                                      +{event.images.length - 3}개 더 보기
                                    </Button>
                                  )}
                                </div>
                              )}

                              {/* 더보기/접기 버튼 */}
                              {(event.content && event.content.length > 100) || (event.images && event.images.length > 3) ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs text-muted-foreground h-6"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    toggleEventExpanded(event.id);
                                  }}
                                >
                                  {isExpanded ? '접기' : '더보기'}
                                </Button>
                              ) : null}

                              {/* 이미지 업로드 버튼 */}
                              {onUpdateEvent && (
                                <div className="pt-2">
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    id={`upload-${event.id}`}
                                    onChange={(e) => handleImageUpload(event.id, e.target.files)}
                                  />
                                  <label htmlFor={`upload-${event.id}`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs h-7 cursor-pointer"
                                      asChild
                                    >
                                      <span>
                                        <Camera className="h-3 w-3 mr-1" />
                                        사진 추가
                                      </span>
                                    </Button>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {index < sortedEvents.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">이 날짜에는 등록된 일정이 없습니다.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 액션 버튼들 */}
          <Separator />
          <div className="flex space-x-2 pt-2">
            <Button 
              onClick={handleAddNewEvent}
              className="flex-1"
              variant="default"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 일정 추가
            </Button>
            {selectedEventIds.size > 0 && (
              <Button 
                onClick={handleDeleteSelected}
                variant="destructive"
                className="px-4"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제 ({selectedEventIds.size})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {eventToDelete && events.find(e => e.id === eventToDelete) && (
                <>
                  <span className="font-medium">"{events.find(e => e.id === eventToDelete)?.title}"</span> 이벤트를 삭제하시겠습니까?<br />
                  삭제된 이벤트는 복구할 수 없습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}