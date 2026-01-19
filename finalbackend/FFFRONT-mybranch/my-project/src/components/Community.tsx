import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ArrowLeft, 
  Plus, 
  Send, 
  Pin, 
  Users, 
  MessageSquare,
  Search,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

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

interface CommunityProps {
  calendarId: string;
  calendarName: string;
  announcements: Announcement[];
  comments: Comment[];
  onBack: () => void;
  onBackToCalendar?: () => void;
  onPostClick: (announcement: Announcement) => void;
  onAddComment: (announcementId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export function Community({ 
  calendarId, 
  calendarName, 
  announcements,
  comments,
  onBack, 
  onBackToCalendar,
  onPostClick,
  onAddComment,
  onDeleteComment
}: CommunityProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommentCount = (announcementId: string) => {
    return comments.filter(comment => comment.announcementId === announcementId).length;
  };

  const getLatestComment = (announcementId: string) => {
    const postComments = comments
      .filter(comment => comment.announcementId === announcementId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return postComments[0];
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedPosts = filteredAnnouncements.filter(post => post.isPinned);
  const regularPosts = filteredAnnouncements.filter(post => !post.isPinned);

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.');
      return;
    }

    // 실제 구현에서는 서버 API 호출
    console.log('새 게시글 생성:', { title: newPostTitle, content: newPostContent, calendarId });
    
    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPostForm(false);
    toast.success('게시글이 작성되었습니다!');
  };

  const handlePostClick = (announcement: Announcement) => {
    onPostClick(announcement);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 bg-card border-b border-border p-4">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="truncate">{calendarName}</h1>
            <p className="text-sm text-muted-foreground">커뮤니티</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="hidden sm:flex">
              <Users className="h-3 w-3 mr-1" />
              12명
            </Badge>
          </div>
        </div>

        {/* 검색 및 새 글 작성 */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="게시글 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            size="sm"
            onClick={() => setShowNewPostForm(!showNewPostForm)}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">새 글</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* 새 글 작성 폼 */}
            {showNewPostForm && (
              <Card className="p-4 border-primary/20">
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="게시글 제목을 입력하세요..."
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="mb-3"
                    />
                    <Textarea
                      placeholder="내용을 입력하세요..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowNewPostForm(false);
                        setNewPostTitle('');
                        setNewPostContent('');
                      }}
                    >
                      취소
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleCreatePost}
                      disabled={!newPostTitle.trim() || !newPostContent.trim()}
                    >
                      작성
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* 고정된 게시글 */}
            {pinnedPosts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Pin className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">고정된 게시글</span>
                </div>
                {pinnedPosts.map((announcement) => {
                  const commentCount = getCommentCount(announcement.id);
                  const latestComment = getLatestComment(announcement.id);
                  
                  return (
                    <Card 
                      key={announcement.id} 
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors border-yellow-500/20 bg-yellow-500/5"
                      onClick={() => handlePostClick(announcement)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="truncate">{announcement.title}</h3>
                              <Pin className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {announcement.content}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-3">
                            <span>{announcement.author}</span>
                            <span>{formatDate(announcement.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {commentCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{commentCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {latestComment && (
                          <div className="bg-muted/50 rounded p-2 text-xs">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-muted-foreground">최근 댓글:</span>
                              <span>{latestComment.author}</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-1">{latestComment.content}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {regularPosts.length > 0 && <Separator className="my-4" />}
              </div>
            )}

            {/* 일반 게시글 */}
            {regularPosts.length > 0 ? (
              <div className="space-y-3">
                {pinnedPosts.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">최근 게시글</span>
                  </div>
                )}
                {regularPosts.map((announcement) => {
                  const commentCount = getCommentCount(announcement.id);
                  const latestComment = getLatestComment(announcement.id);
                  
                  return (
                    <Card 
                      key={announcement.id} 
                      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handlePostClick(announcement)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="truncate mb-1">{announcement.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {announcement.content}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-3">
                            <span>{announcement.author}</span>
                            <span>{formatDate(announcement.timestamp)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {commentCount > 0 && (
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{commentCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {latestComment && (
                          <div className="bg-muted/50 rounded p-2 text-xs">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-muted-foreground">최근 댓글:</span>
                              <span>{latestComment.author}</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-1">{latestComment.content}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : filteredAnnouncements.length === 0 && searchTerm ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">검색 결과가 없습니다.</p>
                <p className="text-xs mt-1">다른 키워드로 검색해보세요.</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">아직 게시글이 없습니다.</p>
                <p className="text-xs mt-1">첫 번째 게시글을 작성해보세요!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}