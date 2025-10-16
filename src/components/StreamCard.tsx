import React from 'react'

export default function StreamCard({ title, viewer }: { title: string; viewer: number }) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="h-40 bg-gradient-to-br from-purple-600 to-pink-500 flex items-end p-3">
        <div className="bg-black/40 text-sm px-2 py-1 rounded-md">LIVE</div>
      </div>
      <div className="p-3">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-gray-400">{viewer} viewers · Chill</div>
      </div>
    </div>
  )
}
