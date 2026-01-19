import pymysql

def check_user_events():
    # 데이터베이스 연결
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='root',
        database='my_database',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    
    try:
        with connection.cursor() as cursor:
            # 1. 먼저 사용자 정보 확인 (asdd@gmail.com)
            print("=== 사용자 정보 ===")
            cursor.execute("SELECT * FROM users WHERE user_id = %s", ("asdd@gmail.com",))
            user = cursor.fetchone()
            if user:
                print(f"사용자 발견: {user}")
                user_num = user['user_num']
                
                # 2. 해당 사용자의 캘린더 확인
                print(f"\n=== 사용자 {user_num}의 캘린더 ===")
                cursor.execute("SELECT * FROM calendars WHERE user_num = %s", (user_num,))
                calendars = cursor.fetchall()
                print(f"캘린더 개수: {len(calendars)}")
                for cal in calendars:
                    print(f"캘린더: {cal}")
                
                # 3. 해당 사용자의 이벤트 확인
                print(f"\n=== 사용자 {user_num}의 이벤트 ===")
                cursor.execute("SELECT * FROM events WHERE user_num = %s", (user_num,))
                events = cursor.fetchall()
                print(f"이벤트 개수: {len(events)}")
                for event in events:
                    print(f"이벤트: {event}")
                
                # 4. 모든 이벤트 테이블 확인
                print(f"\n=== 전체 이벤트 테이블 ===")
                cursor.execute("SELECT * FROM events")
                all_events = cursor.fetchall()
                print(f"전체 이벤트 개수: {len(all_events)}")
                for event in all_events:
                    print(f"이벤트: {event}")
                    
            else:
                print("사용자를 찾을 수 없습니다.")
                
                # 모든 사용자 확인
                print("\n=== 전체 사용자 목록 ===")
                cursor.execute("SELECT * FROM users")
                all_users = cursor.fetchall()
                for user in all_users:
                    print(f"사용자: {user}")
    
    except Exception as e:
        print(f"오류 발생: {e}")
    
    finally:
        connection.close()

if __name__ == "__main__":
    check_user_events()
