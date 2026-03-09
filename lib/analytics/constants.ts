/**
 * PostHog Event Constants
 * Centralized event naming for product analytics
 */

// App lifecycle events
export const EVENT_APP_OPENED = 'app_opened'

// Page view events
export const EVENT_DASHBOARD_VIEWED = 'dashboard_viewed'
export const EVENT_TRANSACTIONS_PAGE_VIEWED = 'transactions_page_viewed'
export const EVENT_RECURRING_PAGE_VIEWED = 'recurring_page_viewed'
export const EVENT_MERCHANTS_PAGE_VIEWED = 'merchants_page_viewed'
export const EVENT_CATEGORIES_PAGE_VIEWED = 'categories_page_viewed'
export const EVENT_FEEDBACK_PAGE_VIEWED = 'feedback_page_viewed'

// Transaction events
export const EVENT_TRANSACTION_CREATED = 'transaction_created'
export const EVENT_TRANSACTION_UPDATED = 'transaction_updated'
export const EVENT_TRANSACTION_DELETED = 'transaction_deleted'

// Recurring events
export const EVENT_RECURRING_CREATED = 'recurring_created'
export const EVENT_RECURRING_UPDATED = 'recurring_updated'
export const EVENT_RECURRING_DELETED = 'recurring_deleted'
export const EVENT_RECURRING_GENERATED = 'recurring_generated'

// Merchant events
export const EVENT_MERCHANTS_BACKFILL_RUN = 'merchants_backfill_run'

// Category events
export const EVENT_CATEGORY_CREATED = 'category_created'
export const EVENT_CATEGORY_DELETED = 'category_deleted'

// Balance events
export const EVENT_BALANCE_UPDATED = 'balance_updated'
export const EVENT_BALANCE_HISTORY_VIEWED = 'balance_history_viewed'

// CSV import events
export const EVENT_CSV_IMPORT_STARTED = 'csv_import_started'
export const EVENT_CSV_IMPORT_COMPLETED = 'csv_import_completed'
export const EVENT_CSV_IMPORT_FAILED = 'csv_import_failed'

// Feedback events
export const EVENT_ISSUE_REPORT_SUBMITTED = 'issue_report_submitted'
export const EVENT_FEATURE_REQUEST_SUBMITTED = 'feature_request_submitted'

// All events for reference
export const ANALYTICS_EVENTS = [
  EVENT_APP_OPENED,
  EVENT_DASHBOARD_VIEWED,
  EVENT_TRANSACTIONS_PAGE_VIEWED,
  EVENT_TRANSACTION_CREATED,
  EVENT_TRANSACTION_UPDATED,
  EVENT_TRANSACTION_DELETED,
  EVENT_RECURRING_PAGE_VIEWED,
  EVENT_RECURRING_CREATED,
  EVENT_RECURRING_UPDATED,
  EVENT_RECURRING_DELETED,
  EVENT_RECURRING_GENERATED,
  EVENT_MERCHANTS_PAGE_VIEWED,
  EVENT_MERCHANTS_BACKFILL_RUN,
  EVENT_CATEGORIES_PAGE_VIEWED,
  EVENT_CATEGORY_CREATED,
  EVENT_CATEGORY_DELETED,
  EVENT_BALANCE_UPDATED,
  EVENT_BALANCE_HISTORY_VIEWED,
  EVENT_CSV_IMPORT_STARTED,
  EVENT_CSV_IMPORT_COMPLETED,
  EVENT_CSV_IMPORT_FAILED,
  EVENT_FEEDBACK_PAGE_VIEWED,
  EVENT_ISSUE_REPORT_SUBMITTED,
  EVENT_FEATURE_REQUEST_SUBMITTED,
] as const

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[number]
