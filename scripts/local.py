#!/usr/bin/env python3
"""Manage only the mini app processes; keep PostgreSQL data across restarts."""
import os
import signal
import subprocess
import sys
import time
import shutil
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
RUN = ROOT / '.local' / 'run'
DATA = ROOT / '.local' / 'postgres'
RUN.mkdir(parents=True, exist_ok=True)
PG = Path('/opt/homebrew/opt/postgresql@14/bin')

def pgtool(name):
    return shutil.which(name) or str(PG / name)

def stop(name):
    pidfile = RUN / (name + '.pid')
    if pidfile.exists():
        pid = int(pidfile.read_text())
        # Refuse a stale PID that has been reused for an unrelated process.
        command = subprocess.run(['ps', '-p', str(pid), '-o', 'command='], capture_output=True, text=True).stdout
        expected = str(ROOT / ('backend/dist/server.js' if name == 'backend' else 'frontend/node_modules/vite/bin/vite.js'))
        if expected in command:
            os.kill(pid, signal.SIGTERM)
            for _ in range(50):
                try: os.kill(pid, 0)
                except ProcessLookupError: break
                time.sleep(0.1)
        pidfile.unlink()

def launch(name, argv, cwd):
    with (RUN / (name + '.log')).open('ab') as log:
        process = subprocess.Popen(argv, cwd=cwd, stdout=log, stderr=log, stdin=subprocess.DEVNULL, start_new_session=True)
    (RUN / (name + '.pid')).write_text(str(process.pid))
    return process

def check(url):
    for _ in range(100):
        try:
            with urlopen(url, timeout=1) as response:
                if response.status == 200: return
        except Exception: pass
        time.sleep(0.1)
    raise RuntimeError(f'Not ready: {url}; see {RUN}')

action = sys.argv[1] if len(sys.argv) > 1 else 'restart'
if action not in ('start', 'stop', 'restart', 'status'):
    raise SystemExit('Usage: python3 scripts/local.py [start|stop|restart|status]')
if action == 'status':
    for port in (3001, 5173):
        try:
            with urlopen(f'http://127.0.0.1:{port}/api/health', timeout=2) as r: print(port, r.read().decode())
        except Exception: print(port, 'unavailable')
    raise SystemExit()
for name in ('frontend', 'backend'): stop(name)
if action == 'stop': raise SystemExit()
if not (DATA / 'PG_VERSION').exists():
    subprocess.run([pgtool('initdb'), '-D', str(DATA), '-A', 'trust', '-U', 'smartcity', '--encoding=UTF8', '--locale=C'], check=True)
if subprocess.run([pgtool('pg_ctl'), '-D', str(DATA), 'status'], stdout=subprocess.DEVNULL).returncode:
    subprocess.run([pgtool('pg_ctl'), '-D', str(DATA), '-l', str(RUN / 'postgres.log'), '-o', '-h 127.0.0.1 -p 55432 -k /tmp', 'start'], check=True)
# The local setup is intentionally separate from any existing PostgreSQL cluster.
exists = subprocess.check_output([pgtool('psql'), '-h', '127.0.0.1', '-p', '55432', '-U', 'smartcity', '-d', 'postgres', '-Atc', "SELECT 1 FROM pg_database WHERE datname='smartcity'"], text=True)
if not exists.strip():
    subprocess.run([pgtool('createdb'), '-h', '127.0.0.1', '-p', '55432', '-U', 'smartcity', 'smartcity'], check=True)
for folder in ('backend', 'frontend'):
    if not (ROOT / folder / 'node_modules').exists(): subprocess.run(['npm', 'ci'], cwd=ROOT / folder, check=True)
    subprocess.run(['npm', 'run', 'build'], cwd=ROOT / folder, check=True)
launch('backend', ['node', str(ROOT / 'backend/dist/server.js')], ROOT)
check('http://127.0.0.1:3001/api/health')
launch('frontend', ['node', str(ROOT / 'frontend/node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], ROOT / 'frontend')
check('http://127.0.0.1:5173/api/health')
print('Mini app: http://localhost:5173 | API + built app: http://localhost:3001')
