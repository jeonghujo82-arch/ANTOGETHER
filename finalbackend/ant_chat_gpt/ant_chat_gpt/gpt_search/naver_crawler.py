import requests
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv

# .env에서 API 키 불러오기
# Environment variables are now loaded globally in backend_new.py


class NaverCrawler:
    """
    네이버 뉴스 검색 및 본문 추출 기능을 제공하는 클래스
    """
    def __init__(self):
        self.base_url = "https://openapi.naver.com/v1/search/news.json"
        self.headers = {
            "X-Naver-Client-Id": os.getenv("NAVER_CLIENT_ID"),
            "X-Naver-Client-Secret": os.getenv("NAVER_CLIENT_SECRET")
        }

    def search(self, query, display=5):  # ✅ display 기본값을 5개로 증가
        params = {
            "query": query,
            "display": display,
            "sort": "date"
        }

        try:
            res = requests.get(self.base_url, headers=self.headers, params=params)
            res.raise_for_status()
            items = res.json().get("items", [])

            results = []
            print("🔍 검색 결과 수:", len(items))
            for item in items:
                title_html = item.get("title", "")
                title_clean = BeautifulSoup(title_html, "html.parser").get_text(" ", strip=True)

                print(f"📄 제목: {title_clean}, 링크: {item['link']}")  # ✅ 제목/링크 출력

                results.append({
                    "title": title_clean,
                    "link": item["link"]
                })

            return results
        except Exception as e:
            print("❌ 네이버 뉴스 검색 실패:", e)
            return []

    def extract_text(self, url):
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            res = requests.get(url, headers=headers, timeout=5)
            res.encoding = res.apparent_encoding
            soup = BeautifulSoup(res.text, "html.parser")

            naver_main = soup.select_one("div#newsct_article")
            if naver_main:
                text = naver_main.get_text(" ", strip=True)
            else:
                candidates = [
                    soup.find("article"),
                    soup.find("div", class_="content"),
                    soup.find("main"),
                    soup.find("body")
                ]

                text = ""
                for c in candidates:
                    if c and c.get_text(strip=True):
                        text = c.get_text(" ", strip=True)
                        break

            if not text:
                text = "본문 없음"

            print(f"📝 본문 길이: {len(text)}")
            print(f"📝 본문 내용 앞부분: {text[:200]}...")  # ✅ 미리보기 출력
            return text
        except Exception as e:
            print("❌ 본문 추출 실패:", e)
            return "본문 추출 실패"
