const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

let authToken = '';

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, params = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      params
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetTemplateInfo() {
  try {
    console.log('\n📝 Testing template info...');
    const result = await makeRequest('GET', '/templates/info');
    console.log('✅ Template info result:', result.message);
    console.log('ℹ️ Info:', result.info);
  } catch (error) {
    console.log('❌ Failed to get template info');
  }
}

async function testGetAllTemplates() {
  try {
    console.log('\n📋 Testing get all templates...');
    
    // Test without language filter
    const allTemplates = await makeRequest('GET', '/templates');
    console.log(`✅ Found ${allTemplates.data.length} templates (both languages)`);
    
    // Test with English filter
    const englishTemplates = await makeRequest('GET', '/templates', null, { language: 'en' });
    console.log(`✅ Found ${englishTemplates.data.length} English templates`);
    
    // Test with Amharic filter
    const amharicTemplates = await makeRequest('GET', '/templates', null, { language: 'am' });
    console.log(`✅ Found ${amharicTemplates.data.length} Amharic templates`);
    
    return allTemplates.data;
  } catch (error) {
    console.error('❌ Failed to get templates');
    throw error;
  }
}

async function testGetTemplatesForDisplay() {
  try {
    console.log('\n🎨 Testing get templates for display...');
    
    // Test English display format
    const englishDisplay = await makeRequest('GET', '/templates/display', null, { language: 'en' });
    console.log('✅ English display format:', {
      totalTemplates: englishDisplay.data.templates.length,
      categories: Object.keys(englishDisplay.data.grouped),
      language: englishDisplay.data.language
    });
    
    // Test Amharic display format
    const amharicDisplay = await makeRequest('GET', '/templates/display', null, { language: 'am' });
    console.log('✅ Amharic display format:', {
      totalTemplates: amharicDisplay.data.templates.length,
      categories: Object.keys(amharicDisplay.data.grouped),
      language: amharicDisplay.data.language
    });
    
    return englishDisplay.data;
  } catch (error) {
    console.error('❌ Failed to get templates for display');
    throw error;
  }
}

async function testGetCategories() {
  try {
    console.log('\n📂 Testing get template categories...');
    const categories = await makeRequest('GET', '/templates/categories');
    console.log('✅ Template categories:', categories.data.map(cat => `${cat.category} (${cat.template_count} templates)`));
    return categories.data;
  } catch (error) {
    console.error('❌ Failed to get categories');
    throw error;
  }
}

async function testGetStatistics() {
  try {
    console.log('\n📊 Testing get template statistics...');
    const stats = await makeRequest('GET', '/templates/statistics');
    console.log('✅ Template statistics:', stats.data);
    return stats.data;
  } catch (error) {
    console.error('❌ Failed to get statistics');
    throw error;
  }
}

async function testGetTemplatesByCategory(categories) {
  try {
    console.log('\n🏷️ Testing get templates by category...');
    
    if (categories && categories.length > 0) {
      const category = categories[0].category;
      const templates = await makeRequest('GET', `/templates/category/${category}`, null, { language: 'en' });
      console.log(`✅ Found ${templates.data.length} templates in category '${category}'`);
      return templates.data;
    }
  } catch (error) {
    console.error('❌ Failed to get templates by category');
    throw error;
  }
}

async function testGetTemplateById(templates) {
  try {
    console.log('\n🔍 Testing get template by ID...');
    
    if (templates && templates.length > 0) {
      const templateId = templates[0].id;
      
      // Test English
      const englishTemplate = await makeRequest('GET', `/templates/${templateId}`, null, { language: 'en' });
      console.log(`✅ Got template ${templateId} in English:`, englishTemplate.data.name);
      
      // Test Amharic
      const amharicTemplate = await makeRequest('GET', `/templates/${templateId}`, null, { language: 'am' });
      console.log(`✅ Got template ${templateId} in Amharic:`, amharicTemplate.data.name);
      
      return englishTemplate.data;
    }
  } catch (error) {
    console.error('❌ Failed to get template by ID');
    throw error;
  }
}

async function testTemplatePreview(template) {
  try {
    console.log('\n👁️ Testing template preview...');
    
    if (template && template.variables) {
      const variables = {};
      const varList = template.variables.split(',');
      
      // Create sample variables
      varList.forEach(variable => {
        const varName = variable.trim();
        switch (varName) {
          case 'amount':
            variables[varName] = '5000 ETB';
            break;
          case 'due_date':
          case 'final_date':
          case 'date':
            variables[varName] = '2025-10-20';
            break;
          case 'late_fee':
            variables[varName] = '500 ETB';
            break;
          case 'service':
            variables[varName] = 'elevator';
            break;
          case 'start_time':
            variables[varName] = '09:00 AM';
            break;
          case 'end_time':
            variables[varName] = '05:00 PM';
            break;
          case 'emergency_details':
            variables[varName] = 'Fire alarm test in progress';
            break;
          default:
            variables[varName] = `sample_${varName}`;
        }
      });
      
      // Test English preview
      const englishPreview = await makeRequest('POST', `/templates/${template.id}/preview`, variables, { language: 'en' });
      console.log('✅ English preview:', englishPreview.data.preview_text);
      
      // Test Amharic preview
      const amharicPreview = await makeRequest('POST', `/templates/${template.id}/preview`, variables, { language: 'am' });
      console.log('✅ Amharic preview:', amharicPreview.data.preview_text);
    }
  } catch (error) {
    console.error('❌ Failed to generate template preview');
    throw error;
  }
}

async function testIncrementUsage(template) {
  try {
    console.log('\n📈 Testing increment template usage...');
    
    if (template) {
      const result = await makeRequest('POST', `/templates/${template.id}/use`);
      console.log(`✅ Incremented usage for template ${template.id}:`, result.message);
    }
  } catch (error) {
    console.error('❌ Failed to increment template usage');
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting SMS Template API Tests...\n');
  
  try {
    // Authenticate
    const authenticated = await authenticate();
    if (!authenticated) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    // Get template info
    await testGetTemplateInfo();
    
    // Test all template endpoints
    const templates = await testGetAllTemplates();
    const displayData = await testGetTemplatesForDisplay();
    const categories = await testGetCategories();
    const statistics = await testGetStatistics();
    
    await testGetTemplatesByCategory(categories);
    const template = await testGetTemplateById(templates);
    await testTemplatePreview(template);
    await testIncrementUsage(template);
    
    // Final statistics check
    console.log('\n📊 Final statistics check...');
    await testGetStatistics();
    
    console.log('\n🎉 All template API tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
