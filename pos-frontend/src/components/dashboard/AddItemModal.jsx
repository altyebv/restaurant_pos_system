import React, { useState, useEffect } from 'react'
import Modal from '../../components/shared/Modal'

export default function AddItemModal({ open, onClose, onAdd, categories = [] }) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (categories.length && !category) setCategory(categories[0].name || '')
  }, [categories])

  const handleSubmit = (e) => {
    e.preventDefault()
    const p = parseFloat(price)
    if (!name.trim() || Number.isNaN(p)) return
    onAdd({ name: name.trim(), price: p, category })
    setName('')
    setPrice('')
    onClose()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full px-3 py-2 rounded bg-[#0f0f0f] text-white"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full px-3 py-2 rounded bg-[#0f0f0f] text-white"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <select className="w-full px-3 py-2 rounded bg-[#0f0f0f] text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.length === 0 && <option value="">Uncategorized</option>}
          {categories.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Add</button>
        </div>
      </form>
    </Modal>
  )
}
