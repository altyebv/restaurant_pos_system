import React, { useState } from 'react'
import Modal from '../../components/shared/Modal'

export default function AddCategoryModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim() })
    setName('')
    onClose()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full px-3 py-2 rounded bg-[#0f0f0f] text-white"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 text-gray-800">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Add</button>
        </div>
      </form>
    </Modal>
  )
}
