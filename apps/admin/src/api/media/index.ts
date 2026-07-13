import { apiClient } from "~/lib/axios";

export interface MediaItem {
  id: number;
  mimeType: string;
  size: number;
  type: "image" | "svg" | "video" | "audio" | "file";
  ext: string | null;
  width: number | null;
  height: number | null;
  filename: string;
  url: string;
  placeholder: string | null;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface MediaListResult {
  list: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthResult {
  unregistered: number;
  missing: number;
}

export async function getMedia(
  params: {
    keyword?: string
    type?: 'image' | 'video' | 'audio' | 'file'
    page?: number
    pageSize?: number
    offset?: number
    t?: number
    signal?: AbortSignal
  } = {}
) {
  const { signal, ...rest } = params;
  const { data } = await apiClient.get<{ data: MediaListResult }>("/admin/media", { params: rest, signal });
  return data.data;
}

export async function deleteMedia(ids: number[]) {
  const { data } = await apiClient.post('/admin/media/destroy', { ids })
  return data
}

export async function getMediaHealth() {
  const { data } = await apiClient.get<{ data: HealthResult }>("/admin/media/health");
  return data.data;
}
