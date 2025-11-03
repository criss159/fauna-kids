# Configuración de Gunicorn para Fauna Kids

import multiprocessing

# Dirección y puerto
bind = "0.0.0.0:8000"

# Workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# Timeouts
timeout = 30
graceful_timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/faunakids/gunicorn_access.log"
errorlog = "/var/log/faunakids/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "fauna_kids"

# Server mechanics
daemon = False
pidfile = "/tmp/gunicorn_faunakids.pid"
user = "faunakids"
group = "faunakids"
tmp_upload_dir = "/tmp"

# SSL (si usas SSL directo en Gunicorn en lugar de Nginx)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"
