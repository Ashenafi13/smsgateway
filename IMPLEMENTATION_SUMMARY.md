# SMS Gateway Implementation Summary

## Overview
This document summarizes the implementation of three key requirements for the SMS Gateway system:
1. Limit SMS to 2 per customer (one before deadline, one after deadline)
2. Update SMS templates to remove money/amount information
3. Move scheduler time settings from .env to database

---

## Requirement 1: Limit SMS to 2 per Customer

### Changes Made:

#### 1.1 Database Schema Updates (migrate-sms-tracking.js)
- Added `sms_type` column to `tbls_sms_scheduler_jobs` (VARCHAR(50))
  - Values: 'before_deadline' or 'after_deadline'
- Added `customer_id` column to track which customer received SMS
- Added `customer_type` column to track customer type (com/ind)
- Created `tbls_settings_scheduler` table with scheduler configurations

#### 1.2 SmsSchedulerJob Model Updates (src/models/SmsSchedulerJob.js)
- Added new fields to constructor:
  - `sms_type`: Tracks whether SMS is before or after deadline
  - `customer_id`: Customer identifier
  - `customer_type`: Customer type (company/individual)
- Updated `create()` method to insert new fields
- Added `findByCustomerAndSmsType()` method to find SMS by customer and type
- Added `hasSentSmsForCustomer()` method to check if SMS already sent

#### 1.3 Scheduler Logic Updates

**Key Logic:**
- SMS is sent ONLY when `days_to_deadline == numberOfDaysToDeadline` (exactly at threshold)
- SMS is sent ONLY when `days_to_deadline < 0` (after deadline has passed)
- SMS is NOT sent for intermediate days (e.g., if threshold is 7 days, SMS not sent on days 6, 5, 4, etc.)

**Updated Schedulers:**
1. `paymentDeadlineScheduler.js`
   - Updated `createConsolidatedPaymentReminderJob()` to accept `daysToDeadline` parameter
   - Checks exact threshold match before creating SMS job
   - Includes `sms_type`, `customer_id`, `customer_type` in job creation

2. `contractDeadlineScheduler.js`
   - Same logic as payment scheduler
   - Updated `createConsolidatedContractReminderJob()` method

3. `paymentDisplayDeadlineScheduler.js`
   - Updated to use same threshold-based logic
   - Replaced old "pending job" check with `hasSentSmsForCustomer()` method

4. `contractDisplayDeadlineScheduler.js`
   - Updated to use same threshold-based logic
   - Includes SMS type tracking

---

## Requirement 2: Update SMS Templates

### Changes Made (src/models/Template.js):

All 8 templates updated to remove `{formattedAmount}` variable:

1. **Payment Reminder - Deadline Approaching**
   - Removed: Amount information
   - Added: Room number, days remaining
   - Character count: EN 113 chars, AM 59 chars ✓

2. **Payment Reminder - Deadline Approaching (Alternative)**
   - Removed: Amount information
   - Added: Room number, days remaining
   - Character count: EN 118 chars, AM 59 chars ✓

3. **Payment Reminder - Deadline Passed**
   - Removed: Amount information
   - Added: Room number, urgency
   - Character count: EN 105 chars, AM 54 chars ✓

4. **Payment Reminder - Deadline Passed (Alternative)**
   - Removed: Amount information
   - Added: Room number, urgency
   - Character count: EN 110 chars, AM 54 chars ✓

5. **Contract Reminder - Deadline Approaching**
   - Removed: Amount information
   - Added: Room number, days remaining
   - Character count: EN 127 chars, AM 59 chars ✓

6. **Contract Reminder - Deadline Approaching (Alternative)**
   - Removed: Amount information
   - Added: Room number, days remaining
   - Character count: EN 124 chars, AM 59 chars ✓

7. **Contract Reminder - Deadline Passed**
   - Removed: Amount information
   - Added: Room number, urgency
   - Character count: EN 119 chars, AM 54 chars ✓

8. **Contract Reminder - Deadline Passed (Alternative)**
   - Removed: Amount information
   - Added: Room number, urgency
   - Character count: EN 115 chars, AM 54 chars ✓

**All templates comply with character limits: English 159, Amharic 69**

---

## Requirement 3: Move Scheduler Time from .env to Database

### Changes Made:

