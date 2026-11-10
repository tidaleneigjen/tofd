import os
import sys
from pathlib import Path

os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("PAGES_TABLE_NAME", "tofd-pages-test")

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
