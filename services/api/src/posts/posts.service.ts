import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, PostMediaType, Prisma } from '@prisma/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const POST_UPLOAD_DIR = join(process.cwd(), 'uploads', 'posts');
const COMMENT_UPLOAD_DIR = join(process.cwd(), 'uploads', 'comment-attachments');
const MAX_IMAGES = 10;
const MAX_VIDEOS = 1;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_COMMENT_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const COMMENT_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

type AuthorProfile = {
  fullName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  designation: string | null;
  currentCompany: string | null;
};

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private ensureUploadDir() {
    if (!existsSync(POST_UPLOAD_DIR)) {
      mkdirSync(POST_UPLOAD_DIR, { recursive: true });
    }
    if (!existsSync(COMMENT_UPLOAD_DIR)) {
      mkdirSync(COMMENT_UPLOAD_DIR, { recursive: true });
    }
  }

  private sanitizeFileName(name?: string | null) {
    const base = (name ?? '')
      .replace(/[/\\]/g, '')
      .trim()
      .slice(0, 180);
    return base || 'attachment';
  }

  private mapComment(
    comment: {
      id: string;
      body: string;
      createdAt: Date;
      authorId: string;
      attachmentUrl?: string | null;
      attachmentFileName?: string | null;
      attachmentMimeType?: string | null;
      author: {
        id: string;
        role: string;
        profile: AuthorProfile | null;
      };
    },
    viewerId: string,
  ) {
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: this.mapAuthor(comment.author),
      isMine: comment.authorId === viewerId,
      attachmentUrl: comment.attachmentUrl ?? null,
      attachmentFileName: comment.attachmentFileName ?? null,
      attachmentMimeType: comment.attachmentMimeType ?? null,
    };
  }

  private saveCommentAttachment(file: Express.Multer.File) {
    if (!COMMENT_ATTACHMENT_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        'Attachment must be an image, PDF, Word document, or text file',
      );
    }
    if (file.size > MAX_COMMENT_ATTACHMENT_BYTES) {
      throw new BadRequestException('Attachment must be 10MB or smaller');
    }

    this.ensureUploadDir();
    const ext = extname(file.originalname || '').toLowerCase() || '';
    const filename = `${randomUUID()}${ext}`;
    writeFileSync(join(COMMENT_UPLOAD_DIR, filename), file.buffer);
    return {
      attachmentUrl: `/uploads/comment-attachments/${filename}`,
      attachmentFileName: this.sanitizeFileName(file.originalname),
      attachmentMimeType: file.mimetype,
    };
  }

  private async getBlockedIds(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    const ids = new Set<string>();
    for (const row of rows) {
      ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
    }
    return ids;
  }

  private async connectionStatusBetween(viewerId: string, authorId: string) {
    if (viewerId === authorId) {
      return { connectionStatus: 'SELF' as const, connectionId: null, connectionDirection: null };
    }
    const conn = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: viewerId, toUserId: authorId },
          { fromUserId: authorId, toUserId: viewerId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (!conn) {
      return { connectionStatus: 'NONE' as const, connectionId: null, connectionDirection: null };
    }
    return {
      connectionStatus: conn.status,
      connectionId: conn.id,
      connectionDirection:
        conn.fromUserId === viewerId ? ('sent' as const) : ('received' as const),
    };
  }

  private mapAuthor(user: {
    id: string;
    role: string;
    profile: AuthorProfile | null;
  }) {
    return {
      userId: user.id,
      role: user.role,
      fullName: user.profile?.fullName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      headline:
        user.profile?.headline ??
        user.profile?.designation ??
        user.profile?.currentCompany ??
        null,
    };
  }

  private async serializePost(
    post: {
      id: string;
      authorId: string;
      body: string;
      originalPostId: string | null;
      likeCount: number;
      commentCount: number;
      shareCount: number;
      createdAt: Date;
      updatedAt: Date;
      author: { id: string; role: string; profile: AuthorProfile | null };
      media: Array<{
        id: string;
        type: PostMediaType;
        url: string;
        fileName: string | null;
        mimeType: string | null;
        sortOrder: number;
      }>;
      originalPost: {
        id: string;
        body: string;
        authorId: string;
        createdAt: Date;
        deletedAt: Date | null;
        likeCount?: number;
        commentCount?: number;
        shareCount?: number;
        author: { id: string; role: string; profile: AuthorProfile | null };
        media: Array<{
          id: string;
          type: PostMediaType;
          url: string;
          fileName: string | null;
          mimeType: string | null;
          sortOrder: number;
        }>;
        likes?: Array<{ userId: string }>;
      } | null;
      likes?: Array<{ userId: string }>;
    },
    viewerId: string,
  ) {
    const connection = await this.connectionStatusBetween(viewerId, post.authorId);

    // Engagement is always on the root post so every viewer sees the same likes/comments.
    const rootId = post.originalPostId ?? post.id;
    let likeCount = post.likeCount;
    let commentCount = post.commentCount;
    let shareCount = post.shareCount;
    let likedByMe = Boolean(post.likes?.some((l) => l.userId === viewerId));

    if (post.originalPostId) {
      const root =
        post.originalPost && !post.originalPost.deletedAt
          ? post.originalPost
          : await this.prisma.post.findFirst({
              where: { id: post.originalPostId, deletedAt: null },
              include: {
                likes: { where: { userId: viewerId }, select: { userId: true } },
              },
            });
      if (root) {
        likeCount = root.likeCount ?? likeCount;
        commentCount = root.commentCount ?? commentCount;
        shareCount = root.shareCount ?? shareCount;
        likedByMe = Boolean(root.likes?.some((l) => l.userId === viewerId));
      }
    }

    const [recentLikeRows, recentCommentRows] = await Promise.all([
      this.prisma.postLike.findMany({
        where: { postId: rootId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { include: { profile: true } } },
      }),
      this.prisma.postComment.findMany({
        where: { postId: rootId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { author: { include: { profile: true } } },
      }),
    ]);

    const recentLikers = recentLikeRows.map((row) => this.mapAuthor(row.user));
    const recentComments = recentCommentRows
      .slice()
      .reverse()
      .map((c) => this.mapComment(c, viewerId));

    return {
      id: post.id,
      body: post.body,
      likeCount,
      commentCount,
      shareCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      likedByMe,
      author: this.mapAuthor(post.author),
      recentLikers,
      recentComments,
      media: post.media
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          fileName: m.fileName,
          mimeType: m.mimeType,
          sortOrder: m.sortOrder,
        })),
      originalPost:
        post.originalPost && !post.originalPost.deletedAt
          ? {
              id: post.originalPost.id,
              body: post.originalPost.body,
              createdAt: post.originalPost.createdAt.toISOString(),
              author: this.mapAuthor(post.originalPost.author),
              media: post.originalPost.media
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((m) => ({
                  id: m.id,
                  type: m.type,
                  url: m.url,
                  fileName: m.fileName,
                  mimeType: m.mimeType,
                  sortOrder: m.sortOrder,
                })),
            }
          : post.originalPostId
            ? { id: post.originalPostId, unavailable: true as const }
            : null,
      ...connection,
    };
  }

  private postInclude(viewerId: string) {
    return {
      author: { include: { profile: true } },
      media: true,
      likes: { where: { userId: viewerId }, select: { userId: true } },
      originalPost: {
        include: {
          author: { include: { profile: true } },
          media: true,
          likes: { where: { userId: viewerId }, select: { userId: true } },
        },
      },
    } satisfies Prisma.PostInclude;
  }

  private saveMediaFiles(files: Express.Multer.File[]) {
    if (!files.length) return [] as Array<{
      type: PostMediaType;
      url: string;
      fileName: string;
      mimeType: string;
      sortOrder: number;
    }>;

    const images = files.filter((f) => IMAGE_MIME.has(f.mimetype));
    const videos = files.filter((f) => VIDEO_MIME.has(f.mimetype));
    const invalid = files.filter((f) => !IMAGE_MIME.has(f.mimetype) && !VIDEO_MIME.has(f.mimetype));

    if (invalid.length) {
      throw new BadRequestException('Only JPEG, PNG, WEBP, GIF images and MP4/WEBM/MOV videos are allowed');
    }
    if (images.length && videos.length) {
      throw new BadRequestException('A post can include images or one video, not both');
    }
    if (videos.length > MAX_VIDEOS) {
      throw new BadRequestException('Only one video per post is allowed');
    }
    if (images.length > MAX_IMAGES) {
      throw new BadRequestException(`Maximum ${MAX_IMAGES} images per post`);
    }

    this.ensureUploadDir();
    const saved: Array<{
      type: PostMediaType;
      url: string;
      fileName: string;
      mimeType: string;
      sortOrder: number;
    }> = [];

    files.forEach((file, index) => {
      const isVideo = VIDEO_MIME.has(file.mimetype);
      if (isVideo && file.size > MAX_VIDEO_BYTES) {
        throw new BadRequestException('Video must be 50MB or smaller');
      }
      if (!isVideo && file.size > MAX_IMAGE_BYTES) {
        throw new BadRequestException('Each image must be 5MB or smaller');
      }
      const ext = extname(file.originalname || '').toLowerCase() || (isVideo ? '.mp4' : '.jpg');
      const filename = `${randomUUID()}${ext}`;
      writeFileSync(join(POST_UPLOAD_DIR, filename), file.buffer);
      saved.push({
        type: isVideo ? PostMediaType.VIDEO : PostMediaType.IMAGE,
        url: `/uploads/posts/${filename}`,
        fileName: file.originalname || filename,
        mimeType: file.mimetype,
        sortOrder: index,
      });
    });

    return saved;
  }

  async createPost(userId: string, body: string | undefined, files: Express.Multer.File[] = []) {
    const text = (body ?? '').trim();
    const media = this.saveMediaFiles(files);
    if (!text && media.length === 0) {
      throw new BadRequestException('Add text, an image, or a video to post');
    }

    const post = await this.prisma.post.create({
      data: {
        authorId: userId,
        body: text,
        media: media.length
          ? {
              create: media,
            }
          : undefined,
      },
      include: this.postInclude(userId),
    });

    return this.serializePost(post, userId);
  }

  async getFeed(userId: string, page = 1, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;
    const blocked = await this.getBlockedIds(userId);
    const blockedIds = [...blocked];

    // Original posts (+ shares with commentary). Empty reshare cards are excluded
    // so the same update is not shown twice (original + "Shared from…").
    const feedWhere: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(blockedIds.length ? { authorId: { notIn: blockedIds } } : {}),
      OR: [{ originalPostId: null }, { body: { not: '' } }],
    };

    const [rawItems, total] = await Promise.all([
      this.prisma.post.findMany({
        where: feedWhere,
        orderBy: { createdAt: 'desc' },
        skip,
        take: take + 10,
        include: this.postInclude(userId),
      }),
      this.prisma.post.count({ where: feedWhere }),
    ]);

    const seenRoots = new Set<string>();
    const items = rawItems
      .filter((p) => {
        const rootId = p.originalPostId ?? p.id;
        if (seenRoots.has(rootId)) return false;
        seenRoots.add(rootId);
        return true;
      })
      .slice(0, take);

    return {
      items: await Promise.all(items.map((p) => this.serializePost(p, userId))),
      page: Math.max(page, 1),
      limit: take,
      total,
      hasMore: skip + take < total,
    };
  }

  async getUserPosts(viewerId: string, userId: string, page = 1, limit = 20) {
    const blocked = await this.getBlockedIds(viewerId);
    if (blocked.has(userId)) {
      throw new ForbiddenException('You cannot view posts from this user');
    }

    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { deletedAt: null, authorId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: this.postInclude(viewerId),
      }),
      this.prisma.post.count({ where: { deletedAt: null, authorId: userId } }),
    ]);

    return {
      items: await Promise.all(items.map((p) => this.serializePost(p, viewerId))),
      page: Math.max(page, 1),
      limit: take,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async getPost(viewerId: string, postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: this.postInclude(viewerId),
    });
    if (!post) throw new NotFoundException('Post not found');
    const blocked = await this.getBlockedIds(viewerId);
    if (blocked.has(post.authorId)) {
      throw new ForbiddenException('You cannot view this post');
    }
    return this.serializePost(post, viewerId);
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only delete your own posts');

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async updatePost(userId: string, postId: string, body: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only edit your own posts');

    const text = body.trim();
    const mediaCount = await this.prisma.postMedia.count({ where: { postId } });
    if (!text && mediaCount === 0 && !post.originalPostId) {
      throw new BadRequestException('Post cannot be empty');
    }

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { body: text },
      include: this.postInclude(userId),
    });
    return this.serializePost(updated, userId);
  }

  /** Likes/comments always live on the root post so every viewer sees the same counts. */
  private async resolveEngagementTarget(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: { author: { include: { profile: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');

    const rootId = post.originalPostId ?? post.id;
    if (rootId === post.id) {
      return post;
    }

    const root = await this.prisma.post.findFirst({
      where: { id: rootId, deletedAt: null },
      include: { author: { include: { profile: true } } },
    });
    if (!root) throw new NotFoundException('Post not found');
    return root;
  }

  async likePost(userId: string, postId: string) {
    const post = await this.resolveEngagementTarget(postId);
    const targetId = post.id;

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId: targetId, userId } },
    });
    if (existing) {
      return this.getPost(userId, postId);
    }

    await this.prisma.$transaction([
      this.prisma.postLike.create({ data: { postId: targetId, userId } }),
      this.prisma.post.update({
        where: { id: targetId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    if (post.authorId !== userId) {
      const liker = await this.prisma.profile.findUnique({ where: { userId } });
      const name = liker?.fullName?.trim() || 'Someone';
      await this.notifications.create({
        userId: post.authorId,
        type: NotificationType.POST_LIKE,
        title: 'New like on your post',
        body: `${name} liked your post`,
        linkUrl: `/dashboard?post=${targetId}`,
        metadata: { postId: targetId, fromUserId: userId },
      });
    }

    return this.getPost(userId, postId);
  }

  async unlikePost(userId: string, postId: string) {
    const post = await this.resolveEngagementTarget(postId);
    const targetId = post.id;

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId: targetId, userId } },
    });
    if (!existing) {
      return this.getPost(userId, postId);
    }

    await this.prisma.$transaction([
      this.prisma.postLike.delete({ where: { id: existing.id } }),
      this.prisma.post.update({
        where: { id: targetId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return this.getPost(userId, postId);
  }

  async listComments(viewerId: string, postId: string, page = 1, limit = 30) {
    const target = await this.resolveEngagementTarget(postId);
    await this.getPost(viewerId, postId);
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where: { postId: target.id, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        include: { author: { include: { profile: true } } },
      }),
      this.prisma.postComment.count({ where: { postId: target.id, deletedAt: null } }),
    ]);

    return {
      items: items.map((c) => this.mapComment(c, viewerId)),
      page: Math.max(page, 1),
      limit: take,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async listLikes(viewerId: string, postId: string, page = 1, limit = 30) {
    const target = await this.resolveEngagementTarget(postId);
    await this.getPost(viewerId, postId);
    const take = Math.min(Math.max(limit, 1), 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.postLike.findMany({
        where: { postId: target.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { include: { profile: true } } },
      }),
      this.prisma.postLike.count({ where: { postId: target.id } }),
    ]);

    return {
      items: items.map((row) => ({
        ...this.mapAuthor(row.user),
        likedAt: row.createdAt.toISOString(),
      })),
      page: Math.max(page, 1),
      limit: take,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async addComment(
    userId: string,
    postId: string,
    body?: string,
    file?: Express.Multer.File,
  ) {
    const text = (body ?? '').trim();
    const attachment = file ? this.saveCommentAttachment(file) : null;
    if (!text && !attachment) {
      throw new BadRequestException('Comment cannot be empty');
    }

    const post = await this.resolveEngagementTarget(postId);
    const targetId = post.id;
    const commentBody = text;

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.postComment.create({
        data: {
          postId: targetId,
          authorId: userId,
          body: commentBody,
          attachmentUrl: attachment?.attachmentUrl ?? null,
          attachmentFileName: attachment?.attachmentFileName ?? null,
          attachmentMimeType: attachment?.attachmentMimeType ?? null,
        },
        include: { author: { include: { profile: true } } },
      });
      await tx.post.update({
        where: { id: targetId },
        data: { commentCount: { increment: 1 } },
      });
      return created;
    });

    if (post.authorId !== userId) {
      const name = comment.author.profile?.fullName?.trim() || 'Someone';
      await this.notifications.create({
        userId: post.authorId,
        type: NotificationType.POST_COMMENT,
        title: 'New comment on your post',
        body: attachment
          ? `${name} attached a file on your post`
          : `${name} commented on your post`,
        linkUrl: `/dashboard?post=${targetId}`,
        metadata: { postId: targetId, commentId: comment.id, fromUserId: userId },
      });
    }

    return this.mapComment(comment, userId);
  }

  async deleteComment(userId: string, postId: string, commentId: string) {
    const target = await this.resolveEngagementTarget(postId);
    const comment = await this.prisma.postComment.findFirst({
      where: { id: commentId, postId: target.id, deletedAt: null },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (target.authorId !== userId) {
      throw new ForbiddenException('Only the post author can delete comments');
    }

    await this.prisma.$transaction([
      this.prisma.postComment.update({
        where: { id: commentId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.post.update({
        where: { id: target.id },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async sharePost(userId: string, postId: string, body?: string) {
    const original = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: { author: { include: { profile: true } } },
    });
    if (!original) throw new NotFoundException('Post not found');

    const rootId = original.originalPostId ?? original.id;
    const text = (body ?? '').trim();

    // Empty self-share just bumps the counter — no duplicate feed card.
    if (!text) {
      const root = rootId === original.id
        ? original
        : await this.prisma.post.findFirst({ where: { id: rootId, deletedAt: null } });
      if (!root) throw new NotFoundException('Post not found');

      if (root.authorId === userId) {
        return this.getPost(userId, rootId);
      }

      const existingShare = await this.prisma.post.findFirst({
        where: {
          authorId: userId,
          originalPostId: rootId,
          deletedAt: null,
          body: '',
        },
        include: this.postInclude(userId),
      });
      if (existingShare) {
        return this.serializePost(existingShare, userId);
      }
    }

    const shared = await this.prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          authorId: userId,
          body: text,
          originalPostId: rootId,
        },
        include: this.postInclude(userId),
      });
      await tx.post.update({
        where: { id: rootId },
        data: { shareCount: { increment: 1 } },
      });
      return created;
    });

    const rootAuthorId =
      rootId === original.id
        ? original.authorId
        : (
            await this.prisma.post.findFirst({
              where: { id: rootId },
              select: { authorId: true },
            })
          )?.authorId;

    if (rootAuthorId && rootAuthorId !== userId) {
      const sharer = await this.prisma.profile.findUnique({ where: { userId } });
      const name = sharer?.fullName?.trim() || 'Someone';
      await this.notifications.create({
        userId: rootAuthorId,
        type: NotificationType.POST_SHARE,
        title: 'Your post was shared',
        body: `${name} shared your post`,
        linkUrl: `/dashboard?post=${shared.id}`,
        metadata: { postId: shared.id, originalPostId: rootId, fromUserId: userId },
      });
    }

    return this.serializePost(shared, userId);
  }
}
