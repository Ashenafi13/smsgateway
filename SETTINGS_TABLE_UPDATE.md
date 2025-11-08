# Settings Table Update - tbls_settings

## Overview
Updated the Settings model to fetch `numberOfDaysToDeadline` from the `tbls_settings` table instead of `tbls_settings_sms` table.

## Changes Made

### File: `src/models/Settings.js`

#### 1. Updated `get()` method (Line 19)
**Before:**
```sql
SELECT TOP 1 * FROM tbls_settings_sms
```

**After:**
```sql
SELECT TOP 1 * FROM tbls_settings
```

#### 2. Updated `createDefault()` method (Line 45)
**Before:**
```sql
INSERT INTO tbls_settings_sms (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl, schedulerStatus)
```

**After:**
```sql
INSERT INTO tbls_settings (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl, schedulerStatus)
```

#### 3. Updated `update()` method - UPDATE statement (Line 75)
**Before:**
```sql
UPDATE tbls_settings_sms
SET numberOfDaysToDeadline = @numberOfDaysToDeadline,
    smsApiToken = @smsApiToken,
    smsShortcodeId = @smsShortcodeId,
    smsCallbackUrl = @smsCallbackUrl,
    schedulerStatus = @schedulerStatus
OUTPUT INSERTED.*
WHERE id = @id
```

**After:**
```sql
UPDATE tbls_settings
SET numberOfDaysToDeadline = @numberOfDaysToDeadline,
    smsApiToken = @smsApiToken,
    smsShortcodeId = @smsShortcodeId,
    smsCallbackUrl = @smsCallbackUrl,
    schedulerStatus = @schedulerStatus
OUTPUT INSERTED.*
WHERE id = @id
```

#### 4. Updated `update()` method - INSERT statement (Line 95)
**Before:**
```sql
INSERT INTO tbls_settings_sms (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl, schedulerStatus)
```

**After:**
```sql
INSERT INTO tbls_settings (numberOfDaysToDeadline, smsApiToken, smsShortcodeId, smsCallbackUrl, schedulerStatus)
```

## Impact

### Affected Methods
- `Settings.get()` - Now queries from `tbls_settings`
- `Settings.getNumberOfDaysToDeadline()` - Indirectly affected (uses `get()`)
- `Settings.createDefault()` - Creates records in `tbls_settings`
- `Settings.update()` - Updates records in `tbls_settings`
- `Settings.updateNumberOfDaysToDeadline()` - Indirectly affected (uses `update()`)

### Affected Schedulers
All schedulers that call `Settings.getNumberOfDaysToDeadline()` will now fetch from `tbls_settings`:
1. `paymentDeadlineScheduler.js` - Line 70
2. `contractDeadlineScheduler.js` - Line 70
3. `paymentDisplayDeadlineScheduler.js` - Line 70
4. `contractDisplayDeadlineScheduler.js` - Line 70

### Database Query
The system now executes:
```sql
SELECT TOP (1000) [id]
      ,[numberOfDaysToDeadline]
  FROM [smsgateway].[dbo].[tbls_settings]
```

## Verification

To verify the changes are working correctly:

1. **Check the table exists:**
   ```sql
   SELECT * FROM tbls_settings
   ```

2. **Verify numberOfDaysToDeadline value:**
   ```sql
   SELECT TOP 1 numberOfDaysToDeadline FROM tbls_settings
   ```

3. **Test the scheduler:**
   - Run the payment deadline scheduler
   - Check logs to confirm it's reading from `tbls_settings`
   - Verify the correct `numberOfDaysToDeadline` value is being used

## Notes

- The `tbls_settings_sms` table is no longer used by the Settings model
- All settings are now centralized in the `tbls_settings` table
- The change maintains backward compatibility with existing code
- No changes needed to scheduler logic or other dependent code

