"""Supabase test client with authentication"""

import os
from supabase import create_client, Client
from typing import Optional
from dotenv import load_dotenv

load_dotenv('.env.test')

class SupabaseTestClient:
    """Test client for Supabase operations"""

    def __init__(self, auth_token: Optional[str] = None):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_ANON_KEY')
        self.service_key = os.getenv('SUPABASE_SERVICE_KEY')

        if not self.url or not self.key:
            raise ValueError("Missing Supabase environment variables")

        # Create client with optional auth token
        if auth_token:
            self.client: Client = create_client(
                self.url,
                self.key,
                options={
                    'headers': {
                        'Authorization': f'Bearer {auth_token}'
                    }
                }
            )
        else:
            self.client: Client = create_client(self.url, self.key)

    def get_admin_client(self) -> Client:
        """Get admin client that bypasses RLS"""
        return create_client(self.url, self.service_key)

    async def cleanup_test_data(self, user_id: str):
        """Clean up all test data for a user"""
        admin = self.get_admin_client()

        # Delete in correct order due to foreign keys
        await admin.table('transactions').delete().eq('user_id', user_id).execute()
        await admin.table('recurring_transactions').delete().eq('user_id', user_id).execute()
        await admin.table('profiles').delete().eq('id', user_id).execute()

def get_test_client(auth_token: Optional[str] = None) -> SupabaseTestClient:
    """Factory function to create test client"""
    return SupabaseTestClient(auth_token)
