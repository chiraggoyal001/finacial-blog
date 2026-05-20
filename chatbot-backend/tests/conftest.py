"""
Pytest configuration for chatbot backend tests.
Sets up environment variables needed for imports.
"""

import os
import sys

# Ensure the backend root is in the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set minimal env vars so Settings() doesn't crash on import
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-key")
