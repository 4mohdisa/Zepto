"""Test suite for transaction CRUD operations"""

import pytest
import os
from datetime import datetime, date
from dotenv import load_dotenv
from utils.supabase_client import get_test_client

load_dotenv('.env.test')


@pytest.fixture
def clerk_token():
    """Get Clerk authentication token for testing"""
    # In a real scenario, you would authenticate with Clerk and get a token
    # For now, return a test token (you'll need to implement Clerk auth)
    return os.getenv('TEST_CLERK_TOKEN')


@pytest.fixture
def test_user_id():
    """Get test user ID"""
    return os.getenv('TEST_USER_ID', 'test_user_123')


@pytest.fixture
def supabase_client(clerk_token):
    """Create authenticated Supabase client"""
    return get_test_client(clerk_token)


@pytest.fixture
def cleanup(supabase_client, test_user_id):
    """Cleanup test data after each test"""
    yield
    # Cleanup after test
    try:
        admin = supabase_client.get_admin_client()
        admin.table('transactions').delete().eq('user_id', test_user_id).execute()
    except Exception as e:
        print(f"Cleanup error: {e}")


class TestTransactionCreate:
    """Tests for creating transactions"""

    def test_create_valid_transaction(self, supabase_client, test_user_id, cleanup):
        """Test creating a valid transaction"""
        transaction_data = {
            'user_id': test_user_id,
            'name': 'Test Transaction',
            'amount': 100.50,
            'type': 'Expense',
            'account_type': 'Cash',
            'category_id': 1,
            'date': date.today().isoformat(),
            'description': 'Test description',
            'recurring_frequency': 'Never'
        }

        result = supabase_client.client.table('transactions').insert(transaction_data).execute()

        assert result.data is not None
        assert len(result.data) == 1
        assert result.data[0]['name'] == 'Test Transaction'
        assert float(result.data[0]['amount']) == 100.50
        assert result.data[0]['user_id'] == test_user_id

    def test_create_transaction_without_user_id(self, supabase_client, cleanup):
        """Test that creating transaction without user_id fails"""
        transaction_data = {
            'name': 'Test Transaction',
            'amount': 100.00,
            'type': 'Expense',
            'date': date.today().isoformat()
        }

        with pytest.raises(Exception) as exc_info:
            supabase_client.client.table('transactions').insert(transaction_data).execute()

        # Should fail due to RLS policy or NOT NULL constraint
        assert 'violates' in str(exc_info.value).lower() or 'null' in str(exc_info.value).lower()

    def test_create_transaction_with_invalid_category(self, supabase_client, test_user_id, cleanup):
        """Test that creating transaction with invalid category fails"""
        transaction_data = {
            'user_id': test_user_id,
            'name': 'Test Transaction',
            'amount': 100.00,
            'type': 'Expense',
            'category_id': 99999,  # Non-existent category
            'date': date.today().isoformat()
        }

        with pytest.raises(Exception) as exc_info:
            supabase_client.client.table('transactions').insert(transaction_data).execute()

        # Should fail due to foreign key constraint
        assert '23503' in str(exc_info.value) or 'foreign key' in str(exc_info.value).lower()


class TestTransactionRead:
    """Tests for reading transactions"""

    def test_read_own_transactions(self, supabase_client, test_user_id, cleanup):
        """Test reading user's own transactions"""
        # Create test transactions
        transactions = [
            {
                'user_id': test_user_id,
                'name': f'Transaction {i}',
                'amount': 100.00 * i,
                'type': 'Expense',
                'account_type': 'Cash',
                'category_id': 1,
                'date': date.today().isoformat()
            }
            for i in range(1, 4)
        ]

        supabase_client.client.table('transactions').insert(transactions).execute()

        # Read transactions
        result = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).execute()

        assert result.data is not None
        assert len(result.data) >= 3

    def test_filter_transactions_by_type(self, supabase_client, test_user_id, cleanup):
        """Test filtering transactions by type"""
        # Create mixed transactions
        transactions = [
            {'user_id': test_user_id, 'name': 'Income 1', 'amount': 1000, 'type': 'Income', 'date': date.today().isoformat(), 'category_id': 1, 'account_type': 'Cash'},
            {'user_id': test_user_id, 'name': 'Expense 1', 'amount': 50, 'type': 'Expense', 'date': date.today().isoformat(), 'category_id': 1, 'account_type': 'Cash'},
            {'user_id': test_user_id, 'name': 'Expense 2', 'amount': 75, 'type': 'Expense', 'date': date.today().isoformat(), 'category_id': 1, 'account_type': 'Cash'},
        ]

        supabase_client.client.table('transactions').insert(transactions).execute()

        # Filter by Expense
        result = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).eq('type', 'Expense').execute()

        assert result.data is not None
        assert len(result.data) == 2
        assert all(t['type'] == 'Expense' for t in result.data)


class TestTransactionUpdate:
    """Tests for updating transactions"""

    def test_update_transaction(self, supabase_client, test_user_id, cleanup):
        """Test updating a transaction"""
        # Create transaction
        create_result = supabase_client.client.table('transactions').insert({
            'user_id': test_user_id,
            'name': 'Original Name',
            'amount': 100.00,
            'type': 'Expense',
            'date': date.today().isoformat(),
            'category_id': 1,
            'account_type': 'Cash'
        }).execute()

        transaction_id = create_result.data[0]['id']

        # Update transaction
        update_result = supabase_client.client.table('transactions').update({
            'name': 'Updated Name',
            'amount': 150.00
        }).eq('id', transaction_id).execute()

        assert update_result.data is not None
        assert update_result.data[0]['name'] == 'Updated Name'
        assert float(update_result.data[0]['amount']) == 150.00


class TestTransactionDelete:
    """Tests for deleting transactions"""

    def test_delete_transaction(self, supabase_client, test_user_id, cleanup):
        """Test deleting a transaction"""
        # Create transaction
        create_result = supabase_client.client.table('transactions').insert({
            'user_id': test_user_id,
            'name': 'To Delete',
            'amount': 100.00,
            'type': 'Expense',
            'date': date.today().isoformat(),
            'category_id': 1,
            'account_type': 'Cash'
        }).execute()

        transaction_id = create_result.data[0]['id']

        # Delete transaction
        delete_result = supabase_client.client.table('transactions').delete().eq('id', transaction_id).execute()

        # Verify deleted
        check_result = supabase_client.client.table('transactions').select('*').eq('id', transaction_id).execute()

        assert len(check_result.data) == 0

    def test_bulk_delete_transactions(self, supabase_client, test_user_id, cleanup):
        """Test bulk deleting transactions"""
        # Create multiple transactions
        transactions = [
            {'user_id': test_user_id, 'name': f'Transaction {i}', 'amount': 100, 'type': 'Expense', 'date': date.today().isoformat(), 'category_id': 1, 'account_type': 'Cash'}
            for i in range(5)
        ]

        create_result = supabase_client.client.table('transactions').insert(transactions).execute()
        ids = [t['id'] for t in create_result.data]

        # Bulk delete
        supabase_client.client.table('transactions').delete().in_('id', ids).execute()

        # Verify all deleted
        check_result = supabase_client.client.table('transactions').select('*').in_('id', ids).execute()

        assert len(check_result.data) == 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
