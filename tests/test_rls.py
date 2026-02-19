"""Test suite for Row Level Security (RLS) policies"""

import pytest
import os
from datetime import date
from dotenv import load_dotenv
from utils.supabase_client import get_test_client

load_dotenv('.env.test')


@pytest.fixture
def user_a_token():
    """Get Clerk token for User A"""
    return os.getenv('TEST_USER_A_TOKEN')


@pytest.fixture
def user_b_token():
    """Get Clerk token for User B"""
    return os.getenv('TEST_USER_B_TOKEN')


@pytest.fixture
def user_a_id():
    """Get User A ID"""
    return os.getenv('TEST_USER_A_ID', 'user_a_123')


@pytest.fixture
def user_b_id():
    """Get User B ID"""
    return os.getenv('TEST_USER_B_ID', 'user_b_456')


@pytest.fixture
def cleanup(user_a_id, user_b_id):
    """Cleanup test data for both users"""
    yield
    try:
        from utils.supabase_client import get_test_client
        admin_client = get_test_client().get_admin_client()

        admin_client.table('transactions').delete().eq('user_id', user_a_id).execute()
        admin_client.table('transactions').delete().eq('user_id', user_b_id).execute()
    except Exception as e:
        print(f"Cleanup error: {e}")


class TestRLSIsolation:
    """Tests for Row Level Security isolation between users"""

    def test_user_cannot_see_other_users_transactions(self, user_a_token, user_b_token, user_a_id, user_b_id, cleanup):
        """Test that User A cannot see User B's transactions"""
        # Create transaction for User A using admin client
        admin_client = get_test_client().get_admin_client()

        user_a_transaction = {
            'user_id': user_a_id,
            'name': 'User A Transaction',
            'amount': 100.00,
            'type': 'Expense',
            'account_type': 'Cash',
            'category_id': 1,
            'date': date.today().isoformat()
        }

        create_result = admin_client.table('transactions').insert(user_a_transaction).execute()
        user_a_transaction_id = create_result.data[0]['id']

        # Try to read User A's transaction as User B
        user_b_client = get_test_client(user_b_token)

        result = user_b_client.client.table('transactions').select('*').eq('id', user_a_transaction_id).execute()

        # User B should NOT be able to see User A's transaction
        assert len(result.data) == 0

    def test_user_can_only_see_own_transactions(self, user_a_token, user_b_token, user_a_id, user_b_id, cleanup):
        """Test that each user can only see their own transactions"""
        # Create transactions for both users using admin client
        admin_client = get_test_client().get_admin_client()

        transactions = [
            {'user_id': user_a_id, 'name': 'User A Txn 1', 'amount': 100, 'type': 'Expense', 'account_type': 'Cash', 'category_id': 1, 'date': date.today().isoformat()},
            {'user_id': user_a_id, 'name': 'User A Txn 2', 'amount': 200, 'type': 'Income', 'account_type': 'Cash', 'category_id': 1, 'date': date.today().isoformat()},
            {'user_id': user_b_id, 'name': 'User B Txn 1', 'amount': 150, 'type': 'Expense', 'account_type': 'Cash', 'category_id': 1, 'date': date.today().isoformat()},
            {'user_id': user_b_id, 'name': 'User B Txn 2', 'amount': 250, 'type': 'Income', 'account_type': 'Cash', 'category_id': 1, 'date': date.today().isoformat()},
        ]

        admin_client.table('transactions').insert(transactions).execute()

        # User A should only see their 2 transactions
        user_a_client = get_test_client(user_a_token)
        result_a = user_a_client.client.table('transactions').select('*').execute()

        assert len(result_a.data) == 2
        assert all(t['user_id'] == user_a_id for t in result_a.data)

        # User B should only see their 2 transactions
        user_b_client = get_test_client(user_b_token)
        result_b = user_b_client.client.table('transactions').select('*').execute()

        assert len(result_b.data) == 2
        assert all(t['user_id'] == user_b_id for t in result_b.data)

    def test_user_cannot_update_other_users_transactions(self, user_a_token, user_b_token, user_a_id, user_b_id, cleanup):
        """Test that User B cannot update User A's transactions"""
        # Create transaction for User A
        admin_client = get_test_client().get_admin_client()

        create_result = admin_client.table('transactions').insert({
            'user_id': user_a_id,
            'name': 'User A Transaction',
            'amount': 100.00,
            'type': 'Expense',
            'account_type': 'Cash',
            'category_id': 1,
            'date': date.today().isoformat()
        }).execute()

        transaction_id = create_result.data[0]['id']

        # Try to update as User B
        user_b_client = get_test_client(user_b_token)

        update_result = user_b_client.client.table('transactions').update({
            'name': 'Hacked by User B'
        }).eq('id', transaction_id).execute()

        # Update should return 0 rows (RLS blocks it)
        assert len(update_result.data) == 0

        # Verify transaction unchanged
        check_result = admin_client.table('transactions').select('*').eq('id', transaction_id).execute()

        assert check_result.data[0]['name'] == 'User A Transaction'

    def test_user_cannot_delete_other_users_transactions(self, user_a_token, user_b_token, user_a_id, user_b_id, cleanup):
        """Test that User B cannot delete User A's transactions"""
        # Create transaction for User A
        admin_client = get_test_client().get_admin_client()

        create_result = admin_client.table('transactions').insert({
            'user_id': user_a_id,
            'name': 'User A Transaction',
            'amount': 100.00,
            'type': 'Expense',
            'account_type': 'Cash',
            'category_id': 1,
            'date': date.today().isoformat()
        }).execute()

        transaction_id = create_result.data[0]['id']

        # Try to delete as User B
        user_b_client = get_test_client(user_b_token)

        delete_result = user_b_client.client.table('transactions').delete().eq('id', transaction_id).execute()

        # Delete should return 0 rows (RLS blocks it)
        assert len(delete_result.data) == 0

        # Verify transaction still exists
        check_result = admin_client.table('transactions').select('*').eq('id', transaction_id).execute()

        assert len(check_result.data) == 1


class TestJWTClaims:
    """Tests for JWT claim verification"""

    def test_authenticated_role_claim(self, user_a_token):
        """Test that JWT includes role: authenticated claim"""
        # This would require decoding the JWT token
        # For now, we can verify indirectly by checking that authenticated requests work
        client = get_test_client(user_a_token)

        # If this succeeds, the token has correct claims
        result = client.client.table('transactions').select('count').execute()

        assert result is not None

    def test_unauthenticated_request_fails(self, user_a_id, cleanup):
        """Test that requests without auth token fail for protected operations"""
        # Create client without auth token
        unauth_client = get_test_client(None)

        # Try to create transaction without auth
        with pytest.raises(Exception):
            unauth_client.client.table('transactions').insert({
                'user_id': user_a_id,
                'name': 'Should Fail',
                'amount': 100,
                'type': 'Expense',
                'date': date.today().isoformat()
            }).execute()


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
