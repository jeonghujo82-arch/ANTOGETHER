# Python 3.9을 기반으로 하는 공식 이미지를 사용합니다.
FROM python:3.9-slim

# 컨테이너 내의 작업 디렉토리를 /app으로 설정합니다.
WORKDIR /app

# requirements.txt를 먼저 복사하고 라이브러리를 설치합니다.
# (소스 코드가 변경되어도 라이브러리는 다시 설치하지 않도록 하여 빌드 속도를 높입니다.)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 현재 디렉토리의 모든 파일을 컨테이너의 /app 디렉토리로 복사합니다.
COPY . .

# 컨테이너가 5000번 포트에서 수신 대기하도록 설정합니다.
EXPOSE 5000

# 컨테이너가 시작될 때 backend_new.py를 실행하는 명령입니다.
CMD ["python", "backend_new.py"]
