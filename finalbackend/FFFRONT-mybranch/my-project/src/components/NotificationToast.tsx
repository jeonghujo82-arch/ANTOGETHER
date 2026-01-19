import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationToastProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'consent';
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  badge?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  // YES/NO 동의 시스템을 위한 새로운 props
  showYesNo?: boolean;
  onYes?: () => void;
  onNo?: () => void;
  yesLabel?: string;
  noLabel?: string;
  autoClose?: boolean;
  duration?: number;
  position?: 'top' | 'bottom';
}

export function NotificationToast({
  open,
  onOpenChange,
  variant = 'default',
  title,
  message,
  icon,
  badge,
  action,
  showYesNo = false,
  onYes,
  onNo,
  yesLabel = 'YES',
  noLabel = 'NO',
  autoClose = true,
  duration = 3000,
  position = 'top'
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
      // YES/NO 모드일 때는 자동 닫기 비활성화
      if (autoClose && !showYesNo) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [open, autoClose, duration, showYesNo]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onOpenChange(false), 200); // 애니메이션 완료 후 상태 변경
  };

  const handleYes = () => {
    if (onYes) {
      onYes();
    }
    handleClose();
  };

  const handleNo = () => {
    if (onNo) {
      onNo();
    }
    handleClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400',
          defaultIcon: <Check className="w-4 h-4" />
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          defaultIcon: <AlertCircle className="w-4 h-4" />
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400',
          defaultIcon: <AlertTriangle className="w-4 h-4" />
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400',
          defaultIcon: <Info className="w-4 h-4" />
        };
      case 'consent':
        return {
          container: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
          icon: 'text-orange-600 dark:text-orange-400',
          defaultIcon: <AlertCircle className="w-4 h-4" />
        };
      default:
        return {
          container: 'bg-background border-border shadow-lg',
          icon: 'text-muted-foreground',
          defaultIcon: <Info className="w-4 h-4" />
        };
    }
  };

  const styles = getVariantStyles();

  if (!open) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={`fixed inset-x-4 z-50 ${position === 'top' ? 'top-4' : 'bottom-4'}`}>
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position === 'top' ? -20 : 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              flex items-center justify-between p-3 rounded-lg border backdrop-blur-sm
              ${styles.container}
            `}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* 아이콘 */}
              <div className={`flex-shrink-0 ${styles.icon}`}>
                {icon || styles.defaultIcon}
              </div>

              {/* 메시지 영역 */}
              <div className="flex-1 min-w-0">
                {title && (
                  <div className="font-medium text-sm mb-1 truncate">
                    {title}
                  </div>
                )}
                {message && (
                  <div className="text-sm text-muted-foreground truncate">
                    {message}
                  </div>
                )}
              </div>

              {/* 뱃지 */}
              {badge && (
                <Badge variant="secondary" className="flex-shrink-0">
                  {badge}
                </Badge>
              )}
            </div>

            {/* YES/NO 버튼 또는 일반 액션 버튼과 닫기 버튼 */}
            <div className="flex items-center space-x-2 ml-3">
              {showYesNo ? (
                // YES/NO 동의 버튼들
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleYes}
                    className="h-8 px-3 text-xs border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950"
                  >
                    {yesLabel}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNo}
                    className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    {noLabel}
                  </Button>
                </>
              ) : (
                // 일반 액션 버튼
                <>
                  {action && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={action.onClick}
                      className="h-8 px-2"
                    >
                      {action.label}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="h-8 w-8 p-0 hover:bg-background/50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}