#!/usr/bin/env python
"""Test if the app can be imported"""
try:
    from app.main import app
    print("SUCCESS: App imported successfully")
    print(f"App type: {type(app)}")
except Exception as e:
    print(f"FAILED: Failed to import app: {e}")
    import traceback
    traceback.print_exc()