#### 3.1 Settings Model Updates (src/models/Settings.js)
Added new methods:
- `getSchedulerSetting(schedulerName)`: Get scheduler settings by name
- `getAllSchedulerSettings()`: Get all scheduler settings
- `updateSchedulerSetting(schedulerName, cronExpression, isActive)`: Update scheduler settings

#### 3.2 Database Table (tbls_settings_scheduler)
Columns:
- `scheduler_name`: VARCHAR(100) - Unique scheduler identifier
- `cron_expression`: VARCHAR(100) - Cron expression for scheduling
- `description`: VARCHAR(255) - Description of scheduler
- `is_active`: INT - 1 for active, 0 for inactive
- `createdAt`: DATETIME - Creation timestamp
- `updatedAt`: DATETIME - Last update timestamp

Default Schedulers:
1. `payment_deadline_check` - Default: '0 9 * * *' (9 AM daily)
2. `contract_deadline_check` - Default: '0 9 * * *' (9 AM daily)
3. `payment_display_deadline_check` - Default: '*/30 * * * * *' (every 30 seconds)
4. `contract_display_deadline_check` - Default: '*/30 * * * * *' (every 30 seconds)
5. `sms_execution` - Default: '0 */5 * * * *' (every 5 minutes)

#### 3.3 Scheduler Updates
All 5 schedulers updated to read cron expressions from database:
1. `paymentDeadlineScheduler.js` - Async `start()` method
2. `contractDeadlineScheduler.js` - Async `start()` method
3. `paymentDisplayDeadlineScheduler.js` - Async `start()` method
4. `contractDisplayDeadlineScheduler.js` - Async `start()` method
5. `smsExecutionScheduler.js` - Async `start()` method

**Fallback Logic:**
- If database settings unavailable, falls back to environment variables
- If environment variables unavailable, uses hardcoded defaults

#### 3.4 Scheduler Initialization (src/schedulers/index.js)
- Updated `initializeSchedulers()` to await async `start()` methods
- All scheduler start calls now use `await`

---

## Testing Recommendations

1. **Test SMS Threshold Logic:**
   - Set `numberOfDaysToDeadline` to 7
   - Create payment with deadline 7 days from now
   - Verify SMS sent exactly on day 7
   - Verify SMS NOT sent on days 6, 5, 4, etc.
   - Verify SMS sent after deadline passes

2. **Test Template Character Limits:**
   - Verify all templates are within 159 chars (English) and 69 chars (Amharic)
   - Verify no `{formattedAmount}` placeholders remain

3. **Test Database Scheduler Settings:**
   - Verify schedulers read cron expressions from database
   - Update cron expression in database and verify scheduler uses new value
   - Verify fallback to environment variables works

---

## Files Modified

1. `src/models/SmsSchedulerJob.js` - Added SMS tracking fields and methods
2. `src/models/Template.js` - Updated all 8 SMS templates
3. `src/models/Settings.js` - Added scheduler settings methods
4. `src/schedulers/paymentDeadlineScheduler.js` - Threshold-based SMS logic
5. `src/schedulers/contractDeadlineScheduler.js` - Threshold-based SMS logic
6. `src/schedulers/paymentDisplayDeadlineScheduler.js` - Threshold-based SMS logic
7. `src/schedulers/contractDisplayDeadlineScheduler.js` - Threshold-based SMS logic
8. `src/schedulers/smsExecutionScheduler.js` - Database cron reading
9. `src/schedulers/index.js` - Async scheduler initialization

## Files Created

1. `migrate-sms-tracking.js` - Database migration script

---

## Key Implementation Details

### SMS Type Determination Logic
```javascript
if (customerGroup.earliestDaysToDeadline === daysToDeadline) {
  smsType = 'before_deadline';  // Exactly at threshold
} else if (customerGroup.earliestDaysToDeadline < 0) {
  smsType = 'after_deadline';   // Past deadline
} else {
  // Skip - not at trigger point
  return;
}
```

### Duplicate Prevention
- Uses `hasSentSmsForCustomer()` to check if SMS already sent
- Checks by: customer_id + customer_type + job_type + sms_type
- Prevents duplicate SMS for same customer and SMS type

### Database Fallback
- Tries to load from database first
- Falls back to environment variables if database unavailable
- Logs warnings when fallback occurs

