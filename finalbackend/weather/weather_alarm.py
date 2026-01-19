import requests
import pandas as pd
from datetime import datetime, timedelta
import openai
import os
import requests
import pandas as pd
from datetime import datetime, timedelta
import openai
import os
# from dotenv import load_dotenv # Removed

# load_dotenv() # Removed

class WeatherCommentator:
    def __init__(self, model="gpt-4o-mini"):
        self.model = model
        # Hardcoded keys for debugging - NOT FOR PRODUCTION
        self.kma_key = "YOUR_KMA_API_KEY_HERE" # Replace with your actual KMA API Key
        
        # # Removed ValueError checks
        self.client = openai.OpenAI(api_key=self.openai_key)

    def fetch_tomorrow_weather(self):
        """기상청 API로 내일 날씨 예보 데이터를 가져옵니다."""
        base_date = datetime.today().strftime("%Y%m%d")
        url = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"

        params = {
            'serviceKey': self.kma_key,
            'numOfRows': '700',
            'pageNo': '1',
            'dataType': 'JSON',
            'base_date': base_date,
            'base_time': '0800',
            'nx': '55',
            'ny': '127'
        }

        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        items = data['response']['body']['items']['item']
        df = pd.DataFrame(items)

        # 내일 날씨 기준 필터링
        tomorrow = datetime.today() + timedelta(days=1)
        tomorrow_str = tomorrow.strftime("%Y%m%d")
        df_tomorrow = df[df['fcstDate'] == tomorrow_str]
        return df_tomorrow.reset_index(drop=True)

    def summarize_weather(self, df):
        """기상청 예보 데이터프레임을 요약 텍스트로 변환합니다."""
        grouped = df.groupby('fcstTime')
        summary_lines = []

        sky_map = {'1': '맑음', '3': '구름 많음', '4': '흐림'}
        pty_map = {'0': '강수 없음', '1': '비', '2': '비/눈', '3': '눈', '4': '소나기'}

        for time, group in grouped:
            try:
                time_kor = f"{int(time[:2])}시"
                tmp = group[group['category'] == 'TMP']['fcstValue'].values[0]
                sky = group[group['category'] == 'SKY']['fcstValue'].values[0]
                pty = group[group['category'] == 'PTY']['fcstValue'].values[0]
                pop = group[group['category'] == 'POP']['fcstValue'].values[0]

                line = f"{time_kor}에는 기온 {tmp}도, {sky_map.get(sky, '알 수 없음')}, "
                line += f"{pty_map.get(pty, '알 수 없음')} (강수확률 {pop}%)입니다."
                summary_lines.append(line)
            except IndexError:
                continue

        return "내일의 주요 날씨 요약:\n" + "\n".join(summary_lines)

    def generate_advice(self, summary_text):
        """요약된 날씨 정보를 기반으로 GPT가 간단한 조언을 생성합니다."""
        prompt = f"""
        다음은 내일의 날씨 예보 요약입니다:\n\n{summary_text}\n\n
        이 정보를 기반으로 사용자에게 간단한 한마디 조언을 해줘.
        예: '우산 챙기세요', '더위 조심하세요', '외출에 좋은 날이에요' 등.
        너무 길지 않게 말해줘.
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "너는 친절한 날씨 조언 챗봇이야."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def generate_comment(self, date_str=None):
        """전체 프로세스를 실행하여 내일 날씨 조언을 반환합니다."""
        df = self.fetch_tomorrow_weather()
        summary = self.summarize_weather(df)
        advice = self.generate_advice(summary)
        return advice

    def generate_title_from_content(self, content: str) -> str:
        if not content:
            return "날씨 정보"

        prompt = f'''
다음은 AI가 생성한 날씨 조언입니다. 이 조언에 대한 2-3단어의 간결한 제목을 만들어주세요. 제목만 반환하고, 따옴표는 제거해주세요.
예를 들어, "우산 챙기세요" 라는 조언에는 "비 소식" 또는 "우산 준비" 같은 제목이 좋습니다.

[날씨 조언]
{content}

[제목]
'''

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=15,
                temperature=0.5
            )
            title = response.choices[0].message.content.strip().replace('"', '')
            return title if title else "날씨 정보"

        except Exception as e:
            print(f"⚠️ Weather title generation failed: {str(e)}")
            return "날씨 정보"
