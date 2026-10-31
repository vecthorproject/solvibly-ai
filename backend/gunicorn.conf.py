"""Gunicorn settings, loaded automatically when gunicorn starts from this folder.
Command-line flags (e.g. on Render) take precedence over these values."""
import os

# Reading a statement with the AI can take more than gunicorn's default 30 s.
timeout = int(os.getenv("GUNICORN_TIMEOUT", "180"))
graceful_timeout = 30
