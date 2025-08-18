import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import type { Comment } from '@/lib/redis';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const redis = await getRedisClient();
    
    // Get comment IDs for this post
    const commentIds = await redis.sMembers(`post:${id}:comments`);
    const comments = [];
    
    for (const commentId of commentIds) {
      const commentData = await redis.hGetAll(`comment:${commentId}`);
      if (commentData && Object.keys(commentData).length > 0) {
        const authorData = await redis.hGetAll(`user:${commentData.authorId}`);
        comments.push({
          id: commentData.id,
          postId: commentData.postId,
          body: commentData.body,
          createdAt: parseInt(commentData.createdAt),
          author: {
            id: commentData.authorId,
            name: authorData.name || 'Anonymous',
            avatar: `/avatars/user${Math.floor(Math.random() * 6) + 1}.jpg`
          }
        });
      }
    }
    
    // Sort comments by creation date (newest first)
    comments.sort((a, b) => b.createdAt - a.createdAt);
    
    await redis.quit();
    
    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Props) {
  try {
    const { id: postId } = await params;
    const body = await request.json();
    const { body: commentBody, authorId } = body;
    
    if (!commentBody || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const redis = await getRedisClient();
    
    // Generate new comment ID
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create comment object
    const comment: Comment = {
      id: commentId,
      postId,
      authorId,
      body: commentBody,
      createdAt: Date.now()
    };
    
    // Save comment to Redis
    await redis.hSet(`comment:${commentId}`, {
      id: comment.id,
      postId: comment.postId,
      authorId: comment.authorId,
      body: comment.body,
      createdAt: comment.createdAt.toString()
    });
    
    // Add comment ID to post's comment set
    await redis.sAdd(`post:${postId}:comments`, commentId);
    
    // Update post's comment count
    const postStats = await redis.hGet(`post:${postId}`, 'stats');
    const stats = JSON.parse(postStats || '{"likes":0,"comments":0}');
    stats.comments = (stats.comments || 0) + 1;
    await redis.hSet(`post:${postId}`, 'stats', JSON.stringify(stats));
    
    // Get author info for response
    const authorData = await redis.hGetAll(`user:${authorId}`);
    
    await redis.quit();
    
    return NextResponse.json({
      ...comment,
      author: {
        id: authorId,
        name: authorData.name || 'Anonymous',
        avatar: `/avatars/user${Math.floor(Math.random() * 6) + 1}.jpg`
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    
    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }
    
    const redis = await getRedisClient();
    
    // Delete comment hash
    await redis.del(`comment:${commentId}`);
    
    // Remove comment ID from post's comment set
    await redis.sRem(`post:${postId}:comments`, commentId);
    
    // Update post's comment count
    const postStats = await redis.hGet(`post:${postId}`, 'stats');
    const stats = JSON.parse(postStats || '{"likes":0,"comments":0}');
    stats.comments = Math.max(0, (stats.comments || 0) - 1);
    await redis.hSet(`post:${postId}`, 'stats', JSON.stringify(stats));
    
    await redis.quit();
    
    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}