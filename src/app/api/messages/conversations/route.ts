import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import Message from '@/lib/db/models/Message';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

// GET /api/messages/conversations - Get conversation list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: session.user.id },
            { receiver: session.user.id }
          ]
        }
      },
      {
        $addFields: {
          conversationWith: {
            $cond: {
              if: { $eq: ['$sender', session.user.id] },
              then: '$receiver',
              else: '$sender'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationWith',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', session.user.id] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate user details for conversation partners
    const conversationList = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id).select('firstName lastName avatar role');
        return {
          user,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    return NextResponse.json({ conversations: conversationList });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
