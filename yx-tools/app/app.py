from flask import Flask, render_template, request, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
import os
import json
import csv
import logging
import re
from datetime import datetime
from urllib.parse import urlparse

app = Flask(__name__)

# Reduce noise from specific libraries
logging.getLogger('werkzeug').setLevel(logging.ERROR)
logging.getLogger('apscheduler').setLevel(logging.WARNING)

scheduler = BackgroundScheduler()
scheduler.start()

# Use absolute paths for Docker environment
CONFIG_FILE = '/app/data/web_config.json'
RESULT_FILE = '/app/data/result.csv'
LOG_FILE = '/app/data/app.log'
STATUS_FILE = '/app/data/status.json'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, mode='a', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

def load_config():
    default_config = {
        "worker_urls": "",   
        "cron_schedule": "0 4 * * *", 
        "speed": 5,
        "delay": 300,
        "count": 20,
        "thread": 200,
        "upload_count": 20,
        "ipv6": False
    }
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                saved = json.load(f)
                if "worker_domain" in saved and "worker_urls" not in saved:
                    d = saved.get("worker_domain", "")
                    u = saved.get("uuid", "")
                    if d and u:
                        saved["worker_urls"] = f"https://{d}/{u}"
                default_config.update(saved)
                return default_config
        except:
            pass
    return default_config

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    update_cron_job(config.get('cron_schedule'))

def update_cron_job(schedule_str):
    scheduler.remove_all_jobs()
    if not schedule_str:
        return
    try:
        parts = schedule_str.split()
        if len(parts) == 5:
            scheduler.add_job(run_speedtest_job, 'cron', 
                              minute=parts[0], hour=parts[1], day=parts[2], month=parts[3], day_of_week=parts[4])
        else:
             logging.error(f"Invalid cron format: {schedule_str}")
    except Exception as e:
        logging.error(f"Scheduler update failed: {e}")

def parse_worker_urls(url_input):
    domains = []
    uuids = []
    if not url_input:
        return "", ""
    urls = [u.strip() for u in url_input.replace('\n', ',').split(',') if u.strip()]
    for url in urls:
        try:
            if not url.startswith(('http://', 'https://')):
                temp_url = 'https://' + url
            else:
                temp_url = url
            parsed = urlparse(temp_url)
            domain = parsed.netloc
            path_parts = [p for p in parsed.path.strip('/').split('/') if p]
            uuid = path_parts[-1] if path_parts else ""
            if domain and uuid:
                domains.append(domain)
                uuids.append(uuid)
        except Exception as e:
            pass
    return ",".join(domains), ",".join(uuids)

def update_status(message, success=True, worker_results=None):
    """Update runtime status for UI"""
    status = {
        "message": message,
        "last_run": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "success": success
    }
    if worker_results:
        status["worker_results"] = worker_results
        
    try:
        with open(STATUS_FILE, 'w') as f:
            json.dump(status, f)
    except:
        pass

def run_speedtest_job():
    # Log start marker
    logging.info("="*30)
    logging.info("🚀 Starting new speedtest job...")
    logging.info("="*30)
    
    update_status("正在运行测速中...", success=True)
    
    # Clean up previous results if exists
    upload_results_file = "/app/data/upload_results.json"
    if os.path.exists(upload_results_file):
        try:
            os.remove(upload_results_file)
        except:
            pass
            
    config = load_config()
    domains, uuids = parse_worker_urls(config.get("worker_urls", ""))
    
    cmd = [
        "python3", "-u", "/app/cloudflare_speedtest.py", 
        "--mode", "beginner",
        "--count", str(config.get("count", 20)),
        "--speed", str(config.get("speed", 5)),
        "--delay", str(config.get("delay", 300)),
        "--thread", str(config.get("thread", 200)),
        "--upload", "api",
        "--worker-domain", domains,
        "--uuid", uuids,
        "--upload-count", str(config.get("upload_count", 20)),
        "--clear"
    ]

    if config.get("ipv6"):
        cmd.append("--ipv6")
    
    logging.info(f"Executing: {' '.join(cmd)}")

    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as log_f:
            # We use stderr=subprocess.STDOUT to capture everything in one stream
            process = subprocess.run(
                cmd, 
                cwd="/app/data", 
                stdout=log_f, 
                stderr=subprocess.STDOUT,
                text=True
            )
            
        worker_results = None
        if os.path.exists(upload_results_file):
             try:
                 with open(upload_results_file, 'r', encoding='utf-8') as f:
                     worker_results = json.load(f)
             except Exception as e:
                 logging.error(f"Error reading upload results: {e}")

        if process.returncode == 0:
            logging.info("✅ Speedtest job completed.")
            update_status("测速并上报成功 ✅", success=True, worker_results=worker_results)
        else:
            logging.error(f"❌ Speedtest job failed with exit code {process.returncode}")
            update_status("测速脚本运行失败 ❌", success=False, worker_results=worker_results)
            
    except Exception as e:
        logging.error(f"Execution error: {e}")
        update_status(f"执行出错: {str(e)}", success=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    if request.method == 'POST':
        config = request.json
        save_config(config)
        return jsonify({"status": "success"})
    else:
        return jsonify(load_config())

@app.route('/api/run', methods=['POST'])
def manual_run():
    scheduler.add_job(run_speedtest_job) 
    return jsonify({"status": "started"})

@app.route('/api/results')
def get_results():
    results = []
    if os.path.exists(RESULT_FILE):
        try:
            with open(RESULT_FILE, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    results.append(row)
        except Exception as e:
            logging.error(f"Error reading results: {e}")
    return jsonify(results)

def is_progress_line(line):
    # Matches patterns like "2000 / 5956 [--------------------->"
    return re.search(r'\d+\s*/\s*\d+\s*\[', line) is not None

@app.route('/api/logs')
def get_logs():
    if os.path.exists(LOG_FILE):
         try:
             with open(LOG_FILE, 'r', encoding='utf-8') as f:
                 # splitlines() handles \r, \n, and \r\n, allowing us to split progress bars properly
                 # We re-add \n because the frontend might expect line breaks
                 lines = [line + '\n' for line in f.read().splitlines()]
                 
                 clean_lines = []
                 processed_lines = []
                 
                 # First pass: Filter out noise
                 for line in lines:
                     if " - - [" not in line: # Filter HTTP logs
                         clean_lines.append(line)
                         
                 # Second pass: Coalesce progress bars
                 for line in clean_lines:
                     if is_progress_line(line):
                         # If previous line was also progress, iterate backwards to remove it
                         # Actually just checking the very last one added to processed_lines is enough
                         if processed_lines and is_progress_line(processed_lines[-1]):
                             processed_lines.pop()
                         processed_lines.append(line)
                     else:
                         processed_lines.append(line)
                 
                 return jsonify(processed_lines[-200:]) 
         except:
             return jsonify(["Error reading log file"])
    return jsonify([])

@app.route('/api/status')
def get_status():
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, 'r') as f:
                return jsonify(json.load(f))
        except:
            pass
    return jsonify({"message": "等待运行", "last_run": "-", "success": True})

if __name__ == '__main__':
    if not os.path.exists('/app/data'):
        os.makedirs('/app/data')
    
    update_cron_job(load_config().get('cron_schedule', '0 4 * * *'))
    
    app.run(host='0.0.0.0', port=2028)
