export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  joinCode: string;
  createdById: string;
  createdAt: string;
  createdBy: User;
  memberships: Membership[];
  posts: Post[];
}

export interface Membership {
  id: string;
  userId: string;
  groupId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  user: User;
  group: Group;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  authorId: string;
  groupId: string;
  viewCount: number;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: User;
  group: Group;
}

export interface Comment {
  id: string;
  body: string;
  authorId: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
  author: User;
}

export interface CommentsPage {
  items: Comment[];
  page: number;
  limit: number;
  total: number;
}

export interface PostLikedEvent {
  groupId: string;
  postId: string;
  userId: string;
  liked: boolean;
  likeCount: number;
}

export interface CommentCreatedEvent {
  groupId: string;
  postId: string;
  comment: Comment;
}

export type CommentUpdatedEvent = CommentCreatedEvent;

export interface CommentDeletedEvent {
  groupId: string;
  postId: string;
  commentId: string;
  commentCount: number;
}

export interface CreateGroupDto {
  name: string;
  description: string;
}

export interface JoinGroupDto {
  code: string;
}

export interface CreatePostDto {
  title: string;
  body: string;
}

export interface UpdatePostDto {
  title: string;
  body: string;
}

export interface Room {
  id: string;
  title?: string;
  status: string;
  host: Pick<User, "id" | "username">;
  startedAt: string;
}
