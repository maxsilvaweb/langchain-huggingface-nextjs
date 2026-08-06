import os
from dotenv import load_dotenv

# Explicitly load the .env file from the current directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Add configuration settings here
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Debugging: check if keys are loaded
keys_to_check = {
    "CONVEX_URL": CONVEX_URL,
    "HUGGINGFACE_API_KEY": HUGGINGFACE_API_KEY,
    "OPENAI_API_KEY": OPENAI_API_KEY,
    "ANTHROPIC_API_KEY": ANTHROPIC_API_KEY,
    "GOOGLE_API_KEY": GOOGLE_API_KEY
}

for name, value in keys_to_check.items():
    print(f"DEBUG: {name} loaded: {'Yes' if value else 'No'}")
