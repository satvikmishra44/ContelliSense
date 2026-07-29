# from typing import Tuple, Optional
# from urllib.parse import urlparse, parse_qs


# def parse_channel_url(channel_url: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
#     """
#     Extract channel_id, handle, username from common YouTube channel URL forms.

#     Supported forms:
#     - https://www.youtube.com/channel/UCXXXX
#     - https://www.youtube.com/@handle
#     - https://www.youtube.com/user/username
#     - https://www.youtube.com/c/customName (best-effort; may require API lookup)
#     """
#     parsed = urlparse(channel_url)
#     path = parsed.path.strip("/")

#     if path.startswith("channel/"):
#         return path.split("/")[1], None, None

#     if path.startswith("@"):
#         handle = path
#         return None, handle, None

#     if path.startswith("user/"):
#         username = path.split("/")[1]
#         return None, None, username

#     # Fallback: custom URL; return None and let YouTube API resolve
#     return None, None, None

from typing import Optional, Tuple
from urllib.parse import urlparse


def parse_channel_url(channel_url: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract channel_id, handle, username from common YouTube channel URL forms.

    Supported forms:
    - https://www.youtube.com/channel/UCXXXX
    - https://www.youtube.com/@handle
    - https://www.youtube.com/user/username

    Returns:
        tuple[channel_id, handle, username]
    """
    parsed = urlparse(channel_url)
    path = parsed.path.strip("/")

    # Example: /channel/UCxxxx
    if path.startswith("channel/"):
        parts = path.split("/")
        if len(parts) >= 2:
            return parts[1], None, None

    # Example: /@myhandle
    if path.startswith("@"):
        return None, path, None

    # Example: /user/legacyusername
    if path.startswith("user/"):
        parts = path.split("/")
        if len(parts) >= 2:
            return None, None, parts[1]

    # Unsupported/custom URL patterns can be resolved later through API/search fallback
    return None, None, None