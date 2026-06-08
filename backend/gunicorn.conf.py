# Gunicorn configuration file
import os

# Set timeout to 120 seconds to prevent workers from being terminated during model loading or first inference
timeout = 120

# Limit workers to 1 to reduce memory footprint and prevent OOM crashes on Render Free tier (512MB RAM)
workers = 1
threads = 4

# Bind to 0.0.0.0 and the port specified by Render (defaulting to 10000)
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
