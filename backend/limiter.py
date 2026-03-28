from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared Limiter instance used by both main.py and auth/router.py.
# A single instance is required so SlowAPI can track request counts correctly
# across all routers — two separate instances would each maintain their own counters.
limiter = Limiter(key_func=get_remote_address)
