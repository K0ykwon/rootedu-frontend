import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import type { Post, CommunityType } from '@/lib/redis';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const redis = await getRedisClient();

    // Get post data
    const postData = await redis.hGetAll(`post:${id}`);
    
    if (!postData || Object.keys(postData).length === 0) {
      await redis.quit();
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse post data
    const post: Post = {
      id: postData.id,
      authorId: postData.authorId,
      communityType: postData.communityType as CommunityType,
      title: postData.title,
      body: postData.body,
      tags: JSON.parse(postData.tags || '[]'),
      createdAt: parseInt(postData.createdAt),
      stats: JSON.parse(postData.stats || '{"likes":0,"comments":0,"views":0}')
    };

    // Increment view count
    post.stats.views = (post.stats.views || 0) + 1;
    await redis.hSet(`post:${id}`, 'stats', JSON.stringify(post.stats));

    // Get author info
    const authorData = await redis.hGetAll(`user:${post.authorId}`);
    
    // Get comments
    const commentIds = await redis.sMembers(`post:${id}:comments`);
    const comments = [];
    
    for (const commentId of commentIds) {
      const commentData = await redis.hGetAll(`comment:${commentId}`);
      if (commentData && Object.keys(commentData).length > 0) {
        const commentAuthorData = await redis.hGetAll(`user:${commentData.authorId}`);
        comments.push({
          id: commentData.id,
          body: commentData.body,
          createdAt: parseInt(commentData.createdAt),
          author: {
            id: commentData.authorId,
            name: commentAuthorData.name || 'Anonymous',
            avatar: `/avatars/user${Math.floor(Math.random() * 6) + 1}.jpg`
          }
        });
      }
    }

    // Sort comments by creation date
    comments.sort((a, b) => b.createdAt - a.createdAt);

    await redis.quit();

    return NextResponse.json({
      ...post,
      author: {
        id: post.authorId,
        name: authorData.name || 'Anonymous',
        avatar: `/avatars/user${Math.floor(Math.random() * 6) + 1}.jpg`
      },
      comments
    });
  } catch (error) {
    console.error('Failed to fetch post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const redis = await getRedisClient();

    // Check if post exists
    const exists = await redis.exists(`post:${id}`);
    if (!exists) {
      await redis.quit();
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Update post fields
    const updates: Record<string, string> = {};
    if (body.title) updates.title = body.title;
    if (body.body) updates.body = body.body;
    if (body.tags) updates.tags = JSON.stringify(body.tags);
    if (body.communityType) updates.communityType = body.communityType;
    
    if (Object.keys(updates).length > 0) {
      await redis.hSet(`post:${id}`, updates);
    }

    // Handle stats updates (likes, etc.)
    if (body.action === 'like') {
      const currentStats = await redis.hGet(`post:${id}`, 'stats');
      const stats = JSON.parse(currentStats || '{"likes":0,"comments":0}');
      stats.likes = (stats.likes || 0) + 1;
      await redis.hSet(`post:${id}`, 'stats', JSON.stringify(stats));
    } else if (body.action === 'unlike') {
      const currentStats = await redis.hGet(`post:${id}`, 'stats');
      const stats = JSON.parse(currentStats || '{"likes":0,"comments":0}');
      stats.likes = Math.max(0, (stats.likes || 0) - 1);
      await redis.hSet(`post:${id}`, 'stats', JSON.stringify(stats));
    }

    await redis.quit();

    return NextResponse.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Failed to update post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const redis = await getRedisClient();

    // Delete post hash
    await redis.del(`post:${id}`);
    
    // Remove from community posts set
    await redis.sRem('community:posts', id);
    
    // Get community type to remove from specific set
    const postData = await redis.hGetAll(`post:${id}`);
    if (postData.communityType) {
      await redis.sRem(`community:${postData.communityType}:posts`, id);
    }
    
    // Delete associated comments
    const commentIds = await redis.sMembers(`post:${id}:comments`);
    for (const commentId of commentIds) {
      await redis.del(`comment:${commentId}`);
    }
    await redis.del(`post:${id}:comments`);

    await redis.quit();

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Failed to delete post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}