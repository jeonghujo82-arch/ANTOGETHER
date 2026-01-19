
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Upload } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  schedule_data?: any;
}

const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        sender: 'bot',
        text: data.reply || '일정 데이터를 확인하세요.',
        schedule_data: data.schedule_data,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = {
        sender: 'bot',
        text: '죄송합니다. 응답을 받아오는 중 오류가 발생했습니다.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isLoading) return;

    const userMessage: Message = { sender: 'user', text: `파일 업로드: ${file.name}` };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('http://127.0.0.1:5000/api/chat/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const botMessage: Message = {
            sender: 'bot',
            text: data.error ? data.error : '파일에서 추출된 일정 데이터입니다.',
            schedule_data: data.schedule_data,
        };
        setMessages(prev => [...prev, botMessage]);
    } catch (error) {
        console.error('Error uploading file:', error);
        const errorMessage: Message = {
            sender: 'bot',
            text: '파일 업로드 중 오류가 발생했습니다.',
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveSchedule = (events: any) => {
    // TODO: Implement logic to save schedule to the main calendar state
    console.log("Saving schedule:", events);
    alert('일정이 저장되었습니다! (콘솔 확인)');
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">AI 일정 도우미</h1>
      <ScrollArea className="flex-grow mb-4 p-4 border rounded-md" ref={scrollAreaRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col mb-3 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              <p>{msg.text}</p>
              {msg.schedule_data && msg.schedule_data.events && msg.schedule_data.events.length > 0 && (
                <div className="mt-2">
                  <h3 className="font-bold">추출된 일정:</h3>
                  <ul className="list-disc list-inside">
                    {msg.schedule_data.events.map((event: any, i: number) => (
                      <li key={i}>{event.title} ({event.start_date})</li>
                    ))}
                  </ul>
                  <Button onClick={() => handleSaveSchedule(msg.schedule_data.events)} size="sm" className="mt-2">
                    캘린더에 저장
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="rounded-lg px-4 py-2 bg-gray-200">...</div></div>}
      </ScrollArea>
      <div className="flex items-center">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="메시지를 입력하거나 파일을 업로드하세요..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button onClick={handleSendMessage} className="ml-2" disabled={isLoading}>
          전송
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} className="ml-2" variant="outline" disabled={isLoading}>
          <Upload className="h-4 w-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt,.pdf,.ics"
        />
      </div>
    </div>
  );
};

export default AiAssistantPage;
