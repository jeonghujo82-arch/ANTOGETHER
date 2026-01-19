import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChatBot } from './ChatBot';
import { MessageSquare, Settings, Calendar, Users, ArrowLeft } from 'lucide-react';

interface FeaturePanelProps {
  onBack: () => void;
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

type FeatureType = 'chat' | 'settings' | 'analytics' | 'team';

interface FeatureTab {
  id: FeatureType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  available: boolean;
}

export function FeaturePanel({ 
  onBack, 
  currentCalendarId,
  calendars = [],
  onAddEvent 
}: FeaturePanelProps) {
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>('chat');

  const featureTabs: FeatureTab[] = [
    {
      id: 'chat',
      label: '일정 관리 봇',
      icon: <MessageSquare className="h-5 w-5" />,
      available: true
    },
    {
      id: 'settings',
      label: '설정',
      icon: <Settings className="h-5 w-5" />,
      badge: '곧 출시',
      available: false
    },
    {
      id: 'analytics',
      label: '분석',
      icon: <Calendar className="h-5 w-5" />,
      badge: '곧 출시',
      available: false
    },
    {
      id: 'team',
      label: '팀 관리',
      icon: <Users className="h-5 w-5" />,
      badge: '곧 출시',
      available: false
    }
  ];

  const selectedTab = featureTabs.find(tab => tab.id === selectedFeature);

  const handleTabClick = (featureId: FeatureType) => {
    const feature = featureTabs.find(tab => tab.id === featureId);
    if (feature?.available) {
      setSelectedFeature(featureId);
    }
  };

  const renderFeatureContent = () => {
    switch (selectedFeature) {
      case 'chat':
        return (
          <ChatBot 
            currentCalendarId={currentCalendarId}
            calendars={calendars}
            onAddEvent={onAddEvent}
          />
        );
      case 'settings':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="mb-2">설정 기능</h3>
              <p className="text-sm">곧 출시될 예정입니다.</p>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="mb-2">분석 기능</h3>
              <p className="text-sm">일정 통계와 분석 기능이 곧 출시됩니다.</p>
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="mb-2">팀 관리</h3>
              <p className="text-sm">팀원 관리 기능이 곧 출시됩니다.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="border-b p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>뒤로</span>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center space-x-2">
              {selectedTab?.icon}
              <span className="font-medium">{selectedTab?.label}</span>
              {selectedTab?.badge && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTab.badge}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedFeature === 'chat' && 'AI 도우미와 대화하여 자연스럽게 일정을 추가하고 관리하세요.'}
          {selectedFeature === 'settings' && '캘린더 설정을 관리하고 개인화 옵션을 조정할 수 있습니다.'}
          {selectedFeature === 'analytics' && '일정 통계와 분석 데이터를 확인하여 시간 관리를 개선하세요.'}
          {selectedFeature === 'team' && '팀원들과 함께 캘린더를 공유하고 협업하세요.'}
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 기능 탭 사이드바 */}
        <div className="w-20 sm:w-24 bg-muted/30 border-r flex flex-col py-4">
          {featureTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={selectedFeature === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => handleTabClick(tab.id)}
              disabled={!tab.available}
              className="flex flex-col items-center gap-1 h-16 mx-2 mb-2 relative"
              title={tab.available ? tab.label : `${tab.label} - ${tab.badge}`}
            >
              {tab.icon}
              <span className="text-xs hidden sm:block truncate w-full text-center">
                {tab.label.split(' ')[0]}
              </span>
              {tab.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4 min-w-4 hidden sm:flex items-center justify-center"
                >
                  !
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* 기능 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {renderFeatureContent()}
        </div>
      </div>
    </div>
  );
}