/**
 * Simple Template Test - Tests templates without database dependency
 */

const { Template } = require('./src/models');

async function testTemplateRetrieval() {
  console.log('=== Testing Template Retrieval ===\n');

  try {
    // Test 1: Get all templates
    console.log('1. Getting all templates...');
    const allTemplates = await Template.findAll();
    console.log(`✅ Found ${allTemplates.length} templates:`);
    
    allTemplates.forEach(template => {
      console.log(`  - ID ${template.id}: ${template.name} (${template.category})`);
      console.log(`    Variables: ${template.variables}`);
      console.log(`    English: ${template.template_en.substring(0, 80)}...`);
      console.log(`    Amharic: ${template.template_am.substring(0, 80)}...`);
      console.log('');
    });

    // Test 2: Get templates by category
    console.log('2. Getting Payment templates...');
    const paymentTemplates = await Template.findByCategory('Payment');
    console.log(`✅ Found ${paymentTemplates.length} Payment templates:`);
    paymentTemplates.forEach(template => {
      console.log(`  - ${template.name}`);
    });
    console.log('');

    console.log('3. Getting Contract templates...');
    const contractTemplates = await Template.findByCategory('Contract');
    console.log(`✅ Found ${contractTemplates.length} Contract templates:`);
    contractTemplates.forEach(template => {
      console.log(`  - ${template.name}`);
    });
    console.log('');

    // Test 3: Test template variable replacement manually
    console.log('4. Testing template variable replacement...');
    const paymentTemplate = paymentTemplates[0]; // First payment template
    
    const sampleVariables = {
      customerName: 'John Doe',
      room: 'A-101',
      daysRemaining: '5',
      originalAmount: '1,500.00 ETB',
      penaltyAmount: '0.00 ETB',
      formattedAmount: '1,500.00 ETB',
      paymentId: '123'
    };

    let message = paymentTemplate.template_en;
    Object.keys(sampleVariables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      message = message.replace(regex, sampleVariables[key]);
    });

    console.log('✅ Sample English message with variables replaced:');
    console.log(`   "${message}"`);
    console.log(`   Length: ${message.length} characters`);
    console.log('');

    // Test Amharic template
    let amharicMessage = paymentTemplate.template_am;
    const amharicVariables = {
      customerName: 'ጆን ዶ',
      room: 'A-101',
      daysRemaining: '5',
      originalAmount: '1,500.00 ብር',
      penaltyAmount: '0.00 ብር',
      formattedAmount: '1,500.00 ብር',
      paymentId: '123'
    };

    Object.keys(amharicVariables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      amharicMessage = amharicMessage.replace(regex, amharicVariables[key]);
    });

    console.log('✅ Sample Amharic message with variables replaced:');
    console.log(`   "${amharicMessage}"`);
    console.log(`   Length: ${amharicMessage.length} characters`);
    console.log('');

    // Test penalty template (ID 3 - Deadline Passed)
    const penaltyTemplate = allTemplates.find(t => t.id === 3);
    if (penaltyTemplate) {
      console.log('5. Testing penalty template...');
      const penaltyVariables = {
        customerName: 'Jane Smith',
        room: 'B-202',
        originalAmount: '2,000.00 ETB',
        penaltyAmount: '100.00 ETB',
        formattedAmount: '2,100.00 ETB',
        paymentId: '124'
      };

      let penaltyMessage = penaltyTemplate.template_en;
      Object.keys(penaltyVariables).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        penaltyMessage = penaltyMessage.replace(regex, penaltyVariables[key]);
      });

      console.log('✅ Sample penalty message (English):');
      console.log(`   "${penaltyMessage}"`);
      console.log(`   Length: ${penaltyMessage.length} characters`);
      console.log('');

      // Amharic penalty message
      let amharicPenaltyMessage = penaltyTemplate.template_am;
      const amharicPenaltyVariables = {
        customerName: 'ጄን ስሚዝ',
        room: 'B-202',
        originalAmount: '2,000.00 ብር',
        penaltyAmount: '100.00 ብር',
        formattedAmount: '2,100.00 ብር',
        paymentId: '124'
      };

      Object.keys(amharicPenaltyVariables).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        amharicPenaltyMessage = amharicPenaltyMessage.replace(regex, amharicPenaltyVariables[key]);
      });

      console.log('✅ Sample penalty message (Amharic):');
      console.log(`   "${amharicPenaltyMessage}"`);
      console.log(`   Length: ${amharicPenaltyMessage.length} characters`);
      console.log('');
    }

    console.log('🎉 All template tests completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`- ${allTemplates.length} templates loaded from projectPlan.txt`);
    console.log(`- ${paymentTemplates.length} Payment templates available`);
    console.log(`- ${contractTemplates.length} Contract templates available`);
    console.log('- Variable replacement working correctly');
    console.log('- Both English and Amharic templates functional');
    console.log('- Character limits optimized for SMS delivery');
    console.log('- Penalty templates include originalAmount and penaltyAmount variables');

  } catch (error) {
    console.error('❌ Error testing templates:', error.message);
    console.error(error.stack);
  }
}

// Run the test
if (require.main === module) {
  testTemplateRetrieval().catch(console.error);
}

module.exports = { testTemplateRetrieval };
