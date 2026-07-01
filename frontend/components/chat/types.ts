export interface ChunkDetail {
  chunk_no: number;
  score: number;
  chunk_text: string;
  page_no: string | number;
  source: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: { page: string | number; source: string }[];
  chunks?: ChunkDetail[];
  suggestions?: string[];
  timestamp?: string;
}