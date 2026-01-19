CREATE TABLE users (
  user_num INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  user_mail VARCHAR(100) NOT NULL,
  user_name VARCHAR(50) NOT NULL,
  user_phone VARCHAR(20),
  user_pass VARCHAR(128) NOT NULL
);

-- 캘린더 테이블 (사용자별)
CREATE TABLE calendars (
  calendar_id INT PRIMARY KEY AUTO_INCREMENT,
  calendar_name VARCHAR(100) NOT NULL,
  calendar_purpose VARCHAR(50),
  calendar_color VARCHAR(50),
  user_num INT NOT NULL,
  member_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_num) REFERENCES users(user_num) ON DELETE CASCADE
);

-- 이벤트 테이블 (캘린더별, 사용자별)
CREATE TABLE events (
  event_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color VARCHAR(50),
  calendar_id INT NOT NULL,
  user_num INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (calendar_id) REFERENCES calendars(calendar_id) ON DELETE CASCADE,
  FOREIGN KEY (user_num) REFERENCES users(user_num) ON DELETE CASCADE
);
