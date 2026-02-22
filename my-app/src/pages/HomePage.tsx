import { ProductList } from '../components/ProductList';

export function HomePage() {
  return (
    <main className="flex-grow-1 py-4">
      <div className="container">
        <h1 className="mb-4">Все товары</h1>
        <ProductList category="all" />
      </div>
    </main>
  );
}
