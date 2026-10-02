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
  createdAt: string;
  updatedAt: string;
  author: User;
  group: Group;
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
