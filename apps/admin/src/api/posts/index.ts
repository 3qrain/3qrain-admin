import { apiClient } from "~/lib/axios";
import type { Post, PostListResult, PostListQuery, CreatePostBody, UpdatePostBody } from "./types";

export async function getPosts(query: PostListQuery = {}, signal?: AbortSignal) {
  const { data } = await apiClient.get<{ data: PostListResult }>("/admin/posts", { params: query, signal });
  return data.data;
}

export async function getPost(id: number) {
  const { data } = await apiClient.get<{ data: Post }>(`/admin/posts/${id}`);
  return data.data;
}

export async function createPost(body: CreatePostBody) {
  const { data } = await apiClient.post<{ data: Post }>("/admin/posts", body);
  return data.data;
}

export async function updatePost(id: number, body: UpdatePostBody) {
  const { data } = await apiClient.patch<{ data: Post }>(`/admin/posts/${id}`, body);
  return data.data;
}

export async function deletePost(ids: number[]) {
  const { data } = await apiClient.post('/admin/posts/trash', { ids })
  return data
}

export async function destroyPost(ids: number[]) {
  const { data } = await apiClient.post('/admin/posts/destroy', { ids })
  return data
}

export async function emptyTrash() {
  const { data } = await apiClient.delete('/admin/trash/posts')
  return data
}

export async function restorePost(id: number) {
  const { data } = await apiClient.patch<{ data: Post }>(`/admin/posts/${id}/restore`);
  return data.data;
}
