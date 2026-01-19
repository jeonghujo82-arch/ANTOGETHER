# Ant Chat GPT - 백엔드 통합 가이드

## 개요
이 패키지는 GPT를 사용하여 사용자 메시지에서 일정 정보를 감지하고 처리하는 기능을 제공합니다.

## 설치 방법

### 1. 패키지 설치
```bash
# 현재 폴더에서 패키지 설치
pip install -e .

# 또는 requirements.txt 사용
pip install -r requirements.txt
```

### 2. 환경 변수 설정
`.env` 파일에 OpenAI API 키를 설정하세요:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## 백엔드에서 사용하기

### 기본 사용법

```python
from ant_chat_gpt import AntChatGPT

# 초기화
ant_chat = AntChatGPT()

# 메시지 처리
result = ant_chat.process_message("내일 오후 3시에 회의가 있어요")
print(result)
```

### 응답 형식

#### 일정이 포함된 메시지의 경우:
```python
{
    "has_schedule": True,
    "tokens_used": {
        "prompt_tokens": 150,
        "completion_tokens": 20,
        "total_tokens": 170
    },
    "type": "schedule",
    "schedule_data": {
        # 일정 처리 결과 데이터
    },
    "reply": None
}
```

#### 일반 대화 메시지의 경우:
```python
{
    "has_schedule": False,
    "tokens_used": {
        "prompt_tokens": 120,
        "completion_tokens": 30,
        "total_tokens": 150
    },
    "type": "conversation",
    "schedule_data": None,
    "reply": "안녕하세요! 오늘도 좋은 하루 되세요."
}
```

### 고급 사용법

```python
from ant_chat_gpt import AntChatGPT

# 다른 모델 사용
ant_chat = AntChatGPT(model="gpt-4")

# 파일 처리
file_result = ant_chat.process_file("path/to/schedule_file.txt")

# 대화 기록 관리
ant_chat.reset_conversation()  # 대화 기록 초기화
history = ant_chat.get_conversation_history()  # 대화 기록 가져오기

# 여러 메시지 연속 처리
messages = ["안녕하세요", "내일 회의 있어요", "감사합니다"]
for msg in messages:
    result = ant_chat.process_message(msg)
    print(f"입력: {msg}")
    print(f"결과: {result}")
```

## Django/Flask 예시

### Django View 예시
```python
from django.http import JsonResponse
from ant_chat_gpt import AntChatGPT

ant_chat = AntChatGPT()

def process_message(request):
    if request.method == 'POST':
        message = request.POST.get('message', '')
        result = ant_chat.process_message(message)
        return JsonResponse(result)
    
    return JsonResponse({'error': 'POST 요청만 허용됩니다.'})
```

### Flask Route 예시
```python
from flask import Flask, request, jsonify
from ant_chat_gpt import AntChatGPT

app = Flask(__name__)
ant_chat = AntChatGPT()

 @app.route('/process_message', methods=['POST'])
def process_message():
    data = request.get_json()
    message = data.get('message', '')
    result = ant_chat.process_message(message)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
```

## 주의사항

1. **API 키 보안**: OpenAI API 키는 환경 변수로 관리하세요.
2. **토큰 사용량**: GPT API 호출 시 토큰 사용량을 모니터링하세요.
3. **에러 처리**: 네트워크 오류나 API 제한에 대한 예외 처리를 구현하세요.
4. **대화 기록**: 사용자별로 대화 기록을 관리하려면 별도 저장소를 사용하세요.

## 문제 해결

### 일반적인 오류
- `ModuleNotFoundError`: 패키지가 제대로 설치되지 않았습니다. `pip install -e .`를 실행하세요.
- `OpenAI API key not found`: `.env` 파일에 API 키를 설정하세요.
- `Rate limit exceeded`: API 호출 빈도를 줄이거나 대기 시간을 추가하세요.

### 지원
문제가 발생하면 다음을 확인하세요:
1. Python 버전 (3.8 이상 필요)
2. 필요한 패키지 설치 여부
3. 환경 변수 설정
4. 네트워크 연결 상태
