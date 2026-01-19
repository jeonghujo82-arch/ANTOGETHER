import mysql.connector
from mysql.connector import errorcode
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.security import generate_password_hash, check_password_hash
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, timedelta
import random

import sys # Import sys here
from dotenv import load_dotenv # Import load_dotenv here

# Load .env at the very beginning
load_dotenv(r'C:\checkmate\.env') # Fixed escape sequence
# Directly set environment variables from the .env content provided by the user

os.environ["NAVER_CLIENT_SECRET"] = 'ha_Z6kFUxn'

# Add the package to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'ant_chat_gpt')))

from weather.weather_alarm import WeatherCommentator
from calendar_comment.calendar_commentor import CalendarCommentator
from mediator import ScheduleMediator
from ant_chat_gpt import AntChatGPT
import tempfile



app = Flask(__name__)
CORS(app)

# Initialize AntChatGPT
ant_chat = AntChatGPT()

# ==============================================================================
# TODO: MySQL 데이터베이스 접속 정보를 여기에 입력하세요.
# ==============================================================================
db_config = {
    'host': '127.0.0.1',    # localhost 대신 127.0.0.1 권장
    'port': 3306,           # 1단계에서 본 포트가 3306이 아니면 그 값으로
    'user': 'checkmate',
    'password': 'YourStrong!Pass1',
    'database': 'checkmate_db'
}
# ==============================================================================

# Initialize AI modules
weather_commentator = WeatherCommentator()
calendar_commentator = CalendarCommentator()
schedule_mediator = ScheduleMediator()

def get_db():
    """데이터베이스 연결 함수"""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Something is wrong with your user name or password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print("Database does not exist")
        else:
            print(err)
        return None

def create_tables():
    """MySQL에 필요한 테이블들을 생성"""
    conn = None
    try:
        conn = get_db()
        if conn is None:
            print("Database connection failed. Tables not created.")
            return
            
        cursor = conn.cursor()
        
        TABLES = {}

        # users 테이블
        TABLES['users'] = (
            "CREATE TABLE IF NOT EXISTS `users` ("
            "  `user_num` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `user_id` VARCHAR(255) NOT NULL UNIQUE,"
            "  `user_mail` VARCHAR(255) NOT NULL,"
            "  `user_name` VARCHAR(255) NOT NULL,"
            "  `user_phone` VARCHAR(50),"
            "  `user_pass` VARCHAR(255) NOT NULL"
            ") ENGINE=InnoDB")

        # calendars 테이블
        TABLES['calendars'] = (
            "CREATE TABLE IF NOT EXISTS `calendars` ("
            "  `calendar_id` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `calendar_name` VARCHAR(255) NOT NULL,"
            "  `calendar_purpose` TEXT,"
            "  `calendar_color` VARCHAR(50),"
            "  `user_num` INT NOT NULL,"
            "  `member_count` INT DEFAULT 1,"
            "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  FOREIGN KEY (`user_num`) REFERENCES `users`(`user_num`) ON DELETE CASCADE"
            ") ENGINE=InnoDB")

        # events 테이블
        TABLES['events'] = (
            "CREATE TABLE IF NOT EXISTS `events` ("
            "  `event_id` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `title` VARCHAR(255) NOT NULL,"
            "  `content` TEXT,"
            "  `start_date` DATE NOT NULL,"
            "  `end_date` DATE NOT NULL,"
            "  `start_time` TIME NOT NULL,"
            "  `end_time` TIME NOT NULL,"
            "  `color` VARCHAR(50),"
            "  `calendar_id` INT NOT NULL,"
            "  `user_num` INT NOT NULL,"
            "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`calendar_id`) ON DELETE CASCADE,"
            "  FOREIGN KEY (`user_num`) REFERENCES `users`(`user_num`) ON DELETE CASCADE"
            ") ENGINE=InnoDB")

        # friends 테이블
        TABLES['friends'] = (
            "CREATE TABLE IF NOT EXISTS `friends` ("
            "  `id` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `user_id` INT NOT NULL,"
            "  `friend_id` INT NOT NULL,"
            "  `status` ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',"
            "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,"
            "  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_num`) ON DELETE CASCADE,"
            "  FOREIGN KEY (`friend_id`) REFERENCES `users`(`user_num`) ON DELETE CASCADE"
            ") ENGINE=InnoDB")

        # calendar_share 테이블
        TABLES['calendar_share'] = (
            "CREATE TABLE IF NOT EXISTS `calendar_share` ("
            "  `share_id` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `calendar_id` INT NOT NULL,"
            "  `inviter_id` INT NOT NULL,"
            "  `invitee_id` INT NOT NULL,"
            "  `role` VARCHAR(50) NOT NULL DEFAULT 'viewer',"
            "  `status` ENUM('pending', 'accepted', 'declined') NOT NULL DEFAULT 'pending',"
            "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  FOREIGN KEY (`calendar_id`) REFERENCES `calendars`(`calendar_id`) ON DELETE CASCADE,"
            "  FOREIGN KEY (`inviter_id`) REFERENCES `users`(`user_num`) ON DELETE CASCADE,"
            "  FOREIGN KEY (`invitee_id`) REFERENCES `users`(`user_num`) ON DELETE CASCADE"
            ") ENGINE=InnoDB")

        # posts 테이블
        TABLES['posts'] = (
            "CREATE TABLE IF NOT EXISTS `posts` ("
            "  `post_num` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `user_id` INT NOT NULL,"
            "  `calendar_num` INT NOT NULL,"
            "  `post_title` VARCHAR(255) NOT NULL,"
            "  `post_content` TEXT,"
            "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_num`) ON DELETE CASCADE,"
            "  FOREIGN KEY (`calendar_num`) REFERENCES `calendars`(`calendar_id`) ON DELETE CASCADE"
            ") ENGINE=InnoDB")

        # comments 테이블
        TABLES['comments'] = (
            "CREATE TABLE IF NOT EXISTS `comments` ("
            "  `comment_num` INT AUTO_INCREMENT PRIMARY KEY,"
            "  `user_id` INT NOT NULL,"
            "  `post_num` INT NOT NULL,"
            "  `comment_content` TEXT,"
            "  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,"
            "  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_num`) ON DELETE CASCADE,"
            "  FOREIGN KEY (`post_num`) REFERENCES `posts`(`post_num`) ON DELETE CASCADE"
            ") ENGINE=InnoDB")

        for table_name in TABLES:
            table_description = TABLES[table_name]
            try:
                print(f"Creating table {table_name}: ", end='')
                cursor.execute(table_description)
                print("OK")
            except mysql.connector.Error as err:
                if err.errno == errorcode.ER_TABLE_EXISTS_ERROR:
                    print("already exists.")
                else:
                    print(err.msg)
        
        cursor.close()
        print("MySQL tables created/verified.")
        
    except Exception as e:
        print(f"Table creation error: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Server is running'})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    required_fields = ['email', 'password', 'username', 'phone']
    if not all(data.get(field) for field in required_fields):
        missing = [f for f in required_fields if not data.get(f)]
        return jsonify({'message': f'Missing fields: {", ".join(missing)}'}), 400
    
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        sql = "SELECT * FROM users WHERE user_id = %s OR user_mail = %s"
        cursor.execute(sql, (data['email'], data['email']))
        if cursor.fetchone():
            return jsonify({'message': 'User already exists'}), 409

        print(f"Registering user: {data['email']}, Username: {data['username']}, Phone: {data['phone']}") # Debugging
        print(f"Plain password (before hashing): {data['password']}") # Debugging
        hashed_password = generate_password_hash(data['password'])
        print(f"Hashed password (to be saved): {hashed_password}") # Debugging

        sql = "INSERT INTO users (user_id, user_mail, user_name, user_pass, user_phone) VALUES (%s, %s, %s, %s, %s)"
        cursor.execute(sql, (data['email'], data['email'], data['username'], hashed_password, data['phone']))
        conn.commit()
        user_num = cursor.lastrowid
        
        return jsonify({'message': '가입 성공', 'user_num': user_num}), 201
            
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password are required'}), 400
    
    print(f"Login attempt for email: {data['email']}") # Debugging
    print(f"Password provided: {data['password']}") # Debugging
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Retrieve user by email/user_id
        sql = "SELECT * FROM users WHERE user_id = %s OR user_mail = %s"
        cursor.execute(sql, (data['email'], data['email']))
        user = cursor.fetchone()
        
        if user:
            print(f"User found: {user['user_mail']}") # Debugging
            print(f"Stored hashed password: {user['user_pass']}") # Debugging
            # Verify the password
            if check_password_hash(user['user_pass'], data['password']):
                print(f"check_password_hash result: True") # Debugging
                print(f"Login successful for user: {user['user_mail']}") # Debugging
                
                # Frontend-compatible user object
                user_data = {
                    'user_num': user['user_num'],
                    'id': user['user_num'],
                    'username': user['user_name'],
                    'email': user['user_mail'],
                    'phone': user['user_phone']
                }
                return jsonify({'message': '로그인 성공', 'user': user_data}), 200
            else:
                print(f"check_password_hash result: False") # Debugging
                print(f"Password mismatch for user: {data['email']}") # Debugging
                return jsonify({'message': 'Invalid email or password'}), 401
        else:
            print(f"User not found: {data['email']}") # Debugging
            return jsonify({'message': 'Invalid email or password'}), 401
                
    except mysql.connector.Error as e:
        print(f"Database error during login: {e}") # Debugging
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# Calendar Routes
@app.route('/api/calendars', methods=['POST'])
def create_calendar():
    data = request.get_json()
    required = ['user_num', 'calendar_name']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'user_num and calendar_name are required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "INSERT INTO calendars (user_num, calendar_name, calendar_purpose, calendar_color) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (data['user_num'], data['calendar_name'], data.get('calendar_purpose'), data.get('calendar_color')))
        conn.commit()
        calendar_id = cursor.lastrowid
        return jsonify({'message': 'Calendar created successfully', 'calendar_id': calendar_id}), 201
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/calendars', methods=['GET'])
def get_calendars():
    user_num = request.args.get('user_num')
    if not user_num:
        return jsonify({'message': 'user_num query parameter is required'}), 400
    
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT * FROM calendars WHERE user_num = %s"
        cursor.execute(sql, (user_num,))
        calendars = cursor.fetchall()
        return jsonify(calendars), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/calendars/<int:calendar_id>', methods=['GET'])
def get_calendar(calendar_id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT * FROM calendars WHERE calendar_id = %s"
        cursor.execute(sql, (calendar_id,))
        calendar = cursor.fetchone()
        if calendar:
            return jsonify(calendar), 200
        else:
            return jsonify({'message': 'Calendar not found'}), 404
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# Event Routes
@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.get_json()
    required = ['title', 'start_date', 'end_date', 'start_time', 'end_time', 'calendar_id', 'user_num']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Missing required fields'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "INSERT INTO events (title, content, start_date, end_date, start_time, end_time, color, calendar_id, user_num) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(sql, (
            data['title'], data.get('content'), data['start_date'], data['end_date'],
            data['start_time'], data['end_time'], data.get('color'),
            data['calendar_id'], data['user_num']
        ))
        conn.commit()
        event_id = cursor.lastrowid
        return jsonify({'message': '이벤트 생성 성공', 'event_id': event_id}), 201
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/calendars/<int:calendar_id>/events', methods=['GET'])
def get_events_for_calendar(calendar_id):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT * FROM events WHERE calendar_id = %s"
        cursor.execute(sql, (calendar_id,))
        events = cursor.fetchall()
        return jsonify(events), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/user/<int:user_num>/events', methods=['GET'])
def get_events_for_user(user_num):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT * FROM events WHERE user_num = %s"
        cursor.execute(sql, (user_num,))
        events = cursor.fetchall()
        return jsonify(events), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ==============================================================================
# Friends API Routes
# ==============================================================================
@app.route('/api/friends/request', methods=['POST'])
def send_friend_request():
    data = request.get_json()
    user_id = data.get('user_id')
    friend_id = data.get('friend_id')

    if not user_id or not friend_id:
        return jsonify({'message': 'user_id and friend_id are required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        # TODO: Check for existing friendship/request
        sql = "INSERT INTO friends (user_id, friend_id, status) VALUES (%s, %s, 'pending')"
        cursor.execute(sql, (user_id, friend_id))
        conn.commit()
        return jsonify({'message': 'Friend request sent'}), 201
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/friends/request/<int:request_id>', methods=['PUT'])
def respond_to_friend_request(request_id):
    data = request.get_json()
    status = data.get('status') # 'accepted' or 'declined'

    if not status or status not in ['accepted', 'declined']:
        return jsonify({'message': 'A valid status (accepted, declined) is required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "UPDATE friends SET status = %s WHERE id = %s"
        cursor.execute(sql, (status, request_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'message': 'Request not found'}), 404
        return jsonify({'message': f'Friend request {status}'}), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/users/<int:user_num>/friends', methods=['GET'])
def get_user_friends(user_num):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        # Get friends where the friendship is accepted
        sql = """ 
            SELECT u.* FROM users u JOIN friends f ON u.user_num = f.friend_id WHERE f.user_id = %s AND f.status = 'accepted'
            UNION
            SELECT u.* FROM users u JOIN friends f ON u.user_num = f.user_id WHERE f.friend_id = %s AND f.status = 'accepted'
        """
        cursor.execute(sql, (user_num, user_num))
        friends = cursor.fetchall()
        return jsonify(friends), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ==============================================================================
# Calendar Invitation API Routes
# ==============================================================================
@app.route('/api/calendars/invite', methods=['POST'])
def invite_user_to_calendar():
    data = request.get_json()
    required = ['calendar_id', 'inviter_id', 'invitee_email', 'role']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Missing required fields'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Find invitee by email
        cursor.execute("SELECT user_num FROM users WHERE user_mail = %s", (data['invitee_email'],))
        invitee = cursor.fetchone()
        if not invitee:
            return jsonify({'message': 'User with that email not found'}), 404
        invitee_id = invitee['user_num']

        # Check if already invited
        sql = "SELECT * FROM calendar_share WHERE calendar_id = %s AND invitee_id = %s"
        cursor.execute(sql, (data['calendar_id'], invitee_id))
        if cursor.fetchone():
            return jsonify({'message': 'User already invited to this calendar'}), 409

        # Create invitation
        sql = "INSERT INTO calendar_share (calendar_id, inviter_id, invitee_id, role) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (data['calendar_id'], data['inviter_id'], invitee_id, data['role']))
        conn.commit()
        
        return jsonify({'message': 'Invitation sent successfully'}), 201
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/users/<int:user_num>/invitations', methods=['GET'])
def get_user_invitations(user_num):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT cs.share_id, cs.calendar_id, c.calendar_name, u.user_name as inviter_name, cs.role
            FROM calendar_share cs
            JOIN calendars c ON cs.calendar_id = c.calendar_id
            JOIN users u ON cs.inviter_id = u.user_num
            WHERE cs.invitee_id = %s AND cs.status = 'pending'
        """
        cursor.execute(sql, (user_num,))
        invitations = cursor.fetchall()
        return jsonify(invitations), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/invitations/<int:share_id>', methods=['PUT'])
def respond_to_invitation(share_id):
    data = request.get_json()
    status = data.get('status') # 'accepted' or 'declined'

    if not status or status not in ['accepted', 'declined']:
        return jsonify({'message': 'A valid status (accepted, declined) is required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "UPDATE calendar_share SET status = %s WHERE share_id = %s"
        cursor.execute(sql, (status, share_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'message': 'Invitation not found'}), 404
        return jsonify({'message': f'Invitation {status}'}), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ==============================================================================
# Notification API Routes
# ==============================================================================
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_num = request.args.get('user_num')
    if not user_num:
        return jsonify({'message': 'user_num query parameter is required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT cs.share_id, cs.calendar_id, c.calendar_name, u.user_name as inviter_name, cs.role, cs.created_at
            FROM calendar_share cs
            JOIN calendars c ON cs.calendar_id = c.calendar_id
            JOIN users u ON cs.inviter_id = u.user_num
            WHERE cs.invitee_id = %s AND cs.status = 'pending'
            ORDER BY cs.created_at DESC
        """
        cursor.execute(sql, (user_num,))
        notifications = cursor.fetchall()
        return jsonify(notifications), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/notifications/respond', methods=['POST'])
def respond_to_notification():
    data = request.get_json()
    share_id = data.get('share_id')
    status = data.get('status') # 'accepted' or 'declined'

    if not share_id or not status or status not in ['accepted', 'declined']:
        return jsonify({'message': 'share_id and a valid status (accepted, declined) are required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        # Update the status in calendar_share table
        sql = "UPDATE calendar_share SET status = %s WHERE share_id = %s"
        cursor.execute(sql, (status, share_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({'message': 'Notification not found or already responded'}), 404
        
        # If accepted, add the invitee to the calendar's member count (optional, based on your schema)
        if status == 'accepted':
            # You might want to add the user to a calendar_members table if you have one
            # For now, let's assume the calendar_share entry itself signifies membership
            # Or, if you have a member_count in calendars table, you might increment it here
            # For simplicity, I'm not adding member count logic here, as it's not explicitly in your schema for this flow.
            pass

        return jsonify({'message': f'Notification {status} successfully'}), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ==============================================================================
# Posts API Routes
# ==============================================================================
@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    required = ['user_id', 'calendar_num', 'post_title', 'post_content']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Missing required fields'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "INSERT INTO posts (user_id, calendar_num, post_title, post_content) VALUES (%s, %s, %s, %s)"
        cursor.execute(sql, (data['user_id'], data['calendar_num'], data['post_title'], data['post_content']))
        conn.commit()
        post_id = cursor.lastrowid
        return jsonify({'message': 'Post created successfully', 'post_num': post_id}), 201
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/calendars/<int:calendar_num>/posts', methods=['GET'])
def get_posts_for_calendar(calendar_num):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT p.*, u.user_name FROM posts p JOIN users u ON p.user_id = u.user_num WHERE p.calendar_num = %s ORDER BY p.created_at DESC"
        cursor.execute(sql, (calendar_num,))
        posts = cursor.fetchall()
        return jsonify(posts), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# ==============================================================================
# Comments API Routes
# ==============================================================================
@app.route('/api/comments', methods=['POST'])
def create_comment():
    data = request.get_json()
    required = ['user_id', 'post_num', 'comment_content']
    if not all(data.get(f) for f in required):
        return jsonify({'message': 'Missing required fields'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        sql = "INSERT INTO comments (user_id, post_num, comment_content) VALUES (%s, %s, %s)"
        cursor.execute(sql, (data['user_id'], data['post_num'], data['comment_content']))
        conn.commit()
        comment_id = cursor.lastrowid
        return jsonify({'message': 'Comment created successfully', 'comment_num': comment_id}), 201
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/posts/<int:post_num>/comments', methods=['GET'])
def get_comments_for_post(post_num):
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        sql = "SELECT c.*, u.user_name FROM comments c JOIN users u ON c.user_id = u.user_num WHERE c.post_num = %s ORDER BY c.created_at ASC"
        cursor.execute(sql, (post_num,))
        comments = cursor.fetchall()
        return jsonify(comments), 200
    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/ai-assistant/preview-event', methods=['POST'])
def preview_ai_event():
    data = request.get_json()
    user_num = data.get('user_num')
    calendar_id = data.get('calendar_id')

    if not user_num or not calendar_id:
        return jsonify({'message': 'user_num and calendar_id are required'}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # 향후 3일간의 일정 확인
        sql = """
            SELECT * FROM events 
            WHERE user_num = %s AND start_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            ORDER BY start_date, start_time
        """
        cursor.execute(sql, (user_num,))
        schedules = cursor.fetchall()

        # Generate a random date within the next 7 days (including today)
        random_days = random.randint(0, 6)
        event_date = date.today() + timedelta(days=random_days)

        title = ""
        comment = ""
        color = ""

        if schedules:
            # 일정이 있을 경우 (분류된 제목과 색상 사용)
            try:
                comment, _ = calendar_commentator.generate_comment(schedules)
                title = random.choice(["급한 일정", "중요한 일정", "루틴 일정"])
                
                if title == "루틴 일정":
                    color = "#28a745"  # Green
                elif title == "중요한 일정":
                    color = "#ffc0cb"  # Pink
                else: # 급한 일정
                    color = "#ADD8E6"  # Light Blue
            except Exception as e:
                return jsonify({"message": f"Calendar commentator error: {str(e)}"}), 500
        else:
            # 일정이 없을 경우 (고정된 제목과 색상 사용)
            try:
                comment = weather_commentator.generate_comment()
                title = "오늘의 날씨 정보"
                color = "#87CEFA"  # LightSkyBlue
            except Exception as e:
                return jsonify({"message": f"Weather commentator error: {str(e)}"}), 500

        event_data = {
            "calendar_id": calendar_id,
            "user_num": user_num,
            "start_date": event_date.isoformat(),
            "end_date": event_date.isoformat(),
            "start_time": "09:00:00",
            "end_time": "09:30:00",
            "color": color,
            "title": title,
            "content": comment
        }
        
        return jsonify(event_data), 200

    except mysql.connector.Error as e:
        return jsonify({'message': f'Database error: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    print("Starting Flask server with MySQL connection...")
    create_tables()
    app.run(debug=True, host='127.0.0.1', port=5000)



@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/smart-comment', methods=['POST'])
def get_smart_comment():
    data = request.get_json()
    schedules = data.get('schedules')
    if not schedules:
        return jsonify({'success': False, 'error': 'Schedules are required'}), 400

    try:
        comment = schedule_mediator.run(schedules)
        # Assuming schedule_mediator.run returns a simple string for now
        # You might need to adjust this based on the actual return type of run()
        return jsonify({'success': True, 'comment': comment}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/weather-comment', methods=['GET'])
def get_weather_comment_route():
    try:
        comment = weather_commentator.generate_comment()
        return jsonify({'success': True, 'weather_comment': comment}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/calendar-comment', methods=['POST'])
def get_calendar_comment_route():
    data = request.get_json()
    schedules = data.get('schedules')
    if not schedules:
        return jsonify({'success': False, 'error': 'Schedules are required'}), 400

    try:
        comment, usage = calendar_commentator.generate_comment(schedules)
        return jsonify({'success': True, 'calendar_comment': comment, 'token_usage': usage}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==============================================================================
# AI Chatbot API Routes
# ==============================================================================
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    try:
        response = ant_chat.process_message(message)
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat/upload', methods=['POST'])
def chat_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file:
        # Save the uploaded file temporarily
        _, temp_path = tempfile.mkstemp(suffix=os.path.splitext(file.filename)[1])
        file.save(temp_path)
        
        try:
            # Process the file
            response = ant_chat.process_file(temp_path)
            return jsonify(response), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    return jsonify({'error': 'File processing failed'}), 500
