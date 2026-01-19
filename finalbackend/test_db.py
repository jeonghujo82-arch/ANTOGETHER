import mysql.connector
cfg = {
    'host':'127.0.0.1','port':3306,
    'user':'checkmate','password':'YourStrong!Pass1',
    'database':'checkmate_db'
}
try:
    cn = mysql.connector.connect(**cfg)
    print("OK:", cn.is_connected())
    cn.close()
except Exception as e:
    print("ERR:", e)