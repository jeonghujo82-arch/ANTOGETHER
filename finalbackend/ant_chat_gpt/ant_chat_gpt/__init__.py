"""
Ant Chat GPT - 백엔드 연동용 메인 인터페이스
백엔드에서 이 클래스를 import하여 사용할 수 있습니다.
"""

from __future__ import annotations
from typing import Dict, Any, List
import json

# ✅ 내부 모듈
from .detector import GPTDateDetector


class AntChatGPT:
    """
    백엔드에서 사용할 수 있는 통합 인터페이스 클래스
    """

    def __init__(self, model: str = "gpt-4o-mini"):
        """
        AntChatGPT 초기화

        Args:
            model: 사용할 GPT 모델명 (기본값: gpt-4o-mini)
        """
        self.detector = GPTDateDetector(model=model)
        self.conversation_history: List[Dict[str, str]] = []

    # ──────────────────────────────────────────────────────────────────────
    # 내부 유틸
    # ──────────────────────────────────────────────────────────────────────
    def _normalize_schedule(self, data: Any) -> Dict[str, Any]:
        """
        어떤 형태가 와도 { "events": [...] } 구조로 맞춰서 반환
        각 이벤트는 {start_date, end_date, title} 키를 가짐
        """
        try:
            if isinstance(data, str):
                data = json.loads(data)
        except Exception:
            return {"events": []}

        if not isinstance(data, dict):
            return {"events": []}

        events = data.get("events", [])
        if not isinstance(events, list):
            return {"events": []}

        norm = []
        for ev in events:
            if not isinstance(ev, dict):
                continue
            start = str(ev.get("start_date", "")).strip()
            end = str(ev.get("end_date", "")).strip() or start
            title = str(ev.get("title", "")).strip()
            if start:
                norm.append({"start_date": start, "end_date": end, "title": title})
        return {"events": norm}

    # ──────────────────────────────────────────────────────────────────────
    # 공개 API
    # ──────────────────────────────────────────────────────────────────────
    def process_message(self, message: str) -> Dict[str, Any]:
        """
        사용자 메시지를 처리하여 결과를 반환

        Returns:
            {
                "has_schedule": bool,           # 일정 포함 여부
                "tokens_used": dict,            # 토큰 사용량
                "reply": str | None,            # GPT 응답 (일정이 없을 때)
                "schedule_data": dict | None,   # 일정 데이터 (있을 때)
                "type": "schedule" | "conversation",
                "error": str (optional)
            }
        """
        # 1) 일정 생성 의도 판별
        has_schedule, tokens = self.detector.has_date(message)

        result: Dict[str, Any] = {
            "has_schedule": has_schedule,
            "tokens_used": tokens or {},
            "type": "schedule" if has_schedule else "conversation",
            "reply": None,
            "schedule_data": None,
        }

        if has_schedule:
            # 2) 일정 추출 or 크롤링 파이프라인 실행
            try:
                raw = self.detector.run_pipeline(message)  # ✅ 직접 pipeline 실행
                result["schedule_data"] = self._normalize_schedule(raw)
            except Exception as e:
                result["error"] = f"schedule pipeline failed: {e}"
                result["reply"] = "일정 처리 중 오류가 발생했습니다."
                result["type"] = "conversation"
        else:
            # 3) 일반 대화 처리
            try:
                reply = self.detector.generate_simple_reply(message)
                result["reply"] = reply
                # 대화 히스토리 누적
                self.conversation_history.append({"role": "user", "content": message})
                self.conversation_history.append({"role": "assistant", "content": reply})
                # 길이 제한 (최근 10턴)
                if len(self.conversation_history) > 20:
                    self.conversation_history = self.conversation_history[-20:]
            except Exception as e:
                result["error"] = f"chat reply failed: {e}"
                result["reply"] = "대화 처리 중 오류가 발생했습니다."

        return result

    def process_file(self, file_path: str) -> Dict[str, Any]:
        """
        파일을 처리하여 일정 정보를 추출
        """
        # try:
        #     raw = self.detector.run_pipeline(file_path)
        #     schedule = self._normalize_schedule(raw)
        #     return {
        #         "schedule_data": schedule,
        #         "type": "file_processing",
        #         "file_path": file_path,
        #     }
        # except Exception as e:
        #     return {
        #         "error": str(e),
        #         "type": "file_processing",
        #         "file_path": file_path,
        #         "schedule_data": {"events": []},
        #     }
        print("File processing is not fully implemented due to missing dependencies.")
        return {
            "error": "File processing is not fully implemented.",
            "type": "file_processing",
            "file_path": file_path,
            "schedule_data": {"events": []},
        }


    def reset_conversation(self) -> None:
        """대화 기록 초기화"""
        self.conversation_history = []

    def get_conversation_history(self) -> list:
        """현재 대화 기록 반환"""
        return list(self.conversation_history)


# 단독 실행 테스트(선택)
if __name__ == "__main__":
    ant = AntChatGPT()
    for msg in ["안녕하세요", "내일 오후 3시에 회의가 있어요", "오아시스 내한 일정 알려줘"]:
        print("n입력:", msg)
        print("결과:", ant.process_message(msg))
