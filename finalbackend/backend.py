from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)

# CORS 헤더 수동 추가
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def get_db():
    """데이터베이스 연결 함수"""
    try:
        # tiger123 비밀번호로 MySQL 연결
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='tiger123',
            charset='utf8mb4'
        )
        print("MySQL 데이터베이스 연결 성공 (tiger123 비밀번호)")
        
        # 데이터베이스 생성 (없으면)
        cursor = connection.cursor()
        cursor.execute("CREATE DATABASE IF NOT EXISTS my_database")
        connection.commit()
        cursor.close()
        
        # my_database로 다시 연결
        connection.close()
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='tiger123',
            database='my_database',
            charset='utf8mb4'
        )
        return connection
    except Exception as e:
        print(f"데이터베이스 연결 실패: {e}")
        raise

def create_tables():
    """필요한 테이블들을 생성"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # users 테이블 생성
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_num INT PRIMARY KEY AUTO_INCREMENT,
                user_id VARCHAR(50) NOT NULL UNIQUE,
                user_mail VARCHAR(100) NOT NULL,
                user_name VARCHAR(50) NOT NULL,
                user_phone VARCHAR(20),
                user_pass VARCHAR(128) NOT NULL
            )
        """)
        
        # calendars 테이블 생성
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS calendars (
                calendar_id INT PRIMARY KEY AUTO_INCREMENT,
                calendar_name VARCHAR(100) NOT NULL,
                calendar_purpose VARCHAR(50),
                calendar_color VARCHAR(50),
                user_num INT NOT NULL,
                member_count INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_num) REFERENCES users(user_num) ON DELETE CASCADE
            )
        """)
        
        # events 테이블 생성
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
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
            )
        """)
        
        conn.commit()
        cursor.close()
        print("MySQL 테이블 생성 완료")
        
    except Exception as e:
        print(f"테이블 생성 오류: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': '서버가 정상 작동 중입니다'})

@app.route('/register', methods=['POST'])
def register():
    print("회원가입 엔드포인트 호출됨")
    data = request.get_json()
    print(f"회원가입 요청 데이터: {data}")
    
    # 프론트엔드에서 보내는 필드명으로 변경
    required_fields = ['email', 'password', 'username', 'phone']
    if not all(data.get(field) for field in required_fields):
        missing_fields = [field for field in required_fields if not data.get(field)]
        print(f"누락된 필드: {missing_fields}")
        return jsonify({'message': f'필수 필드가 누락되었습니다: {missing_fields}'}), 400
    
    try:
        conn = get_db()
        print("데이터베이스 연결 성공")
        
        cursor = conn.cursor()
        # 이미 존재하는 사용자인지 확인 (데이터베이스 스키마에 맞춤)
        sql = "SELECT * FROM users WHERE user_id=%s OR user_mail=%s"
        cursor.execute(sql, (data['email'], data['email']))
        existing_user = cursor.fetchone()
        print(f"기존 사용자 조회 결과: {existing_user}")
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({'message': '이미 존재하는 사용자입니다'}), 400
        
        # 새 사용자 등록 (데이터베이스 스키마에 맞춤)
        sql = """
            INSERT INTO users (user_id, user_mail, user_name, user_pass, user_phone) 
            VALUES (%s, %s, %s, %s, %s)
        """
        print(f"실행할 SQL: {sql}")
        print(f"삽입할 데이터: {(data['email'], data['email'], data['username'], data['password'], data['phone'])}")
        
        cursor.execute(sql, (data['email'], data['email'], data['username'], data['password'], data['phone']))
        conn.commit()
        user_num = cursor.lastrowid  # 생성된 사용자 번호 가져오기
        cursor.close()
        print(f"사용자 등록 완료 - user_num: {user_num}")
        
        return jsonify({
            'message': '가입 성공',
            'user_num': user_num
        }), 201
            
    except mysql.connector.Error as e:
        print(f"데이터베이스 오류: {e}")
        return jsonify({'message': f'데이터베이스 오류: {str(e)}'}), 500
    except Exception as e:
        print(f"서버 오류: {e}")
        return jsonify({'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/login', methods=['POST'])
def login():
    print("로그인 엔드포인트 호출됨")
    data = request.get_json()
    print(f"로그인 요청 데이터: {data}")
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'message': '이메일과 비밀번호를 입력해주세요'}), 400
    
    try:
        conn = get_db()
        
        cursor = conn.cursor()
        # 데이터베이스 스키마에 맞춤
        sql = "SELECT user_num, user_id, user_mail, user_name FROM users WHERE (user_id=%s OR user_mail=%s) AND user_pass=%s"
        cursor.execute(sql, (data['email'], data['email'], data['password']))
        user_row = cursor.fetchone()
        print(f"로그인 사용자 조회 결과: {user_row}")
        
        if user_row:
            # mysql.connector는 튜플을 반환하므로 딕셔너리 형태로 변환
            user_dict = {
                'user_num': user_row[0], # 프론트엔드에서 기대하는 필드명
                'id': user_row[0],       # user_num (호환성을 위해 추가)
                'email': user_row[2],    # user_mail
                'username': user_row[3]  # user_name
            }
            cursor.close()
            conn.close()
            return jsonify({
                'message': '로그인 성공',
                'user': user_dict
            }), 200
        else:
            cursor.close()
            conn.close()
            return jsonify({'message': '이메일 또는 비밀번호가 잘못되었습니다'}), 401
                
    except mysql.connector.Error as e:
        print(f"데이터베이스 오류: {e}")
        return jsonify({'message': f'데이터베이스 오류: {str(e)}'}), 500
    except Exception as e:
        print(f"서버 오류: {e}")
        return jsonify({'message': f'서버 오류: {str(e)}'}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/logout', methods=['POST'])
def logout():
    return jsonify({"message": "로그아웃 성공"}), 200

@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.get_json()
    print(f"이벤트 생성 요청 데이터: {data}")
    
    # 필수 필드 (content는 빈 문자열 허용)
    required_fields = ['title', 'start_date', 'end_date', 'start_time', 'end_time', 'color', 'calendar_id', 'user_num']
    missing_fields = [field for field in required_fields if data.get(field) is None or data.get(field) == '']
    
    # content는 존재하지만 빈 문자열일 수 있음
    if data.get('content') is None:
        missing_fields.append('content')
    
    if missing_fields:
        print(f"누락된 필드: {missing_fields}")
        return jsonify({'message': f'필수 필드가 누락되었습니다: {missing_fields}'}), 400
    
    # calendar_id를 정수로 변환 시도
    try:
        calendar_id = int(data['calendar_id'])
        user_num = int(data['user_num'])
    except (ValueError, TypeError) as e:
        print(f"ID 변환 에러: {e}")
        return jsonify({'message': 'calendar_id와 user_num은 숫자여야 합니다'}), 400
    
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # content가 빈 문자열이면 기본 메시지로 설정
            content = data.get('content', '') if data.get('content') else ''
            
            sql = """
                INSERT INTO events (title, content, start_date, end_date, start_time, end_time, color, calendar_id, user_num, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """
            cursor.execute(sql, (
                data['title'],
                content,  # 처리된 content 값 사용
                data['start_date'],
                data['end_date'],
                data['start_time'],
                data['end_time'],
                data['color'],
                calendar_id,  # 변환된 정수 값 사용
                user_num      # 변환된 정수 값 사용
            ))
            conn.commit()
            event_id = cursor.lastrowid
            
        return jsonify({
            'message': '이벤트 생성 성공',
            'event_id': event_id
        }), 201
    except Exception as e:
        print(f"이벤트 생성 에러: {e}")
        return jsonify({'message': '서버 오류'}), 500
    finally:
        conn.close()

@app.route('/api/user/<user_num>/events', methods=['GET'])
def get_user_all_events(user_num):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT e.event_id, e.title, e.content, e.start_date, e.end_date, 
                       e.start_time, e.end_time, e.color, e.calendar_id, e.user_num, 
                       e.created_at, c.calendar_name, c.calendar_color
                FROM events e 
                JOIN calendars c ON e.calendar_id = c.calendar_id 
                WHERE e.user_num = %s 
                ORDER BY e.created_at DESC
            """
            cursor.execute(sql, (user_num,))
            events_data = cursor.fetchall()
            print(f"사용자 {user_num}의 이벤트 조회 결과: {events_data}")
            
            # 이벤트 데이터를 딕셔너리 형태로 변환
            events = []
            for event in events_data:
                events.append({
                    'event_id': event[0],
                    'title': event[1],
                    'content': event[2],
                    'start_date': event[3].isoformat() if event[3] else None,
                    'end_date': event[4].isoformat() if event[4] else None,
                    'start_time': str(event[5]) if event[5] else None,
                    'end_time': str(event[6]) if event[6] else None,
                    'color': event[7],
                    'calendar_id': event[8],
                    'user_num': event[9],
                    'created_at': event[10].isoformat() if event[10] else None,
                    'calendar_name': event[11],
                    'calendar_color': event[12]
                })
            
        return jsonify({
            'message': '사용자 전체 이벤트 조회 성공',
            'events': events
        }), 200
    except Exception as e:
        print(f"사용자 전체 이벤트 조회 에러: {e}")
        return jsonify({'message': '서버 오류'}), 500
    finally:
        conn.close()

@app.route('/api/calendars', methods=['POST'])
def create_calendar():
    data = request.get_json()
    print(f"캘린더 생성 요청 데이터: {data}")
    
    required_fields = ['calendar_name', 'calendar_purpose', 'calendar_color', 'user_num']
    missing_fields = [field for field in required_fields if not data.get(field)]
    
    if missing_fields:
        print(f"누락된 필드: {missing_fields}")
        return jsonify({'message': f'필수 필드가 누락되었습니다: {missing_fields}'}), 400
    
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO calendars (calendar_name, calendar_purpose, calendar_color, user_num, created_at) 
                VALUES (%s, %s, %s, %s, NOW())
            """
            cursor.execute(sql, (
                data['calendar_name'],
                data['calendar_purpose'],
                data['calendar_color'],
                data['user_num']
            ))
            conn.commit()
            calendar_id = cursor.lastrowid
            
        return jsonify({
            'message': '캘린더 생성 성공',
            'calendar_id': calendar_id
        }), 201
    except Exception as e:
        print(f"캘린더 생성 에러: {e}")
        return jsonify({'message': '서버 오류'}), 500
    finally:
        conn.close()

@app.route('/api/calendars/<user_num>', methods=['GET'])
def get_user_calendars(user_num):
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT calendar_id, calendar_name, calendar_purpose, calendar_color, created_at FROM calendars WHERE user_num = %s ORDER BY created_at DESC"
            cursor.execute(sql, (user_num,))
            calendars_data = cursor.fetchall()
            print(f"사용자 {user_num}의 캘린더 조회 결과: {calendars_data}")
            
            # 캘린더 데이터를 딕셔너리 형태로 변환
            calendars = []
            for calendar in calendars_data:
                calendars.append({
                    'calendar_id': calendar[0],
                    'calendar_name': calendar[1],
                    'calendar_purpose': calendar[2],
                    'calendar_color': calendar[3],
                    'created_at': calendar[4].isoformat() if calendar[4] else None
                })
            
        return jsonify({
            'message': '캘린더 조회 성공',
            'calendars': calendars
        }), 200
    except Exception as e:
        print(f"캘린더 조회 에러: {e}")
        return jsonify({'message': '서버 오류'}), 500
    finally:
        conn.close()

@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    print(f"이벤트 삭제 요청: event_id={event_id}")
    
    try:
        event_id = int(event_id)
    except (ValueError, TypeError) as e:
        print(f"event_id 변환 에러: {e}")
        return jsonify({'message': 'event_id는 숫자여야 합니다'}), 400
    
    conn = get_db()
    try:
        with conn.cursor() as cursor:
            # 먼저 이벤트가 존재하는지 확인
            sql = "SELECT * FROM events WHERE event_id = %s"
            cursor.execute(sql, (event_id,))
            event = cursor.fetchone()
            
            if not event:
                return jsonify({'message': '존재하지 않는 이벤트입니다'}), 404
            
            # 이벤트 삭제
            sql = "DELETE FROM events WHERE event_id = %s"
            cursor.execute(sql, (event_id,))
            conn.commit()
            
            print(f"이벤트 삭제 완료: event_id={event_id}")
            
        return jsonify({
            'message': '이벤트 삭제 성공',
            'event_id': event_id
        }), 200
    except Exception as e:
        print(f"이벤트 삭제 에러: {e}")
        return jsonify({'message': '서버 오류'}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    print("Flask 서버를 시작합니다...")
    print("데이터베이스 및 테이블을 확인 중...")
    create_tables()
    app.run(debug=True, host='127.0.0.1', port=5000)