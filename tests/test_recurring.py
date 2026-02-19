"""Test suite for recurring transaction operations"""

import pytest
import os
from datetime import date, timedelta
from dotenv import load_dotenv
from utils.supabase_client import get_test_client
from utils.helpers import generate_test_recurring_transaction, TestDataFactory

load_dotenv('.env.test')


@pytest.fixture
def clerk_token():
    """Get Clerk authentication token for testing"""
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
def data_factory(test_user_id):
    """Create test data factory"""
    return TestDataFactory(test_user_id)


@pytest.fixture
def cleanup(supabase_client, test_user_id):
    """Cleanup test data after each test"""
    yield
    try:
        admin = supabase_client.get_admin_client()
        admin.table('recurring_transactions').delete().eq('user_id', test_user_id).execute()
    except Exception as e:
        print(f"Cleanup error: {e}")


class TestRecurringTransactionCreate:
    """Tests for creating recurring transactions"""

    def test_create_valid_recurring_transaction(self, supabase_client, test_user_id, cleanup):
        """Test creating a valid recurring transaction"""
        recurring_data = generate_test_recurring_transaction(
            user_id=test_user_id,
            name='Monthly Rent',
            amount=1500.00,
            frequency='Monthly'
        )

        result = supabase_client.client.table('recurring_transactions').insert(recurring_data).execute()

        assert result.data is not None
        assert len(result.data) == 1
        assert result.data[0]['name'] == 'Monthly Rent'
        assert float(result.data[0]['amount']) == 1500.00
        assert result.data[0]['frequency'] == 'Monthly'
        assert result.data[0]['user_id'] == test_user_id

    def test_create_recurring_transaction_all_frequencies(self, supabase_client, test_user_id, cleanup):
        """Test creating recurring transactions with different frequencies"""
        frequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly']

        for freq in frequencies:
            recurring_data = generate_test_recurring_transaction(
                user_id=test_user_id,
                name=f'{freq} Transaction',
                frequency=freq
            )

            result = supabase_client.client.table('recurring_transactions').insert(recurring_data).execute()

            assert result.data is not None
            assert result.data[0]['frequency'] == freq

    def test_create_recurring_with_end_date(self, supabase_client, test_user_id, cleanup):
        """Test creating recurring transaction with end date"""
        end_date = date.today() + timedelta(days=365)

        recurring_data = generate_test_recurring_transaction(
            user_id=test_user_id,
            name='Limited Subscription',
            end_date=end_date
        )

        result = supabase_client.client.table('recurring_transactions').insert(recurring_data).execute()

        assert result.data is not None
        assert result.data[0]['end_date'] is not None

    def test_create_recurring_without_user_id_fails(self, supabase_client, cleanup):
        """Test that creating recurring transaction without user_id fails"""
        recurring_data = {
            'name': 'Test Recurring',
            'amount': 100.00,
            'frequency': 'Monthly',
            'start_date': date.today().isoformat()
        }

        with pytest.raises(Exception):
            supabase_client.client.table('recurring_transactions').insert(recurring_data).execute()


class TestRecurringTransactionRead:
    """Tests for reading recurring transactions"""

    def test_read_own_recurring_transactions(self, supabase_client, test_user_id, data_factory, cleanup):
        """Test reading user's own recurring transactions"""
        # Create test recurring transactions
        recurring_txns = [
            data_factory.create_recurring_transaction(name=f'Recurring {i}', frequency='Monthly')
            for i in range(1, 4)
        ]

        supabase_client.client.table('recurring_transactions').insert(recurring_txns).execute()

        # Read recurring transactions
        result = supabase_client.client.table('recurring_transactions').select('*').eq('user_id', test_user_id).execute()

        assert result.data is not None
        assert len(result.data) >= 3

    def test_filter_recurring_by_frequency(self, supabase_client, test_user_id, data_factory, cleanup):
        """Test filtering recurring transactions by frequency"""
        # Create mixed recurring transactions
        recurring_txns = [
            data_factory.create_recurring_transaction(name='Monthly 1', frequency='Monthly'),
            data_factory.create_recurring_transaction(name='Weekly 1', frequency='Weekly'),
            data_factory.create_recurring_transaction(name='Monthly 2', frequency='Monthly'),
        ]

        supabase_client.client.table('recurring_transactions').insert(recurring_txns).execute()

        # Filter by Monthly
        result = supabase_client.client.table('recurring_transactions').select('*').eq('user_id', test_user_id).eq('frequency', 'Monthly').execute()

        assert result.data is not None
        assert len(result.data) == 2
        assert all(t['frequency'] == 'Monthly' for t in result.data)

    def test_filter_active_recurring_transactions(self, supabase_client, test_user_id, cleanup):
        """Test filtering active vs inactive recurring transactions"""
        # Create active and inactive recurring transactions
        active = generate_test_recurring_transaction(user_id=test_user_id, name='Active')
        active['is_active'] = True

        inactive = generate_test_recurring_transaction(user_id=test_user_id, name='Inactive')
        inactive['is_active'] = False

        supabase_client.client.table('recurring_transactions').insert([active, inactive]).execute()

        # Filter by active
        result = supabase_client.client.table('recurring_transactions').select('*').eq('user_id', test_user_id).eq('is_active', True).execute()

        assert result.data is not None
        assert len(result.data) == 1
        assert result.data[0]['name'] == 'Active'


