'use client'

import { useEffect, useState } from 'react'
import { billingApi } from '@/lib/api/modules/billing'
import { getErrorMessage } from '@/lib/api/client'
import { ShieldAlert, Receipt, CheckCircle, Clock } from 'lucide-react'

export default function AdminBillingPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    setLoading(true)
    setError('')
    try {
      const data = await billingApi.adminOrders()
      setOrders(data)
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (!confirm(`Siz rostdan ham ushbu to'lovni ${action === 'approve' ? 'tasdiqlaysizmi' : 'bekor qilasizmi'}?`)) return
    
    try {
      if (action === 'approve') {
        await billingApi.approveOrder(id)
      } else {
        await billingApi.rejectOrder(id)
      }
      await loadOrders()
    } catch (e) {
      alert(getErrorMessage(e))
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obunalar va To'lovlar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Barcha B2B obunalar va to'lov buyurtmalarini tasdiqlash
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <ShieldAlert className="inline mr-2 size-5" />
          {error}
        </div>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyurtma ID</th>
                  <th className="px-4 py-3 font-medium">Tashkilot/Foydalanuvchi</th>
                  <th className="px-4 py-3 font-medium">Summa</th>
                  <th className="px-4 py-3 font-medium">Holat</th>
                  <th className="px-4 py-3 font-medium">Sana</th>
                  <th className="px-4 py-3 font-medium text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <div className="animate-pulse">Yuklanmoqda...</div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      To'lovlar topilmadi.
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {order.organization_id || order.user_id || 'Noma\'lum'}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {order.amount.toLocaleString()} UZS
                      </td>
                      <td className="px-4 py-3">
                        {order.status === 'PENDING' ? (
                          <span className="inline-flex items-center text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <Clock className="mr-1 size-3" /> Kutilmoqda
                          </span>
                        ) : order.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            <CheckCircle className="mr-1 size-3" /> Tasdiqlangan
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-xs font-medium">
                            Bekor qilingan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleAction(order.id, 'approve')}
                              className="text-green-600 hover:underline text-xs font-semibold"
                            >
                              Tasdiqlash
                            </button>
                            <button 
                              onClick={() => handleAction(order.id, 'reject')}
                              className="text-red-600 hover:underline text-xs font-semibold"
                            >
                              Bekor qilish
                            </button>
                          </div>
                        )}
                        {order.receipt_file_path && (
                          <a href={order.receipt_file_path} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs inline-flex items-center mt-1">
                            <Receipt className="size-3 mr-1" /> Kvitansiya
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
