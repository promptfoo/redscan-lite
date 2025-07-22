import requests
from typing import Dict, Any

API_ENDPOINT = "http://localhost:8080"

def get_auth_token() -> str:
    """
    Gets an auth token from the API.

    Returns:
        str: The auth token.
    """
    raise NotImplementedError

def create_session() -> str:
    """
    Creates a session with the API.

    Returns:
        str: The session ID.
    """
    raise NotImplementedError

def call_api(prompt: str, options: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calls the API with the given prompt, options, and context.
    """
    raise NotImplementedError