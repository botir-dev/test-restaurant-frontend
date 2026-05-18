'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, orderApi, tableApi } from '@/lib/services';
import { useAuthStore } from '@/store/auth.store';
import { PRODUCT_TYPE_LABELS, formatPrice } from '@/lib/utils';
import type { Product, ProductType } from '@/types';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Minus, ShoppingBag, Loader2, Search, X } from 'lucide-react';
import clsx from 'clsx';

export default function NewOrderPage() {
  const { id: tableId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('all');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', 'available'],
    queryFn: () => productApi.getAll({ is_available: true, limit: 100 }),
  });

  const { data: tablesData } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAll(),
  });

  const table = tablesData?.data?.data?.find((t: any) => t.id === tableId);
  const products: Product[] = productsData?.data?.data || [];

  // Turlari
  const types = ['all', ...Array.from(new Set(products.map(p => p.type)))];

  const filtered = products.filter(p => {
    const matchType = activeType === 'all' || p.type === activeType;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);
  const totalAmount = cartItems.reduce((sum, [pid, qty]) => {
    const p = products.find(p => p.id === pid);
    return sum + (p?.price || 0) * qty;
  }, 0);

  const addToCart = (id: string) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeFromCart = (id: string) => setCart(p => {
    const n = { ...p, [id]: (p[id] || 0) - 1 };
    if (n[id] <= 0) delete n[id];
    return n;
  });

  const createMutation = useMutation({
    mutationFn: () => orderApi.create({
      table_id: tableId,
      guest_count: table?.capacity || 1,
      items: cartItems.map(([pid, qty]) => ({ product_id: pid, quantity: qty })),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Buyurtma yaratildi!');
      router.push('/tables');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xato'),
  });

  return (
    <div className="space-y-4 animate-fadeIn pb-40">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="page-title">{table?.table_number}-stol uchun buyurtma</h1>
          <p className="text-sm text-gray-500">Menyu</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Mahsulot qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {types.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              activeType === type
                ? 'bg-green-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
            )}
          >
            {type === 'all' ? 'Hammasi' : PRODUCT_TYPE_LABELS[type as ProductType] || type}
          </button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-green-600" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(product => {
            const qty = cart[product.id] || 0;
            return (
              <div key={product.id} className={clsx(
                'bg-white rounded-2xl border-2 p-3 transition-all',
                qty > 0 ? 'border-green-400' : 'border-gray-100'
              )}>
                <div className="w-full h-24 bg-gray-100 rounded-xl mb-2 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name}
                      className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-green-600 font-bold mt-0.5">{formatPrice(product.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(product.id)}
                      className="flex items-center gap-1 w-full justify-center bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold py-1.5 rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Qo'shish
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <button onClick={() => removeFromCart(product.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all">
                        <Minus className="w-3.5 h-3.5 text-red-600" />
                      </button>
                      <span className="font-bold text-gray-900 text-sm">{qty}</span>
                      <button onClick={() => addToCart(product.id)}
                        className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-all">
                        <Plus className="w-3.5 h-3.5 text-green-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating cart */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:left-60 z-40 animate-slideUp">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">{cartItems.length} xil mahsulot</p>
                <p className="text-xs text-gray-500">
                  {cartItems.reduce((s, [, q]) => s + q, 0)} ta jami
                </p>
              </div>
              <p className="font-bold text-green-600 text-lg">{formatPrice(totalAmount)}</p>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="btn-primary w-full justify-center py-3"
            >
              {createMutation.isPending
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <ShoppingBag className="w-5 h-5" />
              }
              Buyurtma yuborish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
