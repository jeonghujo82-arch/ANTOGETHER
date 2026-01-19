import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';

interface AiPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventData: {
    title: string;
    content: string;
  } | null;
  onConfirm: () => void;
}

export function AiPreviewDialog({ open, onOpenChange, eventData, onConfirm }: AiPreviewDialogProps) {
  if (!eventData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{eventData.title}</DialogTitle>
          <DialogDescription className="py-4">
            {eventData.content}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={onConfirm}>캘린더에 추가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}