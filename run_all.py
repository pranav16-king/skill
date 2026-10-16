#!/usr/bin/env python3
"""
DPDP Form Auditor - Dual Process Runner
Launches both FastAPI Backend (port 8000) and React Vite Frontend (port 5173)
concurrently with live output streaming and graceful termination.
"""

import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

processes = []
running = True


def log_stream(pipe, prefix, color_code):
    """Streams stdout/stderr lines with a colored prefix."""
    reset = "\033[0m"
    try:
        for line in iter(pipe.readline, ""):
            if not line:
                break
            clean_line = line.rstrip("\r\n")
            if clean_line:
                print(f"{color_code}[{prefix}]{reset} {clean_line}")
    except Exception:
        pass


def shutdown_processes():
    global running
    if not running:
        return
    running = False
    print("\n\033[33mShutting down backend and frontend services...\033[0m")
    for p in processes:
        if p.poll() is None:
            try:
                p.terminate()
                p.wait(timeout=2)
            except Exception:
                try:
                    p.kill()
                except Exception:
                    pass
    print("\033[32mServices terminated cleanly.\033[0m")


def signal_handler(sig, frame):
    shutdown_processes()
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("\033[36m" + "=" * 72)
    print("           DPDP FORM AUDITOR - CONCURRENT SERVICE RUNNER               ")
    print("=" * 72 + "\033[0m")
    print(f"Working Directory: {ROOT_DIR}")

    # 1. Start FastAPI Backend
    print("\n\033[34m[STARTING BACKEND]\033[0m Launching FastAPI on http://localhost:8000...")
    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload",
    ]
    p_backend = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(p_backend)

    t_back = threading.Thread(
        target=log_stream,
        args=(p_backend.stdout, "BACKEND", "\033[34m"),
        daemon=True,
    )
    t_back.start()

    # 2. Start Vite Frontend
    print("\033[35m[STARTING FRONTEND]\033[0m Launching Vite React on http://localhost:5173...")
    frontend_cmd = ["npx.cmd" if os.name == "nt" else "npx", "vite", "--port", "5173", "--host"]
    p_frontend = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    processes.append(p_frontend)

    t_front = threading.Thread(
        target=log_stream,
        args=(p_frontend.stdout, "FRONTEND", "\033[35m"),
        daemon=True,
    )
    t_front.start()

    print("\n\033[32m" + "=" * 72)
    print("  SERVICES RUNNING CONCURRENTLY:")
    print("    • Frontend UI : http://localhost:5173")
    print("    • Backend API : http://localhost:8000")
    print("    • API Docs    : http://localhost:8000/docs")
    print("    • Health      : http://localhost:8000/api/health")
    print("=" * 72 + "\033[0m")
    print("Press Ctrl+C to stop both servers.\n")

    # Monitor processes
    try:
        while running:
            time.sleep(0.5)
            if p_backend.poll() is not None:
                print("\n\033[31m[BACKEND STOPPED]\033[0m")
                break
            if p_frontend.poll() is not None:
                print("\n\033[31m[FRONTEND STOPPED]\033[0m")
                break
    except KeyboardInterrupt:
        pass
    finally:
        shutdown_processes()


if __name__ == "__main__":
    main()
