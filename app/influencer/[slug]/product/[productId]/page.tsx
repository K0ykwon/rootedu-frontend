import { notFound } from 'next/navigation'
import ProductDetailClient from './ProductDetailClient'

async function getProduct(influencerSlug: string, productId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/influencer/${influencerSlug}/products/${productId}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.product
  } catch (error) {
    console.error('Error fetching product:', error)
    return null
  }
}

interface PageProps {
  params: Promise<{
    slug: string
    productId: string
  }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const product = await getProduct(resolvedParams.slug, resolvedParams.productId)

  if (!product) {
    notFound()
  }

  return <ProductDetailClient product={product} influencerSlug={resolvedParams.slug} />
}