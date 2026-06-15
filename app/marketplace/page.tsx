'use client'

import React, { useEffect, useState } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import Link from 'next/link'
import { Star, Heart, Search } from 'lucide-react'

interface MarketplaceItem {
  id: string
  title: string
  description: string
  price: number
  category: string
  seller: string
  sellerId: string
  image?: string
  rating: number
  reviews: number
  available: boolean
}

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loadingBusinesses, setLoadingBusinesses] = useState(true)

  useEffect(() => {
    const itemsRef = collection(db, 'marketplaceItems')
    const q = filter === 'all' ? itemsRef : query(itemsRef, where('category', '==', filter))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )

      setItems(itemsData as MarketplaceItem[])
      setLoading(false)
    })

    return () => unsubscribe()
  }, [filter, searchTerm])

  // Load businesses for directory
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'businesses'), (snapshot) => {
      setBusinesses(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })))
      setLoadingBusinesses(false)
    })
    return unsubscribe
  }, [])

  const categories = [
    'all',
    'services',
    'products',
    'coaching',
    'consulting',
    'education',
    'merchandise',
    'donations-purchases',
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Community Marketplace</h1>
            <p className="text-lg text-gray-600">
              Discover products and services from community members. Support local businesses and grow together.
            </p>
          </div>

          {/* Search */}
          <div className="mb-8 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search marketplace..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                  filter === cat
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Shop Dropdown */}
          <div className="mb-8">
            <details className="group">
              <summary className="cursor-pointer px-4 py-2 rounded-lg font-medium bg-black text-white hover:bg-gray-900 transition-colors list-none">
                SHOP ▼
              </summary>
              <div className="mt-2 pl-4 space-y-2">
                <button
                  onClick={() => setFilter('merchandise')}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-colors capitalize ${
                    filter === 'merchandise'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  • Merchandise
                </button>
                <button
                  onClick={() => setFilter('donations-purchases')}
                  className={`block w-full text-left px-4 py-2 rounded-lg transition-colors capitalize ${
                    filter === 'donations-purchases'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  • Donations Through Purchases
                </button>
              </div>
            </details>
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading marketplace...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No items found</p>
              <Link href="/signup">
                <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 font-medium rounded-lg">
                  Sign Up to List Items
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2 py-1 rounded capitalize">
                        {item.category}
                      </div>
                      <Heart className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                    </div>

                    <h3 className="font-bold mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold">AED {item.price}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{item.rating} ({item.reviews})</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">by {item.seller}</p>

                    <Link href={`/signup?returnUrl=/marketplace/${item.id}`}>
                      <button className={`w-full py-2 font-medium rounded-lg transition-colors ${
                        item.available
                          ? 'bg-black hover:bg-gray-800 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}>
                        {item.available ? 'View Details' : 'Sold Out'}
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Business Directory Section */}
          {businesses.length > 0 && (
            <div className="mt-16 pt-12 border-t border-gray-200">
              <h2 className="text-3xl font-bold mb-8">Business Directory</h2>
              <p className="text-gray-600 mb-8">Discover what our business partners are selling and offering</p>
              
              {loadingBusinesses ? (
                <p className="text-gray-500">Loading businesses...</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      {business.logo && (
                        <img
                          src={business.logo}
                          alt={business.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h3 className="font-bold text-lg mb-2">{business.name}</h3>
                      <p className="text-gray-600 text-sm mb-3">{business.description}</p>
                      
                      <div className="space-y-2 mb-4 text-sm">
                        {business.category && (
                          <p><span className="font-semibold">Category:</span> {business.category}</p>
                        )}
                        {business.contact && (
                          <p><span className="font-semibold">Contact:</span> {business.contact}</p>
                        )}
                        {business.website && (
                          <p>
                            <span className="font-semibold">Website:</span>{' '}
                            <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Visit
                            </a>
                          </p>
                        )}
                      </div>

                      {business.storefront && (
                        <Link href={`/business/storefront/${business.id}`}>
                          <button className="w-full bg-black hover:bg-gray-800 text-white py-2 font-medium rounded-lg transition-colors">
                            View Storefront
                          </button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}
