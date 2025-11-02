# SMS Gateway System

A comprehensive SMS Gateway system for monitoring payment and contract deadlines, automatically scheduling SMS notifications, and providing real-time analytics through Socket.IO.

## Features

- **Auto Scheduler**: Monitors payment and contract deadlines and creates SMS jobs
- **SMS Management**: Complete SMS job scheduling, execution, and history tracking
- **Customer Management**: Unified customer API for both individual and company customers
- **Real-time Analytics**: Socket.IO powered real-time SMS statistics and scheduler status
- **Authentication**: JWT-based user authentication with role-based access
- **Database Integration**: Connects to both BMS and SMS Gateway MSSQL databases

## Architecture

The system follows MVC (Model-View-Controller) architecture with:
- **Models**: Database interaction layer for both BMS and SMS Gateway databases
- **Services**: Business logic layer
- **Controllers**: Request handling and response formatting
- **Middleware**: Authentication, validation, and error handling
- **Schedulers**: Automated background tasks for deadline monitoring and SMS execution
- **Socket.IO**: Real-time communication for live updates

## Prerequisites

- Node.js (v18 or higher)
- MSSQL Server with BMS and SMS Gateway databases
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smsgateway
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# BMS Database Configuration
BMS_DB_SERVER=your_bms_server
BMS_DB_DATABASE=BMS
BMS_DB_USER=your_bms_username
BMS_DB_PASSWORD=your_bms_password
BMS_DB_PORT=1433
BMS_DB_ENCRYPT=true
BMS_DB_TRUST_SERVER_CERTIFICATE=true

# SMS Gateway Database Configuration
SMS_DB_SERVER=your_sms_server
SMS_DB_DATABASE=smsgateway
SMS_DB_USER=your_sms_username
SMS_DB_PASSWORD=your_sms_password
SMS_DB_PORT=1433
SMS_DB_ENCRYPT=true
SMS_DB_TRUST_SERVER_CERTIFICATE=true

# Scheduler Configuration
SCHEDULER_ENABLED=true
DEADLINE_CHECK_CRON=0 9 * * *
SMS_EXECUTION_CRON=0 */5 * * * *
```

## Database Setup

### BMS Database Tables Required:
- `payment` - Payment records
- `paymentDisplay` - Payment display records
- `Contract` - Contract records
- `ContractDisplay` - Contract display records
- `company_profile` - Company customer profiles
- `individual_renters` - Individual customer profiles

### SMS Gateway Database Tables Required:
- `tbls_users` - User authentication
- `tbls_sms_scheduler_jobs` - SMS job scheduling
- `tbls_sms_history` - SMS sending history
- `tbls_settings` - System settings

## Running the Application

### Development Mode:
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on the configured port (default: 3000) and you can access:
- API: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`

## SMS Configuration

The system uses GeezSMS API for sending SMS messages. To configure SMS settings:

### 1. Configure SMS Settings via API

Use the following endpoints to configure SMS settings:

```bash
# Get current SMS settings
GET /api/settings/sms

# Update SMS settings
PUT /api/settings/sms
{
  "smsApiToken": "your-geezsms-api-token",
  "smsShortcodeId": "your-shortcode-id", // optional
  "smsCallbackUrl": "https://your-domain.com/callback" // optional
}
```

### 2. GeezSMS API Configuration

The system integrates with GeezSMS API using the following parameters:
- **token**: Your GeezSMS API token (required)
- **phone**: Recipient phone number (automatically set)
- **msg**: Message content (automatically set)
- **shortcode_id**: Optional shortcode ID for branded SMS
- **callback**: Optional callback URL for delivery notifications

### 3. Testing SMS Functionality

Run the test script to verify SMS configuration:

```bash
node test_sms.js
```

This will test:
- Settings retrieval
- SMS configuration updates
- SMS sending functionality

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify JWT token

### Customer Management
- `GET /api/customers` - Get all customers
- `GET /api/customers/individuals` - Get individual customers
- `GET /api/customers/companies` - Get company customers
- `GET /api/customers/search?q=term` - Search customers
- `GET /api/customers/:type/:id` - Get customer by ID and type
- `GET /api/customers/:type/:id/history` - Get customer full history

### SMS Management
- `POST /api/sms/jobs` - Create SMS job
- `GET /api/sms/jobs` - Get all SMS jobs
- `GET /api/sms/jobs/:id` - Get SMS job by ID
- `PUT /api/sms/jobs/:id/status` - Update job status
- `POST /api/sms/jobs/:id/process` - Process SMS job
- `GET /api/sms/history` - Get SMS history

### Settings
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/days-to-deadline` - Get deadline days setting

### Scheduler Management
- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/trigger/payment-check` - Trigger payment check
- `POST /api/scheduler/trigger/contract-check` - Trigger contract check
- `POST /api/scheduler/trigger/sms-execution` - Trigger SMS execution

## Socket.IO Events

### Client to Server:
- `authenticate` - Authenticate with user credentials
- `subscribe_sms_stats` - Subscribe to SMS statistics
- `subscribe_scheduler_status` - Subscribe to scheduler status
- `get_current_stats` - Request current statistics

### Server to Client:
- `sms_statistics` - Real-time SMS statistics
- `scheduler_status` - Scheduler status updates
- `sms_event` - Real-time SMS events

## Schedulers

The system includes three automated schedulers:

1. **Payment Deadline Scheduler**: Runs daily at 9 AM, checks for payments approaching deadline
2. **Contract Deadline Scheduler**: Runs daily at 9 AM, checks for contracts approaching expiration
3. **SMS Execution Scheduler**: Runs every 5 minutes, processes pending SMS jobs

## Development

### Project Structure:
```
src/
├── config/          # Database configurations
├── controllers/     # Request handlers
├── middleware/      # Authentication, validation, error handling
├── models/          # Database models
├── routes/          # API routes
├── schedulers/      # Background job schedulers
├── services/        # Business logic
└── utils/           # Utility functions and Socket.IO handlers
```

### Adding New Features:
1. Create model in `src/models/`
2. Create service in `src/services/`
3. Create controller in `src/controllers/`
4. Add routes in `src/routes/`
5. Add validation in `src/middleware/validation.js`

## Testing

To test the system:

1. Start the server in development mode
2. Use the health check endpoint to verify the server is running
3. Register a user via `/api/auth/register`
4. Login to get a JWT token
5. Use the token to access protected endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
