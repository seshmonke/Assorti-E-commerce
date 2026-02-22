import { useParams } from 'react-router-dom';
import { ProductList } from '../components/ProductList';
import { categoryNames } from '../types/categories';
import type { ProductCategory } from '../types/categories';

export function CategoryPage() {
  const { category } = useParams<{ category: string }>();

  const validCategory = category && category in categoryNames
    ? (category as ProductCategory)
    : null;

  const categoryName = validCategory
    ? categoryNames[validCategory]
    : 'Категория';

  if (!validCategory) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <h1 className="mb-4">Категория не найдена</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow-1 py-4">
      <div className="container">
        <h1 className="mb-4">{categoryName}</h1>
        <ProductList category={validCategory} />
      </div>
    </main>
  );
}
