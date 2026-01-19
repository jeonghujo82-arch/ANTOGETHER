import { Calendar, Users, Menu } from 'lucide-react';
import { Button } from './ui/button';

interface MobileNavigationProps {
  currentView: 'calendar' | 'chat';
  onViewChange: (view: 'calendar' | 'chat') => void;
  onCalendarsClick: () => void;
  onFeaturesClick: () => void;
  user?: { email: string; name: string } | null;
  onLogout?: () => void;
}

export function MobileNavigation({ currentView, onViewChange, onCalendarsClick, onFeaturesClick, user, onLogout }: MobileNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t z-50 safe-area-pb lg:hidden">
      <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
        <Button
          variant={currentView === 'calendar' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('calendar')}
          className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto min-h-12 transition-colors ${
            currentView === 'calendar' 
              ? 'bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90' 
              : 'hover:bg-[#1A1A1A]/90 hover:text-white'
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">캘린더</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCalendarsClick}
          className="flex flex-col items-center space-y-1 px-3 py-2 h-auto min-h-12 hover:bg-[#1A1A1A]/90 hover:text-white transition-colors"
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">내 캘린더</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onFeaturesClick}
          className="flex flex-col items-center space-y-1 px-3 py-2 h-auto min-h-12 hover:bg-[#1A1A1A]/90 hover:text-white transition-colors"
        >
          <Menu className="h-5 w-5" />
          <span className="text-xs">기능</span>
        </Button>
      </div>
    </div>
  );
}