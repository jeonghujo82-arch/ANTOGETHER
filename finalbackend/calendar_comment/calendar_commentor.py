import os
import json
from openai import OpenAI
from datetime import datetime

# Removed load_dotenv()

class CalendarCommentator:
    def __init__(self, api_key=None, model="gpt-4o-mini"):
        # Hardcoded key for debugging - NOT FOR PRODUCTION
        
        # Removed ValueError check
        self.client = OpenAI(api_key=self.api_key)
        self.model = model

    def generate_comment(self, schedule_list: list) -> tuple[str, dict]:
        """
        일정 리스트를 받아서 캘린더에 대한 한 줄 요약 코멘트를 생성하고,
        토큰 사용량도 함께 반환함.
        """
        if not schedule_list:
            return "이번 달은 등록된 일정이 없어요. 여유로운 한 달이 되겠네요!", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

        # 일정 요약 문자열 생성
        schedule_summary = "\n".join([
            f"- {item['title']} ({item['start_date']} ~ {item['end_date']})"
            for item in schedule_list
        ])
        today = datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
다음은 앞으로 3일간의 할 일 목록입니다. 이 일정들을 바탕으로, 사용자에게 일정을 상기시켜주는 친근한 코멘트를 작성해주세요. 미래 시제를 사용하고, 전체 내용을 자연스러운 한 문단으로 만들어주세요.

[일정 목록]
{schedule_summary}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            comment = response.choices[0].message.content.strip()
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
            return comment, usage

        except Exception as e:
            return f"⚠️ GPT 요청 실패: {str(e)}", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    def generate_title_from_content(self, content: str) -> str:
        if not content:
            return "새로운 일정"

        prompt = f'''
다음은 AI가 생성한 일정 요약 내용입니다. 이 내용의 성격을 분석하여, 아래 [분류 기준]과 [예시]를 참고하여 가장 적절한 분류 하나를 선택해주세요.

[분류 기준]
- "급한 일정": 마감일이 임박했거나, 오늘 또는 내일 해야 하는 일.
- "중요한 일정": 시험, 프로젝트, 기념일 등 개인적으로나 업무적으로 중요한 약속.
- "루틴 일정": 운동, 주간 회의, 취미 활동 등 정기적이거나 일상적인 약속.

[예시 1]
- 내용: "내일 중요한 프레젠테이션이 있으니, 오늘 최종 리허설을 꼭 마치셔야 해요! 저녁에는 팀 회의도 있으니 잊지 마세요."
- 분류: 급한 일정

[예시 2]
- 내용: "이번 주에는 주말에 있을 '서울주류박람회' 방문과 다음 주에 떠나는 '일본여행' 준비로 바쁘시겠네요! 여행 준비물 체크리스트를 미리 만들어보는 건 어떨까요?"
- 분류: 중요한 일정

[예시 3]
- 내용: "이번 주에도 꾸준히 운동 계획을 세우셨네요! 수요일 저녁의 '헬스장 PT'와 금요일 오전에 있는 '수영 레슨' 모두 화이팅입니다!"
- 분류: 루틴 일정

---
이제 아래 내용에 대해 분류해주세요.

[일정 요약 내용]
{content}

[분류]
(세 가지 분류 중 가장 적절한 명칭 하나만 여기에 적어주세요)
'''

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.2
            )
            title = response.choices[0].message.content.strip().replace('"', '')
            
            valid_titles = ["급한 일정", "중요한 일정", "루틴 일정"]
            if title in valid_titles:
                return title
            else:
                return "AI 추천 일정" # Fallback

        except Exception as e:
            print(f"⚠️ Title classification failed: {str(e)}")
            return "AI 추천 일정"

# ✅ 테스트 코드 (독립 실행용)
if __name__ == "__main__":
    sample_schedule = [
        {
            "title": "종강",
            "start_date": "2025-06-20T10:00:00",
            "end_date": "2025-06-20T11:00:00"
        },
        {
            "title": "서울주류박람회",
            "start_date": "2025-06-26T10:00:00",
            "end_date": "2025-06-26T11:00:00"
        },
        {
            "title": "일본여행",
            "start_date": "2025-06-27T10:00:00",
            "end_date": "2025-06-30T11:00:00"
        }
    ]

    commentator = CalendarCommentator()
    comment, usage = commentator.generate_comment(sample_schedule)
    print("🗨️ 캘린더 코멘트:", comment)
    print("📊 토큰 사용량:", usage)
