import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { WebhookManager, WebhookEvents } from '@/lib/webhooks/webhook-manager';
import { UserRole } from '@/types';

// POST /api/webhooks/test - Send test webhook
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { endpointId, eventType } = await request.json();

    if (!endpointId) {
      return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
    }

    const webhookManager = WebhookManager.getInstance();
    const endpoint = webhookManager.getEndpoint(endpointId);

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 });
    }

    // Create test event data based on event type
    let testData: any;
    const testEventType = eventType || WebhookEvents.MESSAGE_SENT;

    switch (testEventType) {
      case WebhookEvents.MESSAGE_SENT:
      case WebhookEvents.MESSAGE_RECEIVED:
        testData = {
          message: {
            _id: 'test-message-id',
            content: 'This is a test message from Zoconut webhook system',
            type: 'text',
            sender: {
              _id: session.user.id,
              firstName: session.user.firstName,
              lastName: session.user.lastName,
              avatar: session.user.avatar
            },
            receiver: {
              _id: 'test-receiver-id',
              firstName: 'Test',
              lastName: 'Receiver',
              avatar: null
            },
            isRead: false,
            createdAt: new Date().toISOString()
          }
        };
        break;

      case WebhookEvents.USER_ONLINE:
      case WebhookEvents.USER_OFFLINE:
        testData = {
          userId: session.user.id,
          status: testEventType === WebhookEvents.USER_ONLINE ? 'online' : 'offline',
          timestamp: Date.now()
        };
        break;

      case WebhookEvents.APPOINTMENT_CREATED:
      case WebhookEvents.APPOINTMENT_UPDATED:
        testData = {
          appointment: {
            _id: 'test-appointment-id',
            type: 'consultation',
            status: 'scheduled',
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            duration: 60,
            dietitian: {
              _id: 'test-dietitian-id',
              firstName: 'Dr. Test',
              lastName: 'Dietitian'
            },
            client: {
              _id: session.user.id,
              firstName: session.user.firstName,
              lastName: session.user.lastName
            },
            createdAt: new Date().toISOString()
          },
          action: testEventType === WebhookEvents.APPOINTMENT_CREATED ? 'created' : 'updated'
        };
        break;

      default:
        testData = {
          test: true,
          message: 'This is a test webhook event',
          timestamp: Date.now()
        };
    }

    // Create and send test event
    const testEvent = WebhookManager.createEvent(
      testEventType,
      testData,
      'zoconut-test'
    );

    // Send only to the specific endpoint
    const originalEndpoints = webhookManager.getEndpoints();
    const tempManager = new (WebhookManager as any)();
    tempManager.registerEndpoint({
      url: endpoint.url,
      secret: endpoint.secret,
      events: endpoint.events,
      isActive: true,
      retryCount: 0
    });

    await tempManager.sendEvent(testEvent);

    return NextResponse.json({ 
      message: 'Test webhook sent successfully',
      event: {
        ...testEvent,
        data: testData
      }
    });

  } catch (error) {
    console.error('Error sending test webhook:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/test/events - Get available webhook event types
export async function GET() {
  try {
    const eventTypes = [
      {
        type: WebhookEvents.MESSAGE_SENT,
        description: 'Triggered when a message is sent',
        example: {
          message: {
            _id: 'string',
            content: 'string',
            type: 'text | image | file',
            sender: { _id: 'string', firstName: 'string', lastName: 'string' },
            receiver: { _id: 'string', firstName: 'string', lastName: 'string' },
            isRead: false,
            createdAt: 'ISO string'
          }
        }
      },
      {
        type: WebhookEvents.MESSAGE_RECEIVED,
        description: 'Triggered when a message is received',
        example: {
          message: {
            _id: 'string',
            content: 'string',
            type: 'text | image | file',
            sender: { _id: 'string', firstName: 'string', lastName: 'string' },
            receiver: { _id: 'string', firstName: 'string', lastName: 'string' },
            isRead: false,
            createdAt: 'ISO string'
          }
        }
      },
      {
        type: WebhookEvents.USER_ONLINE,
        description: 'Triggered when a user comes online',
        example: {
          userId: 'string',
          status: 'online',
          timestamp: 'number'
        }
      },
      {
        type: WebhookEvents.USER_OFFLINE,
        description: 'Triggered when a user goes offline',
        example: {
          userId: 'string',
          status: 'offline',
          timestamp: 'number'
        }
      },
      {
        type: WebhookEvents.APPOINTMENT_CREATED,
        description: 'Triggered when an appointment is created',
        example: {
          appointment: {
            _id: 'string',
            type: 'string',
            status: 'string',
            scheduledAt: 'ISO string',
            duration: 'number',
            dietitian: { _id: 'string', firstName: 'string', lastName: 'string' },
            client: { _id: 'string', firstName: 'string', lastName: 'string' }
          },
          action: 'created'
        }
      },
      {
        type: WebhookEvents.APPOINTMENT_UPDATED,
        description: 'Triggered when an appointment is updated',
        example: {
          appointment: {
            _id: 'string',
            type: 'string',
            status: 'string',
            scheduledAt: 'ISO string',
            duration: 'number',
            dietitian: { _id: 'string', firstName: 'string', lastName: 'string' },
            client: { _id: 'string', firstName: 'string', lastName: 'string' }
          },
          action: 'updated'
        }
      }
    ];

    return NextResponse.json({ eventTypes });

  } catch (error) {
    console.error('Error fetching webhook event types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook event types' },
      { status: 500 }
    );
  }
}
