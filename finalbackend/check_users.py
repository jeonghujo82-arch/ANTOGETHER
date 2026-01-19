import mysql.connector

def check_users():
    """사용자 테이블의 데이터를 확인"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='tiger123',
            database='my_database',
            charset='utf8mb4'
        )
        
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM users ORDER BY user_num DESC LIMIT 10")
        users = cursor.fetchall()
        
        print("=== 최근 등록된 사용자 10명 ===")
        print("user_num | user_id | user_mail | user_name | user_phone")
        print("-" * 60)
        
        for user in users:
            print(f"{user[0]} | {user[1]} | {user[2]} | {user[3]} | {user[4]}")
        
        if not users:
            print("등록된 사용자가 없습니다.")
            
        cursor.close()
        connection.close()
        
    except Exception as e:
        print(f"데이터베이스 연결 오류: {e}")

if __name__ == "__main__":
    check_users()
