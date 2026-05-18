'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableApi, orderApi } from '@/lib/services';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, UtensilsCrossed, Loader2, Plus, Minus } from 'lucide-react';

export default function OccupyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [guestCount, setGuestCount] = useState(1);

  const { data: tablesData } = useQuery({
    queryKey: ['tables'],
    queryFn: () => tableApi.getAll(),
  });

  const table = tablesData?.data?.data?.find((t: any) => t.id === id);

  const occupyMutation = useMutation({
    mutationFn: () => tableApi.occupy(id, guestCount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success(`${table?.table_number}-stol band qilindi`);
      router.push(`/tables/${id}/order`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Xato'),
  });

  return (
    <div className="space-y-5 animate-fadeIn max-w-sm mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="page-title">Xizmat boshlash</h1>
      </div>

      <div className="card text-center">
        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl font-bold text-green-600">{table?.table_number || '?'}</span>
        </div>
        <p className="font-bold text-gray-900 text-lg">{table?.table_number}-stol</p>
        <p className="text-sm text-gray-500">Sig'imi: {table?.capacity} kishi</p>
      </div>

      <div className="card">
        <label className="label text-center block mb-4">Mehmonlar soni</label>
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={() => setGuestCount(p => Math.max(1, p - 1))}
            className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all"
          >
            <Minus className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-4xl font-bold text-gray-900 w-12 text-center">{guestCount}</span>
          <button
            onClick={() => setGuestCount(p => Math.min(table?.capacity || 20, p + 1))}
            className="w-11 h-11 rounded-xl bg-green-100 hover:bg-green-200 flex items-center justify-center transition-all"
          >
            <Plus className="w-5 h-5 text-green-700" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">Maksimal: {table?.capacity} kishi</p>
      </div>

      <button
        onClick={() => occupyMutation.mutate()}
        disabled={occupyMutation.isPending}
        className="btn-primary w-full justify-center py-3 text-base"
      >
        {occupyMutation.isPending
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <UtensilsCrossed className="w-5 h-5" />
        }
        Xizmatni boshlash
      </button>
    </div>
  );
}
