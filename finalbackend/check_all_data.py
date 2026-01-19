import mysql.connector

def check_all_data():
    """모든 테이블의 데이터를 확인"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='tiger123',
            database='my_database',
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        
        # Users 테이블 확인
        print("=== USERS 테이블 ===")
        cursor.execute("SELECT user_num, user_id, user_name FROM users ORDER BY user_num")
        users = cursor.fetchall()
        for user in users:
            print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]}")
        
        # Calendars 테이블 확인
        print("\n=== CALENDARS 테이블 ===")
        cursor.execute("SELECT calendar_id, calendar_name, calendar_purpose, user_num FROM calendars ORDER BY calendar_id")
        calendars = cursor.fetchall()
        for calendar in calendars:
            print(f"Calendar ID: {calendar[0]}, Name: {calendar[1]}, Purpose: {calendar[2]}, User: {calendar[3]}")
        
        # Events 테이블 확인
        print("\n=== EVENTS 테이블 ===")
        cursor.execute("SELECT event_id, title, start_date, calendar_id, user_num FROM events ORDER BY event_id")
        events = cursor.fetchall()
        for event in events:
            print(f"Event ID: {event[0]}, Title: {event[1]}, Date: {event[2]}, Calendar: {event[3]}, User: {event[4]}")
        
        if not users:
            print("등록된 사용자가 없습니다.")
        if not calendars:
            print("등록된 캘린더가 없습니다.")
        if not events:
            print("등록된 이벤트가 없습니다.")
            
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"데이터베이스 연결 오류: {e}")

if __name__ == "__main__":
    check_all_data()
