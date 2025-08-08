import { NextRequest, NextResponse } from 'next/server';

// This is a simple monitoring endpoint to help identify mobile app API calls
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Mobile Endpoint Monitor] Active monitoring for mobile app API calls...');
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring mobile app API calls - check server console for logs',
      instructions: [
        '1. Send a message from your mobile app',
        '2. Check the server console/terminal for API call logs',
        '3. Look for logs that start with [Messages API], [Communications API], [Mobile Communication], etc.',
        '4. This will help identify which endpoint your mobile app is using'
      ],
      monitoring: {
        'communications/messages': 'Look for: [Messages API] POST request started',
        'communications': 'Look for: [Communications API] POST request received', 
        'mobile-control/communication': 'Look for: [Mobile Communication] messages',
        'direct-message-insert': 'Look for: [Direct Message Insert]'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start monitoring' }, { status: 500 });
  }
} 