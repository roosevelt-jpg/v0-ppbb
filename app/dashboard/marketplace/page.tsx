'use client'

export const dynamic = 'force-dynamic'
import React, { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Star } from 'lucide-react'

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'products')),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        )
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching products:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const handleAddToCart = (product: any) => {
    setCart([...cart, { ...product, cartId: Date.now() }])
  }

  const handleRemoveFromCart = (cartId: number) => {
    setCart(cart.filter((item) => item.cartId !== cartId))
  }

  const filtered =
    filter === 'all'
      ? products
      : products.filter((product) => product.category === filter)

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0)

  return (
    <>
      <MemberHeader
        title="Marketplace"
        subtitle="Shop member-exclusive products and access discounts"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8 space-y-6">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-4 sticky top-8">
              <h3 className="font-bold mb-4">Categories</h3>
              <div className="space-y-2">
                {['all', 'merchandise', 'books', 'courses', 'discounts'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      filter === cat
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <p className="text-muted-foreground">Loading products...</p>
              ) : filtered.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No products in this category</p>
                </Card>
              ) : (
                filtered.map((product) => (
                  <Card key={product.id} className="p-6 flex items-start gap-4">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-lg">{product.name}</h3>
                        {product.discount && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                            -{product.discount}%
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground text-sm mt-1">{product.description}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-lg">
                            AED {product.salePrice || product.price}
                          </span>
                          {product.salePrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              AED {product.price}
                            </span>
                          )}
                        </div>

                        {product.rating && (
                          <div className="flex items-center gap-1">
                            {Array(Math.floor(product.rating))
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className="fill-yellow-400 text-yellow-400"
                                />
                              ))}
                            <span className="text-xs text-muted-foreground">
                              ({product.reviews} reviews)
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="mt-3"
                      >
                        <ShoppingCart size={16} className="mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <Card className="p-6 fixed bottom-0 left-0 right-0 max-w-screen-xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{cart.length} items in cart</p>
                <p className="text-2xl font-bold">AED {totalPrice.toLocaleString()}</p>
              </div>
              <Button onClick={() => console.log('Checkout with items:', cart)}>
                Proceed to Checkout
              </Button>
            </div>
          </Card>
        )}
      </div>
    </>
  )
}
