import React from 'react'

export default function SoldItems({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-4 text-sm text-[#cfcfcf]">
        No sold items yet.
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Sold Items</h3>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.name} className="flex justify-between items-center">
            <div>
              <div className="text-white font-medium">{it.name}</div>
              <div className="text-xs text-gray-400">{it.category || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold">x{it.quantity}</div>
              <div className="text-sm text-gray-400">{(it.revenue || 0).toFixed(2)} SAR</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
