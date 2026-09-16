import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

// GET all products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ products });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST create product
export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      category = 'Celebration Cakes',
      shortDescription,
      description,
      price,
      imageUrl,
      preparationTime = '24 Hours',
      isEggless = false,
      ingredients,
      allergens,
      isAvailable = true,
      isFeatured = false,
      variants = [],
    } = body;

    if (!name || !price || !description) {
      return NextResponse.json({ error: 'Name, price, and description are required' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        category,
        shortDescription: shortDescription || description.slice(0, 120),
        description,
        price: Number(price),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop',
        preparationTime,
        isEggless: Boolean(isEggless),
        ingredients: ingredients || 'Flour, butter, sugar, vanilla',
        allergens: allergens || 'Contains Dairy, Gluten',
        isAvailable: Boolean(isAvailable),
        isFeatured: Boolean(isFeatured),
        variants: {
          create: variants.map((v: any) => ({
            name: v.name,
            price: Number(v.price),
            isAvailable: v.isAvailable !== false,
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: unknown) {
    console.error('Create product error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT update product
export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, variants, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Delete existing variants and re-create if provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      await prisma.productVariant.createMany({
        data: variants.map((v: any) => ({
          productId: id,
          name: v.name,
          price: Number(v.price),
          isAvailable: v.isAvailable !== false,
        })),
      });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...fields,
        price: fields.price ? Number(fields.price) : undefined,
      },
      include: { variants: true },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    console.error('Update product error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Delete product error:', err);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
