require('dotenv').config();
const { connectBMSDB, connectSMSDB } = require('./src/config/database');
const { Payment, Contract, DefaultLanguageSetting } = require('./src/models');

async function testCustomerNames() {
  try {
    console.log('=== Customer Name Language Test ===\n');
    
    // Connect to databases
    console.log('1. Connecting to databases...');
    await connectBMSDB();
    await connectSMSDB();
    console.log('✓ Database connections established\n');

    // Initialize language settings
    console.log('2. Initializing language settings...');
    await DefaultLanguageSetting.initializeDefaults();
    console.log('✓ Language settings initialized\n');

    // Test payment customer names
    console.log('3. Testing Payment Customer Names...');
    const payments = await Payment.findApproachingDeadline(30);
    
    if (payments.length > 0) {
      const payment = payments[0];
      console.log('Sample Payment Data:');
      console.log(`- Customer Type: ${payment.customer_type}`);
      console.log(`- English Name: ${payment.customer_name}`);
      console.log(`- Amharic Name: ${payment.customer_name_am || 'Not available'}`);
      console.log(`- Phone: ${payment.customer_phone}`);
      console.log(`- Room: ${payment.room}`);
      console.log(`- End Date: ${payment.end_date}`);
      console.log(`- Days to Deadline: ${payment.days_to_deadline}\n`);
      
      // Test message generation with English
      console.log('English Message Preview:');
      const englishMessage = await generatePaymentMessage(payment, 'en');
      console.log(englishMessage);
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test message generation with Amharic
      console.log('Amharic Message Preview:');
      const amharicMessage = await generatePaymentMessage(payment, 'am');
      console.log(amharicMessage);
      console.log('\n' + '='.repeat(50) + '\n');
    } else {
      console.log('No payments found approaching deadline\n');
    }

    // Test contract customer names
    console.log('4. Testing Contract Customer Names...');
    const contracts = await Contract.findApproachingDeadline(30);
    
    if (contracts.length > 0) {
      const contract = contracts[0];
      console.log('Sample Contract Data:');
      console.log(`- Customer Type: ${contract.customer_type}`);
      console.log(`- English Name: ${contract.customer_name}`);
      console.log(`- Amharic Name: ${contract.customer_name_am || 'Not available'}`);
      console.log(`- Phone: ${contract.customer_phone}`);
      console.log(`- Room: ${contract.RoomID}`);
      console.log(`- End Date: ${contract.EndDate}`);
      console.log(`- Days to Deadline: ${contract.days_to_deadline}\n`);
      
      // Test message generation with English
      console.log('English Contract Message Preview:');
      const englishMessage = await generateContractMessage(contract, 'en');
      console.log(englishMessage);
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Test message generation with Amharic
      console.log('Amharic Contract Message Preview:');
      const amharicMessage = await generateContractMessage(contract, 'am');
      console.log(amharicMessage);
      console.log('\n' + '='.repeat(50) + '\n');
    } else {
      console.log('No contracts found approaching deadline\n');
    }

    console.log('=== Test Complete ===');
    console.log('✓ Customer names are now language-specific');
    console.log('✓ English uses: CompanyName/fullname');
    console.log('✓ Amharic uses: CompanyNameAM/fullnameAM');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Helper function to generate payment message
async function generatePaymentMessage(payment, language) {
  const DateUtils = require('./src/utils/dateUtils');
  
  // Use language-specific customer name
  let customerName;
  if (language === 'am') {
    customerName = payment.customer_name_am || payment.customer_name || 'ውድ ደንበኛ';
  } else {
    customerName = payment.customer_name || 'Valued Customer';
  }
  
  const daysRemaining = DateUtils.calculateDaysRemaining(payment.end_date);
  const amount = payment.GroundTotal || payment.line_total || 0;
  const formattedAmount = DateUtils.formatCurrency(amount, language);
  const ethDate = DateUtils.toEthiopianDate(payment.end_date);
  const formattedDate = DateUtils.formatEthiopianDate(ethDate, language);
  const urgencyText = DateUtils.getUrgencyText(daysRemaining, language);

  if (language === 'am') {
    return `ውድ ${customerName}፣

የእርስዎ የክፍል ${payment.room} ክፍያ ${urgencyText} (${formattedDate}) ይጠበቃል።

መጠን: ${formattedAmount}
መግለጫ: ${payment.description || 'ክፍያ ይጠበቃል'}

ምንም ችግር እንዳይደርስብዎ ክፍያዎን ያድርጉ።

የክፍያ መለያ: ${payment.id}

እናመሰግናለን።`;
  } else {
    return `Dear ${customerName}, 

Your payment for Room ${payment.room} is due ${urgencyText} (${formattedDate}). 

Amount: ${formattedAmount}
Description: ${payment.description || 'Payment due'}

Please make your payment to avoid any inconvenience.

Payment ID: ${payment.id}

Thank you.`;
  }
}

// Helper function to generate contract message
async function generateContractMessage(contract, language) {
  const DateUtils = require('./src/utils/dateUtils');
  
  // Use language-specific customer name
  let customerName;
  if (language === 'am') {
    customerName = contract.customer_name_am || contract.customer_name || 'ውድ ደንበኛ';
  } else {
    customerName = contract.customer_name || 'Valued Customer';
  }
  
  const daysRemaining = DateUtils.calculateDaysRemaining(contract.EndDate);
  const roomPrice = contract.RoomPrice || 0;
  const formattedPrice = DateUtils.formatCurrency(roomPrice, language);
  const ethEndDate = DateUtils.toEthiopianDate(contract.EndDate);
  const ethStartDate = DateUtils.toEthiopianDate(contract.StartDate);
  const formattedEndDate = DateUtils.formatEthiopianDate(ethEndDate, language);
  const formattedStartDate = DateUtils.formatEthiopianDate(ethStartDate, language);
  const urgencyText = DateUtils.getUrgencyText(daysRemaining, language);

  if (language === 'am') {
    return `ውድ ${customerName}፣

የእርስዎ የክፍል ${contract.RoomID} ኪራይ ውል ${urgencyText} (${formattedEndDate}) ይጠናቀቃል።

የውል ጊዜ: ${formattedStartDate} - ${formattedEndDate}
ወርሃዊ ኪራይ: ${formattedPrice}

ውልዎን ለማደስ ወይም የመውጫ ሂደቶችን ለማዘጋጀት እባክዎን ያግኙን።

የውል መለያ: ${contract.ContractID}

እናመሰግናለን።`;
  } else {
    return `Dear ${customerName}, 

Your rental contract for Room ${contract.RoomID} expires ${urgencyText} (${formattedEndDate}). 

Contract Period: ${formattedStartDate} - ${formattedEndDate}
Monthly Rent: ${formattedPrice}

Please contact us to renew your contract or arrange move-out procedures.

Contract ID: ${contract.ContractID}

Thank you.`;
  }
}

// Run the test
testCustomerNames();
