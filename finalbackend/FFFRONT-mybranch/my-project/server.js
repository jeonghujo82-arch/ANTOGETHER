import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = 5000;

const dbPath = path.join(process.cwd(), 'db.json');

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    // Handle empty file case
    if (data.trim() === '') {
      return { users: [], calendars: [], events: [] };
    }
    const jsonData = JSON.parse(data);
    // Ensure all expected top-level arrays exist
    return {
      users: jsonData.users || [],
      calendars: jsonData.calendars || [],
      events: jsonData.events || [],
    };
  } catch (error) {
    // If file doesn't exist or is invalid JSON, create a new one
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      const initialDb = { users: [], calendars: [], events: [] };
      await fs.writeFile(dbPath, JSON.stringify(initialDb, null, 2));
      return initialDb;
    }
    // For other errors (e.g., permissions), re-throw
    throw error;
  }
}

async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

app.use(cors());
app.use(express.json());

// Add a simple test route at the very top
app.get('/test-server', (req, res) => {
  res.status(200).json({ message: 'Server is running!' });
});

// Auth
app.post('/login', async (req, res) => {
  console.log('Received login request:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 모두 입력해주세요.' });
  }

  try {
    const db = await readDb();
    const user = db.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    console.log('Login successful for user:', user.email);

    const userResponse = {
      id: user.id,
      user_num: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone
    };

    res.status(200).json({ message: '로그인 성공', user: userResponse });

  } catch (error) {
    console.error('Error processing login:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

app.post('/register', async (req, res) => {
  console.log('Received registration data:', req.body);
  const { email, password, username, phone } = req.body;

  if (!email || !password || !username || !phone) {
    return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
  }

  try {
    const db = await readDb();
    const existingUser = db.users.find(user => user.email === email);

    if (existingUser) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    const newUser = { id: Date.now().toString(), email, password, username, phone };
    db.users.push(newUser);
    await writeDb(db);

    console.log('User saved:', newUser);
    res.status(201).json({ message: '가입 성공' });

  } catch (error) {
    console.error('Error processing registration:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

app.post('/logout', (req, res) => {
    // In a real app, you'd invalidate a token here.
    // For this mock server, we just confirm the logout action.
    res.status(200).json({ message: '로그아웃 성공' });
});


// Calendars
app.post('/api/calendars', async (req, res) => {
    const { calendar_name, calendar_purpose, calendar_color, user_num } = req.body;

    if (!calendar_name || !calendar_purpose || !calendar_color || !user_num) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    try {
        const db = await readDb();
        const newCalendar = {
            calendar_id: Date.now().toString(),
            calendar_name,
            calendar_purpose,
            calendar_color,
            user_num
        };

        db.calendars.push(newCalendar);
        await writeDb(db);

        res.status(201).json({ message: '캘린더 생성 성공', calendar_id: newCalendar.calendar_id });
    } catch (error) {
        console.error('Error creating calendar:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/calendars/:userNum', async (req, res) => {
    const { userNum } = req.params;
    try {
        const db = await readDb();
        const userCalendars = db.calendars?.filter(c => c.user_num === userNum) || [];
        res.status(200).json({ message: '캘린더 조회 성공', calendars: userCalendars });
    } catch (error) {
        console.error('Error fetching calendars:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

// Events
app.post('/api/events', async (req, res) => {
    const { title, content, start_date, end_date, start_time, end_time, color, calendar_id, user_num } = req.body;

    if (!title || !start_date || !end_date || !calendar_id || !user_num) {
        return res.status(400).json({ message: '필수 필드를 모두 입력해주세요.' });
    }

    try {
        const db = await readDb();
        const newEvent = {
            event_id: Date.now().toString(),
            title,
            content,
            start_date,
            end_date,
            start_time,
            end_time,
            color,
            calendar_id,
            user_num
        };

        db.events.push(newEvent);
        await writeDb(db);

        res.status(201).json({ message: '이벤트 생성 성공', event_id: newEvent.event_id });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/events/:calendarId/:userNum', async (req, res) => {
    const { calendarId, userNum } = req.params;
    try {
        const db = await readDb();
        const calendarEvents = db.events?.filter(e => e.calendar_id === calendarId && e.user_num === userNum) || [];
        res.status(200).json({ message: '이벤트 조회 성공', events: calendarEvents });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

app.get('/api/user/:userNum/events', async (req, res) => {
    const { userNum } = req.params;
    try {
        const db = await readDb();
        const userEvents = db.events?.filter(e => e.user_num === userNum) || [];
        res.status(200).json({ message: '사용자 전체 이벤트 조회 성공', events: userEvents });
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

app.delete('/api/events/:eventId', async (req, res) => {
    const { eventId } = req.params;
    try {
        const db = await readDb();
        const eventIndex = db.events?.findIndex(e => e.event_id === eventId);

        if (eventIndex > -1) {
            db.events.splice(eventIndex, 1);
            await writeDb(db);
            res.status(200).json({ message: '이벤트 삭제 성공' });
        } else {
            res.status(404).json({ message: '이벤트를 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});


app.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.status(200).json({ message: 'API connection successful!' });
});

app.listen(port, () => {
  console.log(`Mock server with persistence listening at http://localhost:${port}`);
  readDb().catch(console.error);
});