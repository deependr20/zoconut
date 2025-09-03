import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { SSEManager } from '@/lib/realtime/sse-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const connectionId = `${userId}-${Date.now()}-${Math.random()}`;
    
    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const sseManager = SSEManager.getInstance();
        
        // Send initial connection message
        const welcomeMessage = `event: connected\ndata: ${JSON.stringify({ 
          status: 'connected', 
          userId,
          connectionId,
          timestamp: Date.now()
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(welcomeMessage));

        // Store connection in SSE manager
        const mockResponse = new Response(); // Placeholder for actual response
        sseManager.addConnection(userId, connectionId, mockResponse);

        // Send user online status to others
        sseManager.sendToUsers(
          sseManager.getOnlineUsers().filter(id => id !== userId),
          'user_online',
          { userId, timestamp: Date.now() }
        );

        // Handle connection cleanup
        const cleanup = () => {
          sseManager.removeConnection(userId, connectionId);
          sseManager.sendToUsers(
            sseManager.getOnlineUsers(),
            'user_offline',
            { userId, timestamp: Date.now() }
          );
        };

        // Set up periodic heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatMessage = `event: heartbeat\ndata: ${JSON.stringify({ 
              timestamp: Date.now() 
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(heartbeatMessage));
          } catch (error) {
            clearInterval(heartbeat);
            cleanup();
            controller.close();
          }
        }, 30000); // Send heartbeat every 30 seconds

        // Store cleanup function for later use
        (controller as any).cleanup = () => {
          clearInterval(heartbeat);
          cleanup();
        };
      },
      
      cancel() {
        // Cleanup when connection is closed
        if ((this as any).cleanup) {
          (this as any).cleanup();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE connection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
