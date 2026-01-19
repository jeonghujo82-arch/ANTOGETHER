import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Send, 
  Trash2, 
  Pin,
  ArrowLeft
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

interface PostDetailViewProps {
  announcement: Announcement;
  comments: Comment[];
  calendarName: string;
  onBack: () => void;
  onAddComment: (announcementId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function PostDetailView({
  announcement,
  comments,
  calendarName,
  onBack,
  onAddComment,
  onDeleteComment
}: PostDetailViewProps) {
  const [newComment, setNewComment] = useState('');

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

  const sortedComments = [...comments].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 bg-card border-b border-border p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="truncate">{announcement.title}</h1>
              {announcement.isPinned && <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">{calendarName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* 게시글 내용 */}
        <div className="flex-shrink-0 border-b border-border p-6">
          <div className="space-y-4">
            <div className="prose prose-invert max-w-none">
              <p className="whitespace-pre-wrap leading-relaxed">
                {announcement.content}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
              <span>작성자: {announcement.author}</span>
              <span>{formatDate(announcement.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-shrink-0 p-4 border-b border-border">
            <h2 className="text-lg">댓글 {sortedComments.length}개</h2>
          </div>

          {/* 댓글 목록 */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {sortedComments.length > 0 ? (
                <div className="space-y-6">
                  {sortedComments.map((comment, index) => (
                    <div key={comment.id}>
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarFallback>{comment.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.timestamp)}
                              </span>
                            </div>
                            {comment.author === '나' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteComment(comment.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                      {index < sortedComments.length - 1 && (
                        <div className="mt-6 border-b border-border"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-sm">아직 댓글이 없습니다.</p>
                  <p className="text-xs mt-1">첫 번째 댓글을 작성해보세요!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 댓글 입력 */}
          <div className="flex-shrink-0 border-t border-border p-4 bg-card">
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback>나</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-3">
                <Input
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-4"
                >
                  <Send className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">댓글 작성</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}