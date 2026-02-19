"""Shared test utilities and helper functions"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Any
import random
import string


def generate_random_string(length: int = 10) -> str:
    """Generate a random string for test data"""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def generate_test_transaction(
    user_id: str,
    name: str = None,
    amount: float = None,
    transaction_type: str = 'Expense',
    account_type: str = 'Cash',
    category_id: int = 1,
    date_obj: date = None,
    description: str = None
) -> Dict[str, Any]:
    """
    Generate a test transaction with default or custom values

    Args:
        user_id: User ID for the transaction
        name: Transaction name (auto-generated if None)
        amount: Transaction amount (random if None)
        transaction_type: Type of transaction (Expense or Income)
        account_type: Account type (Cash, Credit, Debit, etc.)
        category_id: Category ID
        date_obj: Transaction date (today if None)
        description: Transaction description

    Returns:
        Dictionary with transaction data
    """
    return {
        'user_id': user_id,
        'name': name or f'Test Transaction {generate_random_string(5)}',
        'amount': amount or round(random.uniform(10.0, 1000.0), 2),
        'type': transaction_type,
        'account_type': account_type,
        'category_id': category_id,
        'date': (date_obj or date.today()).isoformat(),
        'description': description or f'Test description {generate_random_string(8)}'
    }


def generate_test_recurring_transaction(
    user_id: str,
    name: str = None,
    amount: float = None,
    frequency: str = 'Monthly',
    transaction_type: str = 'Expense',
    account_type: str = 'Cash',
    category_id: int = 1,
    start_date: date = None,
    end_date: date = None
) -> Dict[str, Any]:
    """
    Generate a test recurring transaction

    Args:
        user_id: User ID for the transaction
        name: Transaction name (auto-generated if None)
        amount: Transaction amount (random if None)
        frequency: Recurrence frequency (Daily, Weekly, Monthly, Yearly)
        transaction_type: Type of transaction (Expense or Income)
        account_type: Account type
        category_id: Category ID
        start_date: Start date (today if None)
        end_date: End date (optional)

    Returns:
        Dictionary with recurring transaction data
    """
    return {
        'user_id': user_id,
        'name': name or f'Recurring {generate_random_string(5)}',
        'amount': amount or round(random.uniform(10.0, 500.0), 2),
        'frequency': frequency,
        'type': transaction_type,
        'account_type': account_type,
        'category_id': category_id,
        'start_date': (start_date or date.today()).isoformat(),
        'end_date': end_date.isoformat() if end_date else None,
        'is_active': True
    }


def generate_bulk_transactions(
    user_id: str,
    count: int = 10,
    transaction_type: str = None
) -> List[Dict[str, Any]]:
    """
    Generate multiple test transactions

    Args:
        user_id: User ID for all transactions
        count: Number of transactions to generate
        transaction_type: Type filter (None for mixed)

    Returns:
        List of transaction dictionaries
    """
    transactions = []
    types = ['Expense', 'Income'] if transaction_type is None else [transaction_type]

    for i in range(count):
        trans_type = random.choice(types)
        transactions.append(generate_test_transaction(
            user_id=user_id,
            name=f'Bulk Transaction {i+1}',
            transaction_type=trans_type,
            amount=round(random.uniform(10.0, 500.0), 2)
        ))

    return transactions


def calculate_date_range(days_back: int = 30) -> tuple[date, date]:
    """
    Calculate a date range from today going back specified days

    Args:
        days_back: Number of days to go back

    Returns:
        Tuple of (start_date, end_date)
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days_back)
    return start_date, end_date


def assert_transaction_equals(actual: Dict, expected: Dict, exclude_fields: List[str] = None):
    """
    Assert that two transaction dictionaries match

    Args:
        actual: Actual transaction data
        expected: Expected transaction data
        exclude_fields: Fields to exclude from comparison (like id, created_at)
    """
    exclude = exclude_fields or ['id', 'created_at', 'updated_at']

    for key, value in expected.items():
        if key not in exclude:
            assert key in actual, f"Field {key} missing from actual transaction"

            # Handle float comparison
            if isinstance(value, float):
                assert abs(float(actual[key]) - value) < 0.01, \
                    f"Field {key}: expected {value}, got {actual[key]}"
            else:
                assert actual[key] == value, \
                    f"Field {key}: expected {value}, got {actual[key]}"


def wait_for_condition(condition_func, timeout: int = 5, interval: float = 0.5) -> bool:
    """
    Wait for a condition to become true

    Args:
        condition_func: Function that returns True when condition is met
        timeout: Maximum seconds to wait
        interval: Seconds between checks

    Returns:
        True if condition met, False if timeout
    """
    import time
    elapsed = 0

    while elapsed < timeout:
        if condition_func():
            return True
        time.sleep(interval)
        elapsed += interval

    return False


class TestDataFactory:
    """Factory class for generating consistent test data"""

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.transaction_counter = 0
        self.recurring_counter = 0

    def create_transaction(self, **kwargs) -> Dict[str, Any]:
        """Create a transaction with auto-incrementing counter"""
        self.transaction_counter += 1
        defaults = {
            'user_id': self.user_id,
            'name': f'Transaction {self.transaction_counter}'
        }
        defaults.update(kwargs)
        return generate_test_transaction(**defaults)

    def create_recurring_transaction(self, **kwargs) -> Dict[str, Any]:
        """Create a recurring transaction with auto-incrementing counter"""
        self.recurring_counter += 1
        defaults = {
            'user_id': self.user_id,
            'name': f'Recurring {self.recurring_counter}'
        }
        defaults.update(kwargs)
        return generate_test_recurring_transaction(**defaults)

    def reset(self):
        """Reset counters"""
        self.transaction_counter = 0
        self.recurring_counter = 0
