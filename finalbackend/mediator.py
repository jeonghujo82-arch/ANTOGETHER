import os
import json
from datetime import datetime, timedelta
import os
import json
from datetime import datetime, timedelta
# from dotenv import load_dotenv # Removed

# Removed load_dotenv()

# ✅ 외부 AI 모듈 임포트
from weather.weather_alarm import WeatherCommentator
from calendar_comment.calendar_commentor import CalendarCommentator

class ScheduleMediator:
    def __init__(self, days_threshold: int = 3):
        """
        days_threshold: '며칠 이내가 가까운 일정인지' 판단 기준 (기본값 3일)
        """
        self.days_threshold = days_threshold
        self.weather_commentator = WeatherCommentator()
        self.calendar_commentator = CalendarCommentator()

    def find_nearest_schedule(self, schedules: list[dict]) -> dict | None:
        today = datetime.today().date()
        for schedule in schedules:
            # ✅ start_date로부터 날짜 문자열만 자름
            start_date_str = schedule.get("start_date")
            if not start_date_str:
                continue  # 일정에 시작 날짜 없으면 건너뜀

            try:
                schedule_date = datetime.strptime(start_date_str[:10], "%Y-%m-%d").date()
            except ValueError:
                continue  # 날짜 파싱 실패 시 건너뜀

            if 0 <= (schedule_date - today).days <= self.days_threshold:
                return schedule  # 가까운 일정 발견

        return None

    def run(self, schedules: list[dict]) -> str:
        """
        전체 흐름 실행. 가까운 일정 있으면 날씨 코멘트, 없으면 한줄평 리턴.
        """
        nearest = self.find_nearest_schedule(schedules)

        if nearest:
            print(f"📅 가까운 일정 발견: {nearest['title']} ({nearest['start_date'][:10]})")
            return self.weather_commentator.generate_comment(nearest['start_date'][:10])
        else:
            print("❌ 가까운 일정 없음 → 한줄평으로 대체")
            result, _ = self.calendar_commentator.generate_comment(schedules)
            return result