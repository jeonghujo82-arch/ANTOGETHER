import os
import re
import json
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

# .env 경로 로드
# Environment variables are now loaded globally in backend_new.py

# ✅ 실제 구현된 NewsScheduleExtractor 사용
from .gpt_search.naver_text_extract import NewsScheduleExtractor


class GPTDateDetector:
    """
    GPT를 사용해 메시지에 날짜 관련 정보가 포함되어 있는지 판단하는 클래스.
    일정 포함 여부 (True/False)와 토큰 사용량을 반환하며,
    일정이 없을 경우 일반 대화 답변도 생성할 수 있음.
    """
    def __init__(self, model="gpt-4o-mini"):
        self.model = model
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.conversation_history = []
        self.crawlr = NewsScheduleExtractor(model=model)

    def has_date(self, message: str) -> tuple[bool, dict]:
        today = datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
아래 문장에 '일정을 생성하려는 의도'가 포함되어 있는지만 판단해주세요.
'콘서트 일정 알려줘'처럼 무언가를 하려는 계획, 요청, 의지가 있다면 'true'를,
단순한 인사나 과거 회상, 정보 요청이 아니라면 'false'를 출력하세요.

예를 들어 다음 문장들은 모두 'true'로 판단해야 합니다:
- 플레이브 콘서트 언제 해?
- BTS 콘서트 일정 알려줘
- 오아시스 내한 일정 알려줘
- 내일 회의 있어
- 3월 2일에 미팅 잡혔어
- 다음주 금요일에 약속 있음

단순한 인사말이나, 일정과 무관한 문장은 'false'로 판단해야 합니다:
- 안녕, 잘 지내?
- 나는 오늘 피곤해

날짜 정보(예: 오늘, 내일)가 없어도 일정 생성 의도가 있으면 'true'로 판단하세요.
정확히 'true' 또는 'false'만 출력하세요.

문장: "{message}"
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "당신은 사용자의 일정 생성 의도를 판별하는 도우미입니다. 오직 true 또는 false만 반환하세요."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
        )

        answer = response.choices[0].message.content.strip().lower()
        usage = response.usage.model_dump()

        if "true" in answer:
            return True, usage
        else:
            print(f"[GPT 응답] {message} → 일정 정보 없음 👋n⚠️ GPT 판단 결과: {answer}")
            return False, usage

    def has_date_info(self, message: str) -> tuple[bool, dict]:
        today = datetime.now().strftime("%Y-%m-%d")

        prompt = f"""
다음 문장에 실제로 '일정으로 등록 가능한 정보'가 담겨 있는지 판단해주세요.

일정으로 등록 가능한 정보란 다음 두 조건을 모두 만족해야 합니다:
1. 사용자가 어떤 활동을 하겠다는 의도 또는 계획이 드러나 있어야 함
2. 날짜 또는 시간 정보가 구체적으로 표현되어 있어야 함 (예: 내일, 3월 2일, 오후 5시 등)

예시 (true):
- 내일 회의 있어
- 3월 2일 저녁에 약속 있음
- 오늘 오후 2시에 전화하자
- 다음 주 금요일에 회식 있음

예시 (false):
- 다음주에 뭐 할까?
- 나중에 보자
- 이번 주는 바빠
- 시간 정해서 만나자

오늘 날짜는 {today}입니다.

출력은 정확히 소문자로 true 또는 false 중 하나만 작성하세요.  
추가 설명이나 마침표, 공백 없이 **오직 단어만 출력**해야 합니다.

문장: "{message}"
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        reply = response.choices[0].message.content.strip().lower()
        has_date = reply.startswith("true")
        usage = response.usage.to_dict() if hasattr(response, "usage") else {}

        return has_date, usage

    def _clean_json_output(self, text: str) -> str:
        text = text.strip()
        text = re.sub(r"^```json", "", text)
        text = re.sub(r"```$", "", text)
        return text.strip()

    def extract_schedule(self, message: str) -> tuple[dict, dict]:
        today = datetime.now().strftime("%Y-%m-%d")

        prompt = f"""
아래 문장에서 일정을 추출해서 다음 JSON 형식으로 반환하세요.

---
형식:
{{
  "events": [
    {{
      "start_date": "YYYY-MM-DD-HH:mm",
      "end_date": "YYYY-MM-DD-HH:mm",
      "title": "일정 내용"
    }}
  ]
}}
---

조건:
- "~부터", "~까지" 등의 표현은 start_date, end_date로 분리
- "~예정", "~하자", "~할 거야" 등의 문장은 event로 간주
- start_date와 end_date는 동일해도 허용
- "오늘", "내일", "모레", "다음 주" 등 상대 표현은 오늘 날짜({today})를 기준으로 해석해 YYYY-MM-DD로 변환

반드시 위 JSON 형식만 반환하고, 다른 설명은 포함하지 마세요.

문장: "{message}"
"""

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        raw_reply = response.choices[0].message.content
        cleaned = self._clean_json_output(raw_reply)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            parsed = {"events": []}

        usage = response.usage.to_dict() if hasattr(response, "usage") else {}

        return parsed, usage

    def generate_simple_reply(self, user_input: str) -> str:
        messages = self.conversation_history + [{"role": "user", "content": user_input}]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "너는 간단하고 따뜻하게 대답해주는 대화 파트너야."},
                *messages
            ],
            temperature=0.7,
        )

        reply = response.choices[0].message.content.strip()

        self.conversation_history.append({"role": "user", "content": user_input})
        self.conversation_history.append({"role": "assistant", "content": reply})

        return reply

    def run_pipeline(self, message: str) -> dict | str:
        print(f"n📥 입력 메시지: {message}")

        has_intent, _ = self.has_date(message)
        if not has_intent:
            return self.generate_simple_reply(message)

        has_info, _ = self.has_date_info(message)
        if has_info:
            schedule, _ = self.extract_schedule(message)
            return schedule
        else:
            try:
                raw_json = self.crawlr.extraction(message)

                # ✅ 크롤링 기반 추출 결과 출력
                print("n📡 크롤링 기반 일정 추출 결과:")
                print(json.dumps(raw_json, indent=2, ensure_ascii=False))

                if isinstance(raw_json, str):
                    parsed = json.loads(raw_json)
                elif isinstance(raw_json, dict):
                    parsed = raw_json
                else:
                    parsed = {"events": []}

                return parsed

            except Exception as e:
                print(f"❌ 크롤링 실패: {e}")
                return {"events": []}


if __name__ == "__main__":
    detector = GPTDateDetector()
    while True:
        msg = input("n[입력] ")
        if msg.lower() == "exit":
            break
        result = detector.run_pipeline(msg)
        print(f"📤 결과: {result}")
