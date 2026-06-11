# Community Moderation System Guide

## Overview

The Passive Blessings community moderation system provides administrators with comprehensive tools to maintain a safe, respectful community environment. The system includes report management, user violation tracking, content flagging, and automated enforcement actions.

## Dashboard Features

### Three-Tab Interface

#### 1. Reports Tab
Manages community reports from members who flag inappropriate content or behavior.

**Features:**
- View all pending reports with status indicators
- Filter by report status (All, Pending, Resolved)
- Search reports by reason or description
- Bulk approve/reject multiple reports
- Individual report approval with confirmation
- Real-time status updates via Firestore

**Status Types:**
- **Pending** - New reports awaiting review (amber)
- **Approved** - Reports where action was taken (green)
- **Rejected** - Reports deemed invalid (red)

**Bulk Actions:**
- Select multiple reports using checkboxes
- Choose action: Approve All or Reject All
- Apply action to all selected reports atomically

#### 2. Flagged Users Tab
Tracks users with community violations and enforces user-level moderation.

**Features:**
- View flagged user accounts with violation counts
- Ban users from community
- View user email and contact information
- Track flag history for each user
- Automated ban status updates

**User Actions:**
- Ban User - Deactivate account and prevent future access
- View Flag Count - Number of community violations
- Track Ban Reason - Community violation documentation

#### 3. Flagged Content Tab
Manages user-generated content that violates community guidelines.

**Features:**
- View flagged posts and messages
- See content author and timestamp
- Delete inappropriate content
- Track deletion history
- Real-time content status updates

**Content Actions:**
- Delete Content - Permanently remove flagged post
- View Author - Identify content creator for action
- Track Deletion - Audit trail of removed content

### Statistics Dashboard

Six metric cards display moderation overview:

1. **Total Reports** - All reports submitted
2. **Pending** - Reports awaiting action (amber)
3. **Approved** - Reports with action taken (green)
4. **Rejected** - Invalid reports (red)
5. **Flagged Users** - Accounts under review
6. **Flagged Content** - Posts pending review

## Firestore Collections

### communityReports
Stores all community violation reports.

```javascript
{
  id: "report_123",
  reason: "Harassment",
  description: "User posted insulting comments",
  reportedBy: "user@example.com",
  targetContent: "post_456",
  targetUser: "violator@example.com",
  status: "pending", // pending, approved, rejected, deleted
  severity: "high", // low, medium, high
  createdAt: Timestamp,
  resolvedAt: Timestamp,
  resolvedBy: "admin"
}
```

### users (with flags)
Extended user document with violation tracking.

```javascript
{
  id: "user_789",
  firstName: "John",
  lastName: "Doe",
  email: "user@example.com",
  flags: 3, // Violation count
  active: false, // Banned status
  bannedAt: Timestamp,
  bannedReason: "Community violation"
}
```

### posts (with flagging)
Post document with moderation status.

```javascript
{
  id: "post_456",
  text: "Post content...",
  authorId: "user_123",
  authorName: "John Doe",
  createdAt: Timestamp,
  flagged: true,
  flagReason: "Inappropriate language",
  deleted: false,
  deletedAt: Timestamp,
  deletedBy: "admin"
}
```

## Moderation Workflow

### Report Processing

1. **Report Submitted** - Member flags inappropriate content/behavior
2. **Appears in Dashboard** - Admin sees report in Reports tab
3. **Admin Reviews** - Examines reason, description, and context
4. **Action Taken**:
   - **Approve** - Flag is valid, take action against content/user
   - **Reject** - Flag is invalid, no action needed
5. **Status Updated** - Report marked as resolved
6. **User Notified** - Automated notification sent if applicable

### User Violation Process

1. **Multiple Flags Collected** - User receives multiple reports
2. **Review Flagged Users** - Admin sees user in Users tab
3. **Ban Decision** - Admin can ban user for repeated violations
4. **Ban Applied** - User account deactivated
5. **Ban Tracked** - Timestamp and reason recorded
6. **Access Revoked** - User can no longer access community

### Content Moderation

1. **Content Flagged** - Member reports post or message
2. **Review in Dashboard** - Admin sees flagged content
3. **Delete Decision** - Admin reviews content
4. **Content Deleted** - Post removed from community
5. **Deletion Logged** - Deletion timestamp and admin recorded
6. **Content Hidden** - User can no longer see deleted post

## Utility Functions

### moderation-utils.ts

**reportViolation(userId, reason, severity)**
- Log new community violation
- Update user flag count
- Create moderation record

**approveReport(reportId)**
- Mark report as approved
- Remove flagged content if applicable
- Update moderation stats

**rejectReport(reportId)**
- Mark report as rejected
- Dismiss false reports
- Update moderation stats

**flagUser(userId, reason)**
- Add flag to user account
- Increment violation counter
- Log violation reason

**banUser(userId, reason)**
- Deactivate user account
- Record ban timestamp
- Document ban reason

**getModerationStats()**
- Return report counts by status
- Calculate pending/resolved ratios
- Get user and content stats

**getCommunityHealth()**
- Calculate health score (0-100)
- Factor violations, deletions, bans
- Trend over time

**autoFlagContent(postId, reason)**
- Automatically flag inappropriate content
- Trigger admin review queue
- Log auto-flagging reason

## Best Practices

### For Admins

1. **Review Context** - Read full report context before action
2. **Consistent Standards** - Apply same guidelines uniformly
3. **Document Reasons** - Record reason for each action
4. **Escalate Severe** - For harassment/threats, escalate to leadership
5. **Privacy Respected** - Maintain confidentiality of reporters
6. **Appeal Process** - Allow users to appeal moderation decisions

### Report Severity Levels

- **Low** - Minor guideline violation, first offense
- **Medium** - Clear violation, or repeated low-severity issue
- **High** - Severe violation, harassment, threats, illegal content

### Action Guidelines

| Severity | First | Second | Third | Action |
|----------|-------|--------|-------|--------|
| Low | Warning | Review | Remove | 3-day suspension |
| Medium | Review | Remove | Ban | 7-day suspension |
| High | Remove | Ban | Permanent | Immediate ban |

## Security & Privacy

- **Admin-Only Access** - Moderation dashboard restricted to administrators
- **Audit Trail** - All actions logged with timestamp and admin
- **Data Protection** - User information kept confidential
- **Encrypted Storage** - Firestore security rules enforce access
- **Notification Limits** - Users notified appropriately
- **Appeal Records** - Maintain documentation for disputes

## Reporting Metrics

### Key Metrics Tracked

- Total reports per day/week/month
- Report approval rate
- Average review time
- Most common violation types
- Flagged users trend
- Content deletion rate
- User ban frequency
- Community health score

### Performance Targets

- Response time: < 24 hours
- Approval rate: 70-85%
- False positive rate: < 10%
- User satisfaction: > 85%

## Future Enhancements

- Automated content filtering using ML
- Appeal workflow for banned users
- Moderation team hierarchy
- Detailed user behavior analytics
- Community guidelines customization
- Notification preferences
- Report categories and tags
- Moderation decision templates
