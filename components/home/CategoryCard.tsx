"use client"

import Link from "next/link"
import { useState } from "react"

type Subcategory = { id: string; name: string; slug: string }

type Props = {
  name: string
  slug: string
  imageUrl: string | null
  subcategories: Subcategory[]
}

export default function CategoryCard({ name, slug, imageUrl, subcategories }: Props) {
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? subcategories : subcategories.slice(0, 5)
  const hasMore = subcategories.length > 5

  return (
    <div className="flex flex-col">
      <Link href={`/buscar?categoria=${slug}`} className="block relative w-full h-44 overflow-hidden rounded-xl mb-4">
        <div className="absolute inset-0 bg-gray-200" />
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover hover:opacity-90 transition-opacity"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }}
          />
        )}
      </Link>

      <Link
        href={`/buscar?categoria=${slug}`}
        className="font-bold text-brand-dark text-base mb-3 hover:text-brand-violet transition-colors"
      >
        {name}
      </Link>

      {visible.length > 0 && (
        <ul className="space-y-1.5 mb-2">
          {visible.map((sub) => (
            <li key={sub.id}>
              <Link
                href={`/buscar?categoria=${sub.slug}`}
                className="text-brand-gray text-sm hover:text-brand-dark transition-colors"
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="text-brand-gray text-xs font-medium mt-1 hover:text-brand-dark transition-colors text-left"
        >
          {expanded ? "Ver menos ↑" : `Ver más (${subcategories.length - 5}) ↓`}
        </button>
      )}
    </div>
  )
}
