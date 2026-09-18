import os
import sys
import shutil
import subprocess
import threading
import time
import urllib.request
from typing import Optional

def get_ollama_base_url() -> str:
    raw_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    # Clean /api/generate or trailing slashes to get root host:port
    if "/api" in raw_url:
        raw_url = raw_url.split("/api")[0]
    return raw_url.rstrip("/")

def is_ollama_running(timeout: float = 1.0) -> bool:
    """Quick health probe for the local Ollama API server."""
    base_url = get_ollama_base_url()
    try:
        req = urllib.request.Request(
            f"{base_url}/api/tags",
            headers={"Content-Type": "application/json"},
            method="GET"
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status == 200
    except Exception:
        return False

def find_ollama_executable() -> Optional[str]:
    """Finds the ollama binary on PATH or standard OS install directories."""
    # 1. PATH search
    exe = shutil.which("ollama")
    if exe and os.path.exists(exe):
        return exe

    # 2. Windows standard paths
    if sys.platform == "win32":
        possible_paths = [
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe"),
            os.path.expandvars(r"%USERPROFILE%\AppData\Local\Programs\Ollama\ollama.exe"),
            os.path.expandvars(r"%ProgramFiles%\Ollama\ollama.exe"),
            os.path.expandvars(r"%ProgramFiles(x86)%\Ollama\ollama.exe"),
            r"C:\Users\rdine\AppData\Local\Programs\Ollama\ollama.exe"
        ]
        for p in possible_paths:
            if os.path.exists(p):
                return p

    return None

def _start_ollama_worker():
    """Background worker that probes and starts Ollama if not already running."""
    try:
        enable_ollama = os.getenv("ENABLE_OLLAMA", "true").lower() in ("true", "1", "yes")
        if not enable_ollama:
            print(" [OLLAMA STATUS]  DISABLED (ENABLE_OLLAMA=false. Built-in NLP fallback active.)", flush=True)
            return

        if is_ollama_running(timeout=1.0):
            print(" [OLLAMA STATUS]  ONLINE (Already running on localhost:11434)", flush=True)
            return

        ollama_path = find_ollama_executable()
        if not ollama_path:
            print(" [OLLAMA STATUS]  NOT DETECTED (Ollama binary not found. Local NLP fallback active.)", flush=True)
            return

        print(f" [OLLAMA STATUS]  STARTING BACKGROUND SERVICE ({ollama_path} serve)...", flush=True)

        creationflags = 0
        if sys.platform == "win32":
            # DETACHED_PROCESS = 0x00000008, CREATE_NEW_PROCESS_GROUP = 0x00000200, CREATE_NO_WINDOW = 0x08000000
            creationflags = subprocess.CREATE_NEW_PROCESS_GROUP | 0x08000000

        subprocess.Popen(
            [ollama_path, "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
            creationflags=creationflags
        )

        # Probe for readiness up to 3 seconds
        deadline = time.monotonic() + 3.0
        while time.monotonic() < deadline:
            if is_ollama_running(timeout=0.5):
                print(" [OLLAMA STATUS]  ONLINE (Ollama background process started and ready)", flush=True)
                return
            time.sleep(0.3)

        print(" [OLLAMA STATUS]  STARTING (Process launched; local NLP fallback active until fully ready)", flush=True)
    except Exception as exc:
        print(f" [OLLAMA STATUS]  NOTICE: Ollama service unavailable ({exc}). Using local NLP fallback.", flush=True)

def ensure_ollama_running(async_mode: bool = True):
    """
    Checks if Ollama is running, and starts it in the background if needed.
    Runs asynchronously by default so it never blocks FastAPI startup.
    Respects ENABLE_OLLAMA environment variable with production safety.
    """
    enable_ollama = os.getenv("ENABLE_OLLAMA", "true").lower() in ("true", "1", "yes")
    if not enable_ollama:
        print(" [OLLAMA STATUS]  DISABLED (ENABLE_OLLAMA=false. Built-in NLP fallback active.)", flush=True)
        return

    if async_mode:
        thread = threading.Thread(target=_start_ollama_worker, daemon=True, name="OllamaLauncherThread")
        thread.start()
    else:
        _start_ollama_worker()
