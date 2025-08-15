export interface Task {
  id: string;
  douyinId: string;
  status: 'processing' | 'completed' | 'failed' | 'skipped';
  progress: number;
  error?: string;
}
