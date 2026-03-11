import { useParams } from 'react-router-dom';
import { ProductList } from '../components/ProductList';
import { useAppSelector } from '../store/hooks';

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const categories = useAppSelector((state) => state.categories.items);

  if (!categoryId) {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <h1 className="mb-4">Категория не найдена</h1>
        </div>
      </main>
    );
  }

  if (categoryId === 'sale') {
    return (
      <main className="flex-grow-1 py-4">
        <div className="container">
          <h1 className="mb-4">Распродажа</h1>
          <ProductList categoryId="sale" />
        </div>
      </main>
    );
  }

  const category = categories.find((c) => c.id === categoryId);
  const categoryName = category?.name ?? 'Загрузка...';

  return (
    <main className="flex-grow-1 py-4">
      <div className="container">
        <h1 className="mb-4">{categoryName}</h1>
        <ProductList categoryId={categoryId} />
      </div>
    </main>
  );
}
