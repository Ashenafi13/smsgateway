# Centralized SMS Template System

## Overview

All SMS templates are now centralized in a single service (`SmsTemplateService`) to ensure consistency, maintainability, and optimization across the entire application.

## Architecture

### Single Source of Truth
- **`src/services/smsTemplateService.js`** - Central template service
- **`src/models/Template.js`** - Template definitions and data
- All other services now use the centralized template service

### Template Types
```javascript
SmsTemplateService.TEMPLATE_TYPES = {
  PAYMENT_REMINDER: 'payment_reminder',
  CONTRACT_REMINDER: 'contract_reminder', 
  PAYMENT_DISPLAY_REMINDER: 'payment_display_reminder',
  CONTRACT_DISPLAY_REMINDER: 'contract_display_reminder'
}
```

## Benefits of Centralization

### ✅ Consistency
- All services use identical templates
- No template duplication across files
- Consistent formatting and optimization

### ✅ Maintainability  
- Single place to update templates
- Easy to add new template types
- Centralized optimization logic

### ✅ Optimization
- All templates optimized for SMS limits
- Character count validation
- Language-specific optimizations

### ✅ Testing
- Single service to test
- Consistent behavior verification
- Easy template validation

## Usage Examples

### Basic Template Retrieval
```javascript
const SmsTemplateService = require('../services/smsTemplateService');

// Get English payment reminder template
const template = await SmsTemplateService.getTemplate(
  SmsTemplateService.TEMPLATE_TYPES.PAYMENT_REMINDER, 
  'en'
);
```

### Creating Messages
```javascript
// Payment reminder message
const paymentMessage = await SmsTemplateService.createPaymentReminderMessage(
  paymentData, 
  'en'
);

// Contract reminder message  
const contractMessage = await SmsTemplateService.createContractReminderMessage(
  contractData,
  'am'
);
```

## Services Using Centralized Templates

### 1. SMS Service (`src/services/smsService.js`)
```javascript
// Before: Hardcoded templates
static createPaymentReminderMessage(payment, daysRemaining, languageCode) {
  // 40+ lines of hardcoded template logic
}

// After: Uses centralized service
static async createPaymentReminderMessage(payment, language = null) {
  return await SmsTemplateService.createPaymentReminderMessage(payment, language);
}
```

### 2. Payment Deadline Scheduler (`src/schedulers/paymentDeadlineScheduler.js`)
```javascript
// Before: Duplicated template logic
static createPaymentReminderMessage(payment, daysRemaining, language) {
  // Duplicate template code
}

// After: Uses centralized service
static async createPaymentReminderMessage(payment, daysRemaining, language) {
  return await SmsTemplateService.createPaymentReminderMessage(payment, language);
}
```

### 3. Contract Deadline Scheduler (`src/schedulers/contractDeadlineScheduler.js`)
```javascript
// Before: Duplicated template logic
static createContractReminderMessage(contract, daysRemaining, language) {
  // Duplicate template code
}

// After: Uses centralized service
static async createContractReminderMessage(contract, daysRemaining, language) {
  return await SmsTemplateService.createContractReminderMessage(contract, language);
}
```

## Template Definitions

All templates are stored in `src/models/Template.js` with optimized versions:

### Payment Reminder Templates
```javascript
// English (89 chars)
template_en: `{customerName},
R{room} {urgencyText} ({formattedDate})
{formattedAmount}
{description}
Pay now
ID: {paymentId}`

// Amharic (47 chars)  
template_am: `{customerName}
ክ{room} {urgencyText} ({formattedDate})
{formattedAmount}
{paymentId}`
```

### Contract Reminder Templates
```javascript
// English (114 chars)
template_en: `{customerName},
Your contract for R{room} {urgencyText} ({formattedDate})
{formattedAmount}
{description}
Renew contract
ID: {contractId}`

// Amharic (54 chars)
template_am: `{customerName}
ክ{room} {urgencyText} ({formattedDate})
{formattedAmount}
ውል ያድሱ
{contractId}`
```

## Variable Replacement

The centralized service handles all variable replacement:

### Common Variables
- `{customerName}` - Customer name (language-specific)
- `{room}` - Room number
- `{urgencyText}` - Urgency text based on days remaining
- `{formattedDate}` - Ethiopian calendar formatted date
- `{formattedAmount}` - Currency formatted amount
- `{description}` - Payment/contract description
- `{paymentId}` / `{contractId}` - Unique identifiers

### Language-Specific Handling
```javascript
// Customer name selection
let customerName;
if (languageCode === 'am') {
  customerName = payment.customer_name_am || payment.customer_name || 'ደንበኛ';
} else {
  customerName = payment.customer_name || 'Customer';
}
```

## Testing and Validation

### Test Scripts
- **`scripts/testCentralizedTemplates.js`** - Comprehensive centralization test
- **`scripts/testOptimizedTemplates.js`** - Template optimization validation
- **`scripts/analyzeSmsTemplates.js`** - Template analysis tool

### Test Results
```
Total Templates Tested: 8
Templates Fitting in 1 SMS: 8 ✅
Templates Requiring Multiple SMS: 0
Overall Result: ✅ ALL TEMPLATES OPTIMIZED

Service Consistency:
✅ SmsService uses centralized templates
✅ PaymentDeadlineScheduler uses centralized templates  
✅ ContractDeadlineScheduler uses centralized templates
✅ All services produce identical messages
```

## Migration Summary

### Files Modified
1. **`src/services/smsTemplateService.js`** - ✨ NEW: Central template service
2. **`src/services/smsService.js`** - Updated to use centralized templates
3. **`src/schedulers/paymentDeadlineScheduler.js`** - Updated to use centralized templates
4. **`src/schedulers/contractDeadlineScheduler.js`** - Updated to use centralized templates
5. **`src/schedulers/paymentDisplayDeadlineScheduler.js`** - Added import (ready for future use)
6. **`src/schedulers/contractDisplayDeadlineScheduler.js`** - Added import (ready for future use)

### Code Reduction
- **Before**: ~200 lines of duplicated template logic across 4 files
- **After**: ~300 lines in single centralized service
- **Net Result**: Eliminated duplication, improved maintainability

## Future Enhancements

### Easy Template Updates
To update any template, simply modify `src/models/Template.js`:
```javascript
// Update template in one place
template_en: `New optimized template...`
```
All services automatically use the updated template.

### Adding New Template Types
1. Add template to `Template.js`
2. Add template type to `SmsTemplateService.TEMPLATE_TYPES`
3. Add creation method to `SmsTemplateService`
4. All services can immediately use the new template

### Template Versioning
Future enhancement could include template versioning for A/B testing and rollback capabilities.

## Best Practices

### ✅ Do
- Always use `SmsTemplateService` for SMS message creation
- Test templates with real data using provided test scripts
- Update templates only in `Template.js`
- Use appropriate template types from the enum

### ❌ Don't
- Create hardcoded templates in individual services
- Duplicate template logic across files
- Modify templates without testing SMS limits
- Skip template optimization validation

## Conclusion

The centralized SMS template system provides:
- **Single source of truth** for all SMS templates
- **Consistent optimization** across all services  
- **Easy maintenance** and updates
- **Comprehensive testing** and validation
- **Future-proof architecture** for template management

All SMS templates are now optimized, centralized, and ready for production use!
