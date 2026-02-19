"""End-to-end integration tests for complete workflows"""

import pytest
import os
from datetime import date, timedelta
from dotenv import load_dotenv
from utils.supabase_client import get_test_client
from utils.helpers import (
    generate_test_transaction,
    generate_test_recurring_transaction,
    generate_bulk_transactions,
    TestDataFactory
)

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
        admin.table('transactions').delete().eq('user_id', test_user_id).execute()
        admin.table('recurring_transactions').delete().eq('user_id', test_user_id).execute()
    except Exception as e:
        print(f"Cleanup error: {e}")


class TestCompleteUserWorkflow:
    """Test complete user workflow from signup to transactions"""

    def test_new_user_creates_first_transaction(self, supabase_client, test_user_id, cleanup):
        """Test new user creating their first transaction"""
        # Simulate new user creating first transaction
        first_transaction = generate_test_transaction(
            user_id=test_user_id,
            name='First Salary',
            amount=5000.00,
            transaction_type='Income'
        )

        result = supabase_client.client.table('transactions').insert(first_transaction).execute()

        assert result.data is not None
        assert len(result.data) == 1
        assert result.data[0]['name'] == 'First Salary'

        # Verify user can read their transaction
        read_result = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).execute()

        assert read_result.data is not None
        assert len(read_result.data) == 1

    def test_user_monthly_budget_workflow(self, supabase_client, test_user_id, data_factory, cleanup):
        """Test user setting up monthly budget with recurring expenses"""
        # Create recurring monthly expenses
        recurring_expenses = [
            data_factory.create_recurring_transaction(
                name='Rent',
                amount=1500.00,
                frequency='Monthly',
                transaction_type='Expense'
            ),
            data_factory.create_recurring_transaction(
                name='Utilities',
                amount=200.00,
                frequency='Monthly',
                transaction_type='Expense'
            ),
            data_factory.create_recurring_transaction(
                name='Subscriptions',
                amount=50.00,
                frequency='Monthly',
                transaction_type='Expense'
            ),
        ]

        # Insert recurring transactions
        recurring_result = supabase_client.client.table('recurring_transactions').insert(recurring_expenses).execute()

        assert recurring_result.data is not None
        assert len(recurring_result.data) == 3

        # Add one-time income
        income = data_factory.create_transaction(
            name='Salary',
            amount=5000.00,
            transaction_type='Income'
        )

        income_result = supabase_client.client.table('transactions').insert(income).execute()

        assert income_result.data is not None

        # Calculate total budget
        recurring_total = sum(float(r['amount']) for r in recurring_result.data)
        income_total = 5000.00

        assert income_total > recurring_total  # User has positive budget


class TestDashboardDataFlow:
    """Test dashboard data aggregation and statistics"""

    def test_dashboard_transaction_summary(self, supabase_client, test_user_id, cleanup):
        """Test dashboard can aggregate transaction data correctly"""
        # Create mixed transactions for current month
        transactions = [
            generate_test_transaction(user_id=test_user_id, name='Salary', amount=5000.00, transaction_type='Income'),
            generate_test_transaction(user_id=test_user_id, name='Rent', amount=1500.00, transaction_type='Expense'),
            generate_test_transaction(user_id=test_user_id, name='Groceries', amount=300.00, transaction_type='Expense'),
            generate_test_transaction(user_id=test_user_id, name='Freelance', amount=1000.00, transaction_type='Income'),
        ]

        supabase_client.client.table('transactions').insert(transactions).execute()

        # Query all transactions
        result = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).execute()

        assert result.data is not None

        # Calculate totals
        income_total = sum(float(t['amount']) for t in result.data if t['type'] == 'Income')
        expense_total = sum(float(t['amount']) for t in result.data if t['type'] == 'Expense')
        net_total = income_total - expense_total

        assert income_total == 6000.00
        assert expense_total == 1800.00
        assert net_total == 4200.00

    def test_dashboard_category_breakdown(self, supabase_client, test_user_id, cleanup):
        """Test dashboard can group transactions by category"""
        # Create transactions in different categories
        transactions = [
            generate_test_transaction(user_id=test_user_id, name='Groceries 1', amount=100.00, category_id=1),
            generate_test_transaction(user_id=test_user_id, name='Groceries 2', amount=150.00, category_id=1),
            generate_test_transaction(user_id=test_user_id, name='Transport 1', amount=50.00, category_id=2),
            generate_test_transaction(user_id=test_user_id, name='Transport 2', amount=75.00, category_id=2),
        ]

        supabase_client.client.table('transactions').insert(transactions).execute()

        # Query and group by category
        result = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).execute()

        # Group by category_id
        category_totals = {}
        for t in result.data:
            cat_id = t['category_id']
            if cat_id not in category_totals:
                category_totals[cat_id] = 0
            category_totals[cat_id] += float(t['amount'])

        assert category_totals[1] == 250.00  # Groceries
        assert category_totals[2] == 125.00  # Transport


class TestBulkOperations:
    """Test bulk operations performance and correctness"""

    def test_bulk_create_transactions(self, supabase_client, test_user_id, cleanup):
        """Test creating multiple transactions in bulk"""
        # Generate 50 transactions
        bulk_transactions = generate_bulk_transactions(user_id=test_user_id, count=50)

        result = supabase_client.client.table('transactions').insert(bulk_transactions).execute()

        assert result.data is not None
        assert len(result.data) == 50

        # Verify all transactions belong to user
        assert all(t['user_id'] == test_user_id for t in result.data)

    def test_bulk_update_transactions(self, supabase_client, test_user_id, data_factory, cleanup):
        """Test updating multiple transactions in bulk"""
        # Create transactions
        transactions = [
            data_factory.create_transaction(name=f'Transaction {i}', amount=100.00)
            for i in range(10)
        ]

        create_result = supabase_client.client.table('transactions').insert(transactions).execute()
        ids = [t['id'] for t in create_result.data]

        # Bulk update all to same category
        for txn_id in ids:
            supabase_client.client.table('transactions').update({
                'category_id': 5
            }).eq('id', txn_id).execute()

        # Verify updates
        check_result = supabase_client.client.table('transactions').select('*').in_('id', ids).execute()

        assert all(t['category_id'] == 5 for t in check_result.data)

    def test_bulk_delete_old_transactions(self, supabase_client, test_user_id, cleanup):
        """Test bulk deleting old transactions"""
        # Create old and recent transactions
        old_date = date.today() - timedelta(days=400)
        recent_date = date.today() - timedelta(days=10)

        old_transactions = [
            generate_test_transaction(user_id=test_user_id, name=f'Old {i}', date_obj=old_date)
            for i in range(5)
        ]

        recent_transactions = [
            generate_test_transaction(user_id=test_user_id, name=f'Recent {i}', date_obj=recent_date)
            for i in range(5)
        ]

        supabase_client.client.table('transactions').insert(old_transactions + recent_transactions).execute()

        # Delete old transactions (>365 days)
        cutoff_date = date.today() - timedelta(days=365)
        supabase_client.client.table('transactions').delete().eq('user_id', test_user_id).lt('date', cutoff_date.isoformat()).execute()

        # Verify only recent transactions remain
        result = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).execute()

        assert result.data is not None
        assert len(result.data) == 5
        assert all('Recent' in t['name'] for t in result.data)


class TestErrorRecovery:
    """Test error handling and recovery scenarios"""

    def test_duplicate_transaction_handling(self, supabase_client, test_user_id, cleanup):
        """Test handling of potential duplicate transactions"""
        transaction = generate_test_transaction(
            user_id=test_user_id,
            name='Coffee',
            amount=5.00
        )

        # Create first transaction
        result1 = supabase_client.client.table('transactions').insert(transaction).execute()

        # Create identical transaction (should succeed as separate entry)
        result2 = supabase_client.client.table('transactions').insert(transaction).execute()

        # Both should succeed but have different IDs
        assert result1.data[0]['id'] != result2.data[0]['id']

    def test_invalid_category_error_handling(self, supabase_client, test_user_id, cleanup):
        """Test error handling for invalid category"""
        invalid_transaction = generate_test_transaction(
            user_id=test_user_id,
            category_id=99999  # Non-existent category
        )

        with pytest.raises(Exception) as exc_info:
            supabase_client.client.table('transactions').insert(invalid_transaction).execute()

        # Should fail due to foreign key constraint
        assert '23503' in str(exc_info.value) or 'foreign key' in str(exc_info.value).lower()


class TestPerformanceScenarios:
    """Test performance under various load scenarios"""

    def test_pagination_large_dataset(self, supabase_client, test_user_id, cleanup):
        """Test pagination with large dataset"""
        # Create 100 transactions
        bulk_transactions = generate_bulk_transactions(user_id=test_user_id, count=100)
        supabase_client.client.table('transactions').insert(bulk_transactions).execute()

        # Test pagination
        page_size = 20
        page1 = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).range(0, page_size - 1).execute()

        assert page1.data is not None
        assert len(page1.data) == page_size

        # Get second page
        page2 = supabase_client.client.table('transactions').select('*').eq('user_id', test_user_id).range(page_size, page_size * 2 - 1).execute()

        assert page2.data is not None
        assert len(page2.data) == page_size

        # Verify no overlap
        page1_ids = {t['id'] for t in page1.data}
        page2_ids = {t['id'] for t in page2.data}
        assert page1_ids.isdisjoint(page2_ids)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