class TestRecurringTransactionUpdate:
    """Tests for updating recurring transactions"""

    def test_update_recurring_transaction(self, supabase_client, test_user_id, cleanup):
        """Test updating a recurring transaction"""
        # Create recurring transaction
        create_result = supabase_client.client.table('recurring_transactions').insert(
            generate_test_recurring_transaction(
                user_id=test_user_id,
                name='Original Name',
                amount=100.00,
                frequency='Monthly'
            )
        ).execute()

        recurring_id = create_result.data[0]['id']

        # Update recurring transaction
        update_result = supabase_client.client.table('recurring_transactions').update({
            'name': 'Updated Name',
            'amount': 150.00
        }).eq('id', recurring_id).execute()

        assert update_result.data is not None
        assert update_result.data[0]['name'] == 'Updated Name'
        assert float(update_result.data[0]['amount']) == 150.00

    def test_deactivate_recurring_transaction(self, supabase_client, test_user_id, cleanup):
        """Test deactivating a recurring transaction"""
        # Create active recurring transaction
        create_result = supabase_client.client.table('recurring_transactions').insert(
            generate_test_recurring_transaction(
                user_id=test_user_id,
                name='Active Recurring'
            )
        ).execute()

        recurring_id = create_result.data[0]['id']

        # Deactivate
        update_result = supabase_client.client.table('recurring_transactions').update({
            'is_active': False
        }).eq('id', recurring_id).execute()

        assert update_result.data is not None
        assert update_result.data[0]['is_active'] is False

    def test_update_frequency(self, supabase_client, test_user_id, cleanup):
        """Test updating recurring transaction frequency"""
        # Create recurring transaction
        create_result = supabase_client.client.table('recurring_transactions').insert(
            generate_test_recurring_transaction(
                user_id=test_user_id,
                frequency='Monthly'
            )
        ).execute()

        recurring_id = create_result.data[0]['id']

        # Update frequency
        update_result = supabase_client.client.table('recurring_transactions').update({
            'frequency': 'Weekly'
        }).eq('id', recurring_id).execute()

        assert update_result.data is not None
        assert update_result.data[0]['frequency'] == 'Weekly'


class TestRecurringTransactionDelete:
    """Tests for deleting recurring transactions"""

    def test_delete_recurring_transaction(self, supabase_client, test_user_id, cleanup):
        """Test deleting a recurring transaction"""
        # Create recurring transaction
        create_result = supabase_client.client.table('recurring_transactions').insert(
            generate_test_recurring_transaction(
                user_id=test_user_id,
                name='To Delete'
            )
        ).execute()

        recurring_id = create_result.data[0]['id']

        # Delete recurring transaction
        delete_result = supabase_client.client.table('recurring_transactions').delete().eq('id', recurring_id).execute()

        # Verify deleted
        check_result = supabase_client.client.table('recurring_transactions').select('*').eq('id', recurring_id).execute()

        assert len(check_result.data) == 0

    def test_bulk_delete_recurring_transactions(self, supabase_client, test_user_id, data_factory, cleanup):
        """Test bulk deleting recurring transactions"""
        # Create multiple recurring transactions
        recurring_txns = [
            data_factory.create_recurring_transaction(name=f'Recurring {i}')
            for i in range(5)
        ]

        create_result = supabase_client.client.table('recurring_transactions').insert(recurring_txns).execute()
        ids = [t['id'] for t in create_result.data]

        # Bulk delete
        supabase_client.client.table('recurring_transactions').delete().in_('id', ids).execute()

        # Verify all deleted
        check_result = supabase_client.client.table('recurring_transactions').select('*').in_('id', ids).execute()

        assert len(check_result.data) == 0


class TestRecurringTransactionGeneration:
    """Tests for generating transactions from recurring patterns"""

    def test_monthly_recurring_generates_correctly(self, supabase_client, test_user_id, cleanup):
        """Test that monthly recurring transaction can be queried for generation"""
        # Create monthly recurring transaction
        start_date = date.today().replace(day=1)  # First of month

        recurring_data = generate_test_recurring_transaction(
            user_id=test_user_id,
            name='Monthly Rent',
            amount=1500.00,
            frequency='Monthly',
            start_date=start_date
        )

        result = supabase_client.client.table('recurring_transactions').insert(recurring_data).execute()

        assert result.data is not None

        # Query for due recurring transactions (would be used by generation logic)
        today = date.today()
        due_result = supabase_client.client.table('recurring_transactions').select('*').eq('user_id', test_user_id).eq('is_active', True).lte('start_date', today.isoformat()).execute()

        assert due_result.data is not None
        assert len(due_result.data) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
