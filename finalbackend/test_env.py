import os
from dotenv import load_dotenv

# Explicitly specify the path to the .env file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
loaded = load_dotenv(dotenv_path=dotenv_path)

print(f"load_dotenv() returned: {loaded}")
kma_key = os.getenv("KMA_API_KEY")
print(f"KMA_API_KEY from os.getenv: {kma_key}")

if not loaded:
    print("Error: .env file was not loaded. Check file name, location, and permissions.")
elif kma_key is None:
    print("Error: KMA_API_KEY is None. Check if the key is present and correctly formatted in .env.")
else:
    print("Success: KMA_API_KEY loaded correctly.")