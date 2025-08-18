import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import type { Post, CommunityType } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const sort = searchParams.get('sort') || 'latest';
    const communityType = searchParams.get('communityType') as CommunityType | null;

    const redis = await getRedisClient();

    // Get all post IDs from Redis
    const postIds = await redis.sMembers('community:posts');
    
    // Get all posts
    const posts: Post[] = [];
    for (const postId of postIds) {
      const postData = await redis.hGetAll(`post:${postId}`);
      if (postData && Object.keys(postData).length > 0) {
        const post: Post = {
          id: postData.id,
          authorId: postData.authorId,
          communityType: postData.communityType as CommunityType,
          title: postData.title,
          body: postData.body,
          tags: JSON.parse(postData.tags || '[]'),
          createdAt: parseInt(postData.createdAt),
          stats: JSON.parse(postData.stats || '{"likes":0,"comments":0}')
        };
        
        // Filter by community type - all posts must have a valid community type
        if (!communityType || post.communityType === communityType) {
          posts.push(post);
        }
      }
    }

    // Sort posts
    switch (sort) {
      case 'latest':
        posts.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'likes':
        posts.sort((a, b) => b.stats.likes - a.stats.likes);
        break;
      case 'comments':
        posts.sort((a, b) => b.stats.comments - a.stats.comments);
        break;
    }

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    // Get author info for each post
    const postsWithAuthors = await Promise.all(
      paginatedPosts.map(async (post) => {
        const authorData = await redis.hGetAll(`user:${post.authorId}`);
        return {
          ...post,
          author: {
            id: authorData.id || post.authorId,
            name: authorData.name || 'Anonymous',
            email: authorData.email || ''
          }
        };
      })
    );

    await redis.quit();

    return NextResponse.json({
      items: postsWithAuthors,
      page,
      pageSize,
      total: posts.length,
      totalPages: Math.ceil(posts.length / pageSize)
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: content, tags, communityType, authorId } = body;

    if (!title || !content || !communityType || !authorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const redis = await getRedisClient();

    // Generate new post ID
    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create post object
    const post: Post = {
      id: postId,
      authorId,
      communityType: communityType as CommunityType,
      title,
      body: content,
      tags: tags ? tags.split(',').map((t: string) => t.trim()) : [],
      createdAt: Date.now(),
      stats: {
        likes: 0,
        comments: 0
      }
    };

    // Save post to Redis
    await redis.hSet(`post:${postId}`, {
      id: post.id,
      authorId: post.authorId,
      communityType: post.communityType,
      title: post.title,
      body: post.body,
      tags: JSON.stringify(post.tags),
      createdAt: post.createdAt.toString(),
      stats: JSON.stringify(post.stats)
    });

    // Add post ID to community posts set
    await redis.sAdd('community:posts', postId);

    // Add post ID to specific community type set
    await redis.sAdd(`community:${communityType}:posts`, postId);

    await redis.quit();

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}