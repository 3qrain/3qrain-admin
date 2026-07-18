export interface Tag {
  id: number;
  name: string;
  slug: string;
  postCount: number;
  noteCount: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}
