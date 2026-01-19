from setuptools import setup, find_packages

setup(
    name="ant-chat-gpt",
    version="1.0.0",
    description="GPT 기반 일정 감지 및 처리 패키지",
    author="Your Name",
    packages=find_packages(),
    install_requires=[
        "openai",
        "python-dotenv",
        "requests",
        "beautifulsoup4",
        "selenium"
    ],
    python_requires=">=3.8",
)
