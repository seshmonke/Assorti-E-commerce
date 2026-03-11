export interface Category {
  id: string;
  name: string;
  section: 'clothing' | 'accessories';
  order: number;
  createdAt: string;
  updatedAt: string;
}
