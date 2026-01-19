import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Calendar as CalendarIcon, Clock, CalendarDays, Camera, X, Image as ImageIcon, Palette } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { toast } from 'sonner';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  calendarId: string;
  onAddEvent: (event: {
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

export function AddEventDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  calendarId,
  onAddEvent 
}: AddEventDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');
  const [selectedColor, setSelectedColor] = useState('rgb(220, 53, 69)'); // 빨간색으로 기본값 변경
  const [images, setImages] = useState<string[]>([]);

  // 파스텔 색상 목록
  const colorOptions = [
    { value: 'rgb(220, 53, 69)', label: '빨간색' }, // 빨간색 추가
    { value: 'rgb(255, 182, 193)', label: '베이비핑크' },
    { value: 'rgb(247, 202, 201)', label: '로즈쿼츠' },
    { value: 'rgb(221, 191, 255)', label: '라벤더' },
    { value: 'rgb(176, 224, 230)', label: '파우더블루' },
    { value: 'rgb(189, 236, 182)', label: '민트그린' },
    { value: 'rgb(255, 253, 208)', label: '크림옐로' },
    { value: 'rgb(255, 239, 184)', label: '버터' },
    { value: 'rgb(255, 218, 185)', label: '피치' },
    { value: 'rgb(230, 223, 250)', label: '페일퍼플' },
    { value: 'rgb(255, 240, 245)', label: '화이트핑크' },
    { value: 'rgb(255, 200, 164)', label: '애프리콧' },
    { value: 'rgb(197, 225, 197)', label: '세이지민트' },
    { value: 'rgb(135, 206, 235)', label: '스카이블루' },
    { value: 'rgb(250, 192, 181)', label: '연살몬핑크' },
    { value: 'rgb(245, 234, 200)', label: '바닐라' },
    { value: 'rgb(230, 220, 240)', label: '페일라일락' },
    { value: 'rgb(192, 242, 233)', label: '소프트민트' },
    { value: 'rgb(173, 216, 230)', label: '베이비블루' },
    { value: 'rgb(255, 160, 160)', label: '파스텔코랄' },
    { value: 'rgb(255, 250, 205)', label: '레몬크림' }
  ];

  // selectedDate가 변경될 때 시작일과 종료일 초기화
  useEffect(() => {
    if (selectedDate) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  }, [selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate || !title.trim()) return;

    onAddEvent({
      title: title.trim(),
      content: content.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      color: selectedColor,
      images: images.length > 0 ? images : undefined
    });

    setTitle('');
    setContent('');
    setStartTime('12:00');
    setEndTime('13:00');
    setImages([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setStartTime('12:00');
    setEndTime('13:00');
    setSelectedColor('rgb(220, 53, 69)');
    setImages([]);
    onOpenChange(false);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    // 실제 구현에서는 파일을 서버에 업로드하고 URL을 받아야 함
    // 여기서는 시뮬레이션을 위해 더미 URL 생성
    const newImageUrls = Array.from(files).map((file, index) => 
      `https://picsum.photos/400/300?random=${Date.now()}_${index}`
    );
    
    setImages(prev => [...prev, ...newImageUrls]);
    toast.success(`${files.length}개의 이미지가 추가되었습니다`);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('이미지가 삭제되었습니다');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatDateInput = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value);
    setStartDate(newStartDate);
    
    // 시작일이 종료일보다 늦으면 종료일을 시작일로 설정
    if (endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value);
    
    // 종료일이 시작일보다 이르면 시작일로 설정
    if (startDate && newEndDate < startDate) {
      setEndDate(startDate);
    } else {
      setEndDate(newEndDate);
    }
  };

  const calendarInfo = {
    '1': { name: '게임 스케줄', color: 'text-blue-600' },
    '2': { name: '운동 계획', color: 'text-green-600' }
  };

  const currentCalendar = calendarInfo[calendarId as keyof typeof calendarInfo];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader className="bg-black text-white p-4 -m-6 mb-6 rounded-t-lg">
          <DialogTitle className="flex items-center space-x-2 text-white">
            <CalendarIcon className="h-5 w-5 text-white" />
            <span>새 이벤트 추가</span>
          </DialogTitle>
          <DialogDescription className="text-white/80">
            새로운 일정을 추가하세요.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            {/* 캘린더 정보 */}
            {currentCalendar && (
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className={`text-sm ${currentCalendar.color}`}>
                  {currentCalendar.name}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이벤트 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">이벤트 제목 *</Label>
                <Input
                  id="title"
                  placeholder="이벤트 제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* 색상 선택 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <Palette className="h-4 w-4" />
                  <span>이벤트 색상</span>
                </Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.slice(0, 15).map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <div 
                    className="w-4 h-4 rounded-full border" 
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span>
                    {colorOptions.find(c => c.value === selectedColor)?.label || '선택된 색상'}
                  </span>
                </div>
              </div>

              {/* 날짜 설정 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <CalendarDays className="h-4 w-4" />
                  <span>날짜 *</span>
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm text-muted-foreground">시작</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formatDateInput(startDate)}
                      onChange={handleStartDateChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm text-muted-foreground">종료</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formatDateInput(endDate)}
                      onChange={handleEndDateChange}
                      min={formatDateInput(startDate)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 시간 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>시작 시간</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>종료 시간</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* 이벤트 내용 */}
              <div className="space-y-2">
                <Label htmlFor="content">이벤트 내용</Label>
                <Textarea
                  id="content"
                  placeholder="이벤트에 대한 자세한 내용을 입력하세요 (선택사항)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* 이미지 업로드 섹션 */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-1">
                  <ImageIcon className="h-4 w-4" />
                  <span>이미지</span>
                </Label>
                
                {/* 이미지 업로드 버튼 */}
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => handleImageUpload(e.target.files)}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full cursor-pointer"
                      asChild
                    >
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        사진 추가 ({images.length})
                      </span>
                    </Button>
                  </label>
                </div>

                {/* 이미지 미리보기 */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 p-3 bg-accent/30 rounded-lg">
                    {images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <ImageWithFallback
                          src={imageUrl}
                          alt={`업로드된 이미지 ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-0 right-0 h-5 w-5 p-0 bg-black/50 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 버튼들 */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={!title.trim() || !startDate || !endDate}
                >
                  추가
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}