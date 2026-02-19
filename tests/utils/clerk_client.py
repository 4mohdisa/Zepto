"""Clerk authentication helper for tests"""

import os
import requests
from typing import Optional
from dotenv import load_dotenv

load_dotenv('.env.test')


class ClerkTestClient:
    """Helper class for Clerk authentication in tests"""

    def __init__(self):
        self.api_key = os.getenv('CLERK_SECRET_KEY')
        self.base_url = "https://api.clerk.com/v1"

    def get_user_token(self, user_id: str) -> Optional[str]:
        """
        Get a session token for a test user

        In production tests, you would:
        1. Use Clerk's testing tokens feature
        2. Or create test users via Clerk API
        3. Or use session tokens from .env.test

        For now, we're using pre-generated tokens from environment
        """
        # In real implementation, you might call Clerk API to get a session token
        # For testing, we use pre-generated tokens stored in .env.test
        token_key = f'TEST_USER_{user_id.upper()}_TOKEN'
        return os.getenv(token_key)

    def create_test_user(self, email: str, password: str) -> dict:
        """
        Create a test user in Clerk

        Note: This requires Clerk Secret Key and should only be used in test environment
        """
        if not self.api_key:
            raise ValueError("CLERK_SECRET_KEY not set in environment")

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

        data = {
            'email_address': [email],
            'password': password
        }

        response = requests.post(
            f'{self.base_url}/users',
            headers=headers,
            json=data
        )

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to create test user: {response.text}")

    def delete_test_user(self, user_id: str):
        """Delete a test user from Clerk"""
        if not self.api_key:
            raise ValueError("CLERK_SECRET_KEY not set in environment")

        headers = {
            'Authorization': f'Bearer {self.api_key}'
        }

        response = requests.delete(
            f'{self.base_url}/users/{user_id}',
            headers=headers
        )

        if response.status_code not in [200, 204]:
            raise Exception(f"Failed to delete test user: {response.text}")


def get_test_token(user_identifier: str = 'A') -> Optional[str]:
    """
    Factory function to get test token

    Args:
        user_identifier: User identifier (A, B, etc.)

    Returns:
        Session token for the test user
    """
    token_key = f'TEST_USER_{user_identifier}_TOKEN'
    return os.getenv(token_key)


def get_test_user_id(user_identifier: str = 'A') -> str:
    """
    Factory function to get test user ID

    Args:
        user_identifier: User identifier (A, B, etc.)

    Returns:
        User ID for the test user
    """
    user_id_key = f'TEST_USER_{user_identifier}_ID'
    return os.getenv(user_id_key, f'test_user_{user_identifier.lower()}_123')
