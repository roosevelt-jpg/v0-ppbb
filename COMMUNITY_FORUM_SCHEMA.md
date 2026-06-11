# Community Forum - Firestore Schema

## Collections Overview

### 1. groups
Community groups/forums for discussions

```javascript
{
  id: "group_uuid",
  name: "Member Networking Group",
  description: "Connect with other members",
  type: "member_networking", // member_networking, cause_discussion, business_networking, volunteer_coordination
  category: "networking",
  coverImage: "https://storage.googleapis.com/...",
  about: "Detailed about text",
  createdBy: "user_id",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  memberCount: 42,
  postCount: 150,
  isActive: true,
  
  // For cause-specific groups
  causeId: "cause_id", // null if not cause-specific
  causeName: "Education Fund",
  
  // For business groups
  businessId: "business_id", // null if not business-specific
  
  // Privacy and moderation
  isPublic: true,
  requiresApproval: false, // Posts need admin approval
  bannedMembers: ["user_id_1", "user_id_2"]
}
```

### 2. groups/{groupId}/members
Members of each group

```javascript
{
  id: "user_id",
  userId: "user_id",
  role: "member", // member, moderator, admin
  joinedAt: Timestamp,
  isActive: true,
  isModerator: false,
  joinStatus: "active" // active, banned, left
}
```

### 3. groups/{groupId}/posts
Discussion posts in groups

```javascript
{
  id: "post_uuid",
  userId: "user_id",
  username: "john_doe",
  userAvatar: "https://...",
  title: "Looking for internship opportunities",
  content: "I am looking for...",
  type: "discussion", // discussion, announcement, opportunity, question
  media: [
    {
      type: "image", // image, document, link
      url: "https://storage.googleapis.com/...",
      name: "screenshot.png",
      uploadedAt: Timestamp
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Engagement
  commentCount: 5,
  likesCount: 12,
  likedBy: ["user_id_1", "user_id_2"],
  
  // Moderation
  isPinned: false,
  isApproved: true,
  isArchived: false,
  flagCount: 0,
  flaggedBy: [],
  
  // Metadata
  tags: ["internship", "tech"],
  visibility: "public" // public, members_only, private
}
```

### 4. groups/{groupId}/posts/{postId}/comments
Comments and replies on posts

```javascript
{
  id: "comment_uuid",
  userId: "user_id",
  username: "jane_smith",
  userAvatar: "https://...",
  content: "Great opportunity!",
  media: [
    {
      type: "image",
      url: "https://storage.googleapis.com/...",
      name: "doc.pdf"
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  
  // Threading
  parentCommentId: null, // For nested replies
  
  // Engagement
  likesCount: 2,
  likedBy: ["user_id_1"],
  
  // Moderation
  isApproved: true,
  flagCount: 0,
  isDeleted: false,
  deletedAt: null
}
```

### 5. communityModeration
Admin moderation queue

```javascript
{
  id: "flag_uuid",
  type: "post", // post, comment, user, group
  targetId: "post_id",
  targetUserId: "user_id",
  groupId: "group_id",
  reason: "spam", // spam, inappropriate, harassment, other
  reportedBy: "user_id",
  reportedAt: Timestamp,
  status: "pending", // pending, reviewed, resolved, dismissed
  adminNotes: "No violation found",
  resolvedBy: "admin_id",
  resolvedAt: Timestamp,
  action: "none" // none, warning, delete, ban
}
```

### 6. users/{userId}/notifications
Notifications for user activity

```javascript
{
  id: "notification_uuid",
  type: "new_comment", // new_comment, post_approved, post_flagged, user_banned, group_invite
  groupId: "group_id",
  postId: "post_id",
  senderId: "user_id",
  message: "Someone replied to your post",
  link: "/community/groups/group_id/posts/post_id",
  isRead: false,
  createdAt: Timestamp
}
```

### 7. communityStats
System-wide community statistics

```javascript
{
  id: "stats",
  totalGroups: 25,
  totalMembers: 500,
  totalPosts: 2000,
  totalComments: 8000,
  activeMembers: 120, // Last 30 days
  updatedAt: Timestamp
}
```

## Data Relationships

```
users
  ├── notifications (for community activity)
  └── private/{communityPrefs}

groups
  ├── members (join/member records)
  ├── posts (discussions)
  │   └── comments (replies with threading)
  └── (metadata)

communityModeration
  ├── Reports for posts, comments, users
  └── Admin actions and resolutions
```

## Security Rules

### Users can:
- Read public groups
- Join/leave groups
- Create posts in groups they're members of
- Comment on posts
- Report inappropriate content

### Admin can:
- Moderate all content
- Delete posts/comments
- Ban users from groups/system
- Approve/reject flagged content
- Pin/unpin posts
- Archive/restore posts

### Group Moderators can:
- Delete posts in their group
- Ban users from group
- Pin important posts

## Indexes Needed

```
groups:
  - Query by type, isActive
  - Query by causeId (for cause groups)
  
posts:
  - Query by groupId, createdAt (recent posts)
  - Query by userId (user's posts)
  - Query by isApproved, createdAt
  
comments:
  - Query by postId, createdAt
  - Query by parentCommentId
  
communityModeration:
  - Query by status, type
  - Query by groupId, status
```

## File Storage Paths

```
Firebase Storage:
community/
  ├── groups/{groupId}/cover/ (group cover images)
  ├── posts/{postId}/ (post media - images, docs)
  └── temp/ (temporary uploads)
```
