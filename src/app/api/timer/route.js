import { NextResponse } from 'next/server';
import { TimerService } from '../../../lib/timerService';

// Get current timer settings (public endpoint)
export async function GET(request) {
  try {
    const timerSettings = await TimerService.getTimerSettings();
    
    return NextResponse.json({
      endDate: timerSettings.endDate,
      isActive: timerSettings.isActive,
      lastUpdated: timerSettings.lastUpdated
    });

  } catch (error) {
    console.error('Error fetching timer settings:', error);
    
    // Return fallback settings
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 7);
    
    return NextResponse.json({ 
      endDate: defaultEndDate.toISOString(),
      isActive: true,
      lastUpdated: new Date().toISOString()
    });
  }
}

// Initialize timer (public endpoint for first-time setup)
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, days } = body;

    let result;
    
    switch (action) {
      case 'initialize':
        result = await TimerService.initializeTimer();
        break;
      case 'reset':
        result = await TimerService.resetTimer(days || 7);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      message: `Timer ${action}d successfully`,
      endDate: result.endDate,
      isActive: result.isActive
    });

  } catch (error) {
    console.error('Error managing timer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
