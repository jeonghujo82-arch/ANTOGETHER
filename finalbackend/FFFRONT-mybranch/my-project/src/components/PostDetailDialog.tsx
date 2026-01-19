import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  Send, 
  Trash2, 
  Pin,
  X
} from 'lucide-react';

interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
  announcementId: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  isPinned: boolean;
}

interface PostDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: Announcement | null;
  comments: Comment[];
  onAddComment: (announcementId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function PostDetailDialog({
  open,
  onOpenChange,
  announcement,
  comments,
  onAddComment,
  onDeleteComment
}: PostDetailDialogProps) {
  const [newComment, setNewComment] = useState('');

  if (!announcement) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddComment = () => {
    const commentContent = newComment.trim();
    if (!commentContent) return;

    onAddComment(announcement.id, commentContent);
    setNewComment('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const postComments = comments.filter(comment => comment.announcementId === announcement.id)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 pr-8">
              <span className="truncate">{announcement.title}</span>
              {announcement.isPinned && <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
            </DialogTitle>
          </div>
          <DialogDescription>
            게시글의 상세 내용을 확인하고 댓글을 작성할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* 게시글 내용 */}
          <div className="flex-shrink-0 border-b pb-4 mb-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {announcement.content}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>작성자: {announcement.author}</span>
                <span>{formatDate(announcement.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">댓글 {postComments.length}개</h4>
            </div>

            {/* 댓글 목록 */}
            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-3 pr-4">
                {postComments.length > 0 ? (
                  postComments.map((comment) => (
                    <div key={comment.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{comment.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.timestamp)}
                            </span>
                          </div>
                        </div>
                        {comment.author === '나' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteComment(comment.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm pl-8">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="text-sm">아직 댓글이 없습니다.</p>
                    <p className="text-xs mt-1">첫 번째 댓글을 작성해보세요!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* 댓글 입력 */}
            <div className="flex-shrink-0 border-t pt-4">
              <div className="flex space-x-2">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="text-xs">나</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder="댓글을 입력하세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}