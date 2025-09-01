import mongoose, { Schema } from 'mongoose';
import { IMessage, MessageType } from '@/types';

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(MessageType),
    default: MessageType.TEXT
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });

// Compound index for conversation queries
messageSchema.index({
  $or: [
    { sender: 1, receiver: 1 },
    { sender: 1, receiver: 1 }
  ]
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id: string, user2Id: string, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  })
  .populate('sender', 'firstName lastName avatar')
  .populate('receiver', 'firstName lastName avatar')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(senderId: string, receiverId: string) {
  return this.updateMany(
    {
      sender: senderId,
      receiver: receiverId,
      isRead: false
    },
    {
      isRead: true
    }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    receiver: userId,
    isRead: false
  });
};

// Static method to get recent conversations
messageSchema.statics.getRecentConversations = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
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
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $project: {
        otherUser: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          avatar: 1,
          role: 1
        },
        lastMessage: 1,
        unreadCount: 1
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);

export default Message;
