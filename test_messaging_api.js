#!/usr/bin/env node

/**
 * KoraBuild Admin Dashboard - Messaging API Test
 * Tests message creation, conversation management, and error handling
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

console.log('🧪 Starting KoraBuild Messaging API Tests');
console.log('📍 API Base URL:', API_BASE);
console.log('🕐 Test started at:', new Date().toISOString());
console.log('─'.repeat(80));

/**
 * Test messaging API functionality
 */
async function testMessagingAPI() {
  const results = {
    tests: [],
    passed: 0,
    failed: 0,
    startTime: Date.now()
  };

  // Test 1: Get conversations list to find a valid conversation ID
  console.log('\n🔍 Test 1: Getting communications data to find conversation ID...');
  try {
    const response = await fetch(`${API_BASE}/api/communications?limit=10&offset=0&type=all`);
    const data = await response.json();
    
    // Fix: Check for conversations directly since the API doesn't return data.success structure
    if (response.ok && data.conversations && data.conversations.length > 0) {
      const conversation = data.conversations[0];
      const conversationId = conversation.id;
      
      console.log('✅ Test 1 PASSED: Found conversations');
      console.log('📋 Using conversation:', {
        id: conversationId,
        name: conversation.conversation_name, // Fix: use conversation_name instead of name
        participants: conversation.participants?.length || 0
      });
      
      results.tests.push({
        name: 'Get conversations',
        status: 'PASSED',
        details: `Found ${data.conversations.length} conversations`
      });
      results.passed++;

      // Test 2: Get existing messages for the conversation
      console.log('\n📨 Test 2: Getting existing messages for conversation...');
      const messagesResponse = await fetch(`${API_BASE}/api/communications/messages?conversationId=${conversationId}`);
      const messagesData = await messagesResponse.json();
      
      if (messagesResponse.ok) {
        console.log('✅ Test 2 PASSED: Retrieved existing messages');
        console.log('📊 Messages found:', messagesData.messages?.length || 0);
        
        results.tests.push({
          name: 'Get existing messages',
          status: 'PASSED',
          details: `Found ${messagesData.messages?.length || 0} existing messages`
        });
        results.passed++;
      } else {
        console.log('❌ Test 2 FAILED: Could not retrieve messages');
        console.log('Error:', messagesData);
        results.tests.push({
          name: 'Get existing messages',
          status: 'FAILED',
          details: messagesData.error || 'Unknown error'
        });
        results.failed++;
      }

      // Test 3: Send a test message
      console.log('\n📤 Test 3: Sending test message...');
      const testMessage = {
        action: 'send_message',
        conversationId: conversationId,
        content: `Test message from API test script - ${new Date().toLocaleString()}`,
        messageType: 'text'
      };

      console.log('📋 Sending message payload:', {
        action: testMessage.action,
        conversationId: testMessage.conversationId,
        content: testMessage.content.substring(0, 50) + '...',
        messageType: testMessage.messageType
      });

      const sendResponse = await fetch(`${API_BASE}/api/communications/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage)
      });

      const sendResult = await sendResponse.json();
      
      if (sendResponse.ok && sendResult.success) {
        console.log('✅ Test 3 PASSED: Message sent successfully');
        console.log('📨 Message details:', {
          id: sendResult.message.id,
          content: sendResult.message.content.substring(0, 50) + '...',
          sender: sendResult.message.sender_name,
          timestamp: sendResult.message.sent_at
        });
        
        results.tests.push({
          name: 'Send message',
          status: 'PASSED',
          details: `Message ID: ${sendResult.message.id}`
        });
        results.passed++;

        // Test 4: Verify message was actually created by fetching messages again
        console.log('\n🔍 Test 4: Verifying message was created...');
        const verifyResponse = await fetch(`${API_BASE}/api/communications/messages?conversationId=${conversationId}`);
        const verifyData = await verifyResponse.json();
        
        if (verifyResponse.ok) {
          const latestMessage = verifyData.messages?.[verifyData.messages.length - 1];
          
          if (latestMessage && latestMessage.id === sendResult.message.id) {
            console.log('✅ Test 4 PASSED: Message verified in database');
            console.log('📊 Total messages now:', verifyData.messages?.length || 0);
            
            results.tests.push({
              name: 'Verify message created',
              status: 'PASSED',
              details: `Message found with ID: ${latestMessage.id}`
            });
            results.passed++;
          } else {
            console.log('❌ Test 4 FAILED: Message not found in verification');
            results.tests.push({
              name: 'Verify message created',
              status: 'FAILED',
              details: 'Message not found in conversation'
            });
            results.failed++;
          }
        } else {
          console.log('❌ Test 4 FAILED: Could not verify message');
          results.tests.push({
            name: 'Verify message created',
            status: 'FAILED',
            details: 'Failed to fetch messages for verification'
          });
          results.failed++;
        }

      } else {
        console.log('❌ Test 3 FAILED: Could not send message');
        console.log('📄 Response status:', sendResponse.status);
        console.log('📄 Response data:', sendResult);
        
        results.tests.push({
          name: 'Send message',
          status: 'FAILED',
          details: sendResult.error || `HTTP ${sendResponse.status}`
        });
        results.failed++;
      }

      // Test 5: Test error handling with invalid data
      console.log('\n🚫 Test 5: Testing error handling with invalid conversation ID...');
      const invalidMessage = {
        action: 'send_message',
        conversationId: '00000000-0000-0000-0000-000000000000',
        content: 'This should fail',
        messageType: 'text'
      };

      const errorResponse = await fetch(`${API_BASE}/api/communications/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidMessage)
      });

      const errorResult = await errorResponse.json();
      
      if (errorResponse.status === 404 || errorResponse.status === 500) {
        console.log('✅ Test 5 PASSED: Error handling works correctly');
        console.log('📄 Error response:', errorResult.error);
        
        results.tests.push({
          name: 'Error handling',
          status: 'PASSED',
          details: 'Correctly rejected invalid conversation ID'
        });
        results.passed++;
      } else {
        console.log('❌ Test 5 FAILED: Error handling not working');
        console.log('📄 Unexpected response:', errorResult);
        
        results.tests.push({
          name: 'Error handling',
          status: 'FAILED',
          details: 'Did not properly handle invalid data'
        });
        results.failed++;
      }

    } else {
      console.log('❌ Test 1 FAILED: Could not get conversations');
      console.log('📄 Response:', data);
      
      results.tests.push({
        name: 'Get conversations',
        status: 'FAILED',
        details: data.error || 'No conversations found'
      });
      results.failed++;
      
      console.log('⚠️ Skipping remaining tests due to no valid conversations');
    }
    
  } catch (error) {
    console.log('❌ Test 1 FAILED with exception:', error.message);
    results.tests.push({
      name: 'Get conversations',
      status: 'FAILED',
      details: error.message
    });
    results.failed++;
  }

  return results;
}

/**
 * Test mark as read functionality
 */
async function testMarkAsRead() {
  console.log('\n📖 Testing mark as read functionality...');
  
  try {
    // Get a conversation with messages
    const response = await fetch(`${API_BASE}/api/communications?limit=10&offset=0&type=all`);
    const data = await response.json();
    
    if (response.ok && data.success && data.data.conversations.length > 0) {
      const conversationId = data.data.conversations[0].id;
      
      // Test mark conversation as read
      const markReadResponse = await fetch(`${API_BASE}/api/communications/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_conversation_read',
          conversationId: conversationId
        })
      });

      const markReadResult = await markReadResponse.json();
      
      if (markReadResponse.ok && markReadResult.success) {
        console.log('✅ Mark as read test PASSED');
        return { status: 'PASSED', details: 'Conversation marked as read' };
      } else {
        console.log('❌ Mark as read test FAILED:', markReadResult);
        return { status: 'FAILED', details: markReadResult.error || 'Unknown error' };
      }
    } else {
      console.log('⚠️ Skipping mark as read test - no conversations available');
      return { status: 'SKIPPED', details: 'No conversations available' };
    }
    
  } catch (error) {
    console.log('❌ Mark as read test FAILED with exception:', error.message);
    return { status: 'FAILED', details: error.message };
  }
}

/**
 * Run all tests and display results
 */
async function runTests() {
  try {
    console.log('🚀 Starting messaging API tests...\n');
    
    const messagingResults = await testMessagingAPI();
    const markReadResult = await testMarkAsRead();
    
    // Add mark as read result
    messagingResults.tests.push({
      name: 'Mark conversation as read',
      status: markReadResult.status,
      details: markReadResult.details
    });
    
    if (markReadResult.status === 'PASSED') {
      messagingResults.passed++;
    } else if (markReadResult.status === 'FAILED') {
      messagingResults.failed++;
    }
    
    const endTime = Date.now();
    const duration = endTime - messagingResults.startTime;
    
    console.log('\n' + '═'.repeat(80));
    console.log('🧪 TEST RESULTS SUMMARY');
    console.log('═'.repeat(80));
    console.log('⏱️  Total duration:', `${duration}ms`);
    console.log('✅ Tests passed:', messagingResults.passed);
    console.log('❌ Tests failed:', messagingResults.failed);
    console.log('📊 Total tests:', messagingResults.tests.length);
    console.log('📈 Success rate:', `${Math.round((messagingResults.passed / messagingResults.tests.length) * 100)}%`);
    
    console.log('\n📋 DETAILED RESULTS:');
    messagingResults.tests.forEach((test, index) => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${icon} ${index + 1}. ${test.name}: ${test.status}`);
      console.log(`   └─ ${test.details}`);
    });
    
    console.log('\n🔚 Testing completed at:', new Date().toISOString());
    
    if (messagingResults.failed > 0) {
      console.log('\n⚠️ Some tests failed. Check the logs above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed! Messaging API is working correctly.');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testMessagingAPI, testMarkAsRead, runTests }; 