from .naver_crawler import NaverCrawler
from openai import OpenAI
from datetime import datetime
from dotenv import load_dotenv
import os
import json
import re

# ✅ 환경 변수 불러오기
# Environment variables are now loaded globally in backend_new.py
print(f"DEBUG: OPENAI_API_KEY from .env: {os.getenv('OPENAI_API_KEY')}")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class NewsScheduleExtractor:
    """
    기사 본문들로부터 일정 정보를 추출하는 클래스
    """
    def __init__(self, model="gpt-4o-mini"):
        self.model = model
        self.client = client

    def _clean_json_output(self, text):
        return re.sub(r"^```json|```$", "", text.strip()).strip()

    def extract_from_texts(self, page_texts):
        today = datetime.now().strftime("%Y-%m-%d")
        content = "nn".join(page_texts)
        prompt = f'''
다음 뉴스 기사 본문 내용에서 일정 정보를 추출해 아래 JSON 형식으로 반환하세요:

'~부터', '~까지' 등의 표현은 start, end로 분리하세요.
'~예정', '~하자' 포함 문장은 event로 간주하세요.
start와 end는 동일해도 허용됩니다.

{content}

예시 형식:
{{
  "events": [
    {{
      "start_date": "YYYY-MM-DD-HH:mm",
      "end_date": "YYYY-MM-DD-HH:mm",
      "title": "일정 내용"
    }}
  ]
}}
'''
        try:
            res = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": f"너는 뉴스 기사에서 일정 정보를 추출하는 AI야. 현재 날짜:{today}, 현재 날짜 기준으로 과거의 일정은 추출하지마."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            raw_output = res.choices[0].message.content
            cleaned = self._clean_json_output(raw_output)

            # ✅ 추출된 GPT 응답 확인용 출력
            print("n📋 GPT 응답 원본:n", raw_output[:300], "...")  # 일부만 출력
            print("📋 정제된 JSON 데이터:n", cleaned)

            return json.loads(cleaned)

        except json.JSONDecodeError:
            print("❌ GPT 응답 JSON 파싱 실패:n", cleaned)
            return {"events": []}
        except Exception as e:
            print("❌ 일정 추출 실패:", e)
            return {"events": []}

    def extract_search_query(self, user_input):
        """
        사용자의 문장에서 웹 검색용 핵심 키워드만 추출
        """
        prompt = f"""
다음 문장에서 웹 검색에 사용할 수 있는 핵심 키워드를 간결하게 뽑아줘.
날짜, '일정', '알려줘' 같은 일반적인 표현은 제외하고, 핵심 주제만 남겨줘.

예시:
입력: "플레이브 서울 콘서트 일정 알려줘"
출력: "플레이브 서울 콘서트"
입력: "뉴진스 컴백 날짜 알려줘"
출력: "뉴진스 컴백"

입력: "{user_input}"
출력:
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "너는 문장에서 핵심 검색어만 뽑아주는 AI야."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            keyword = response.choices[0].message.content.strip().strip('"')
            print(f"🔍 추출된 검색어: {keyword}")  # ✅ 키워드 출력
            return keyword
        except Exception as e:
            print(f"❌ OpenAI 호출 실패: {e}")
            return "검색어 추출 실패"
        
    def extraction(self, query: str = None):
        """
        뉴스 검색어를 기반으로 네이버에서 기사들을 검색하고,
        기사 본문을 GPT에게 넘겨서 일정 정보를 추출하는 클래스 메서드.

        :param query: 직접 전달할 검색어 (None이면 사용자 입력 받음)
        :return: 일정 dict (e.g. {"events": [...]})
        """
        if query is None:
            query = input("🔍 검색어를 입력하세요: ")

        print(f"n🟣 사용자 입력: {query}")
        extracted_query = self.extract_search_query(query)

        crawler = NaverCrawler()
        search_results = crawler.search(extracted_query, display=5)  # ✅ 뉴스 개수 5개로 증가

        if not search_results:
            print("❌ 뉴스 검색 결과 없음")
            return {"events": []}

        page_texts = []
        for item in search_results:
            print(f"n📰 기사 제목: {item['title']}")
            text = crawler.extract_text(item["link"])
            print(f"📄 본문 길이: {len(text)}, 앞부분: {text[:100]}...")  # ✅ 본문 미리보기
            page_texts.append(text)

        result = self.extract_from_texts(page_texts)

        print("n📅 추출된 일정 JSON:n", result)

        return result
