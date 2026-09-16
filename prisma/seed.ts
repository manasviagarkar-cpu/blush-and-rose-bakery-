import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Blush & Rose Bakery database...');

  // 1. Bakery Profile
  await prisma.bakeryProfile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      bakeryName: 'Blush & Rose Bakery',
      tagline: 'Artisan cakes, handcrafted pastries & bespoke confections',
      description: 'Handcrafted with French butter, Belgian chocolate, and local organic flour. Creating timeless centerpiece cakes for your most cherished celebrations.',
      address: '142 Rosewood Lane, Suite 4, Old Town',
      phone: '+1 (555) 234-5678',
      email: 'orders@blushandrosebakery.com',
      openingHours: 'Tuesday - Saturday: 8:00 AM - 6:30 PM | Sunday: 9:00 AM - 3:00 PM | Monday: Closed',
      pickupInstructions: 'Please ring the doorbell at the side entrance. Have your order number and photo ID ready. Custom cakes are packed in reinforced transport boxes.',
      noticeBanner: '🌸 Welcome! Custom celebration cakes require a minimum 2 days advance notice.',
      minAdvanceNoticeDays: 2,
      depositPercentage: 40,
      cancellationPolicy: 'Cancellations made 72 hours prior to pickup are eligible for a full deposit refund. Later cancellations are non-refundable due to perishable specialty ingredients.',
      defaultSlotCapacity: 4,
      holidayDates: JSON.stringify([]),
      heroImageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop',
    },
  });

  // 2. Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.upsert({
    where: { email: 'admin@blushrose.com' },
    update: { passwordHash },
    create: {
      email: 'admin@blushrose.com',
      passwordHash,
      name: 'Clara Bennett',
      role: 'BAKER_OWNER',
    },
  });

  // 3. Products
  const productsData = [
    {
      name: 'Rosewater Raspberry Chiffon Cake',
      slug: 'rosewater-raspberry-chiffon-cake',
      category: 'Celebration Cakes',
      shortDescription: 'Delicate rosewater sponge layered with tart organic raspberry compote and silky Swiss buttercream.',
      description: 'Our signature centerpiece creation. Layers of cloud-like chiffon sponge delicately infused with Persian organic rosewater, filled with tart homemade raspberry compote and wrapped in silky Swiss meringue buttercream. Adorned with candied rose petals and dried botanicals.',
      price: 58,
      imageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=900&auto=format&fit=crop',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=900&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=900&auto=format&fit=crop',
      ]),
      isAvailable: true,
      isFeatured: true,
      preparationTime: '24 Hours',
      isEggless: false,
      ingredients: 'Organic pastry flour, cultured butter, cage-free eggs, organic raspberries, rosewater, cane sugar, vanilla bean.',
      allergens: 'Contains Dairy, Gluten, Eggs. Prepared in a facility handling tree nuts.',
      variants: [
        { name: '6" Petite (6-8 servings)', price: 58 },
        { name: '8" Classic (12-16 servings)', price: 78 },
        { name: '10" Grand (20-25 servings)', price: 108 },
      ],
    },
    {
      name: 'Vintage Lambeth Vanilla Bean Cake',
      slug: 'vintage-lambeth-vanilla-bean-cake',
      category: 'Celebration Cakes',
      shortDescription: 'Intricate Victorian piped borders with Madagascan bourbon vanilla sponge and salted caramel.',
      description: 'A romantic, timeless Victorian design featuring intricate multi-layered Lambeth scrollwork, delicate scalloped ruffles, and maraschino pearls. Beneath the ornate piping lies velvety Madagascar bourbon vanilla sponge brushed with vanilla bean syrup and filled with salted caramel cream.',
      price: 68,
      imageUrl: 'https://images.unsplash.com/photo-1562440499-64c9a111f713?q=80&w=900&auto=format&fit=crop',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1562440499-64c9a111f713?q=80&w=900&auto=format&fit=crop',
      ]),
      isAvailable: true,
      isFeatured: true,
      preparationTime: '48 Hours',
      isEggless: false,
      ingredients: 'Bourbon vanilla beans, cultured butter, whole milk, unbleached flour, cane sugar, egg whites, sea salt caramel.',
      allergens: 'Contains Gluten, Dairy, Eggs.',
      variants: [
        { name: '6" Petite (6-8 servings)', price: 68 },
        { name: '8" Classic (12-16 servings)', price: 92 },
      ],
    },
    {
      name: 'Belgian Dark Chocolate Truffle Cake',
      slug: 'belgian-dark-chocolate-truffle-cake',
      category: 'Celebration Cakes',
      shortDescription: '70% Valrhona dark chocolate sponge filled with whipped espresso ganache and cocoa nib crunch.',
      description: 'Rich, fudgy layers made from 70% single-origin Belgian chocolate, soaked in light espresso syrup and sandwiched with whipped dark chocolate ganache. Finished with chocolate curls, edible 24k gold leaf, and sea salt flakes.',
      price: 62,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=900&auto=format&fit=crop',
      ]),
      isAvailable: true,
      isFeatured: true,
      preparationTime: '24 Hours',
      isEggless: true,
      ingredients: '70% dark chocolate, Dutch cocoa, espresso, oat milk, coconut cream, organic brown sugar, wheat flour, flaky sea salt.',
      allergens: 'Contains Gluten. Naturally Dairy-Free & Eggless.',
      variants: [
        { name: '6" Petite (6-8 servings)', price: 62 },
        { name: '8" Classic (12-16 servings)', price: 84 },
      ],
    },
    {
      name: 'Pistachio Rose Cardamom Gateau',
      slug: 'pistachio-rose-cardamom-gateau',
      category: 'Celebration Cakes',
      shortDescription: 'Roasted Bronte pistachio crumb cake with aromatic cardamom buttercream and rose drizzle.',
      description: 'Earthy Sicilian pistachios ground into a tender sponge infused with freshly crushed green cardamom pods. Layered with rosewater diplomat cream and topped with crushed pistachios and edible rose buds.',
      price: 65,
      imageUrl: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=900&auto=format&fit=crop',
      galleryUrls: JSON.stringify([
        'https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=900&auto=format&fit=crop',
      ]),
      isAvailable: true,
      isFeatured: false,
      preparationTime: '24 Hours',
      isEggless: false,
      ingredients: 'Bronte pistachios, almond flour, wheat flour, cardamom, cultured butter, rosewater, powdered sugar.',
      allergens: 'Contains Tree Nuts (Pistachios, Almonds), Dairy, Gluten, Eggs.',
      variants: [
        { name: '6" Petite (6-8 servings)', price: 65 },
        { name: '8" Classic (12-16 servings)', price: 88 },
      ],
    },
    {
      name: 'Signature Rose & Berry Cupcake Box (6 pcs)',
      slug: 'signature-rose-berry-cupcakes',
      category: 'Cupcakes & Pastries',
      shortDescription: 'Six artisan cupcakes topped with hand-piped buttercream florets and freeze-dried berries.',
      description: 'An assortment of our favorite petite treats: 2 Madagascar Vanilla with Rosewater Buttercream, 2 Dark Chocolate with Espresso Cream, and 2 Red Velvet with Whipped Cream Cheese. Beautifully boxed with satin ribbon.',
      price: 28,
      imageUrl: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?q=80&w=900&auto=format&fit=crop',
      galleryUrls: JSON.stringify([]),
      isAvailable: true,
      isFeatured: true,
      preparationTime: 'Same Day / 4 Hours',
      isEggless: false,
      ingredients: 'Unbleached flour, butter, cane sugar, eggs, buttermilk, cocoa, berries, vanilla bean.',
      allergens: 'Contains Dairy, Gluten, Eggs.',
      variants: [
        { name: 'Box of 6', price: 28 },
        { name: 'Box of 12', price: 52 },
      ],
    },
    {
      name: 'Lemon Blueberry Mascarpone Tart',
      slug: 'lemon-blueberry-mascarpone-tart',
      category: 'Cookies & Tarts',
      shortDescription: 'Flaky pâte sablée shell filled with zesty Meyer lemon curd and fresh mountain blueberries.',
      description: 'Crisp, buttery shortcrust pastry filled with tangy Meyer lemon curd, crowned with creamy Italian mascarpone mousse and glazed wild blueberries with fresh thyme sprigs.',
      price: 36,
      imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?q=80&w=900&auto=format&fit=crop',
      galleryUrls: JSON.stringify([]),
      isAvailable: true,
      isFeatured: false,
      preparationTime: '24 Hours',
      isEggless: false,
      ingredients: 'Pastry flour, Normandy butter, Meyer lemons, mascarpone cheese, organic blueberries, sugar, eggs.',
      allergens: 'Contains Dairy, Gluten, Eggs.',
      variants: [
        { name: '8" Tart (8 servings)', price: 36 },
      ],
    },
  ];

  for (const item of productsData) {
    const { variants, ...productFields } = item;
    const existing = await prisma.product.findUnique({ where: { slug: item.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          ...productFields,
          variants: {
            create: variants,
          },
        },
      });
    }
  }

  // 4. Sample Customer & Orders
  const sampleCustomer = await prisma.customer.upsert({
    where: { email: 'eleanor.vance@example.com' },
    update: {},
    create: {
      name: 'Eleanor Vance',
      phone: '+1 (555) 432-8765',
      email: 'eleanor.vance@example.com',
      internalNotes: 'Prefers extra floral garnish. Regular for family birthdays.',
    },
  });

  // Calculate upcoming pickup dates
  const today = new Date();
  const datePlus3 = new Date(today);
  datePlus3.setDate(today.getDate() + 3);
  const dateStr3 = datePlus3.toISOString().split('T')[0];

  const datePlus5 = new Date(today);
  datePlus5.setDate(today.getDate() + 5);
  const dateStr5 = datePlus5.toISOString().split('T')[0];

  // Custom cake order 1: Awaiting baker review
  const existingOrder1 = await prisma.order.findUnique({ where: { orderNumber: 'BR25-1042' } });
  if (!existingOrder1) {
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'BR25-1042',
        trackingToken: 'cst789tk01234567',
        type: 'CUSTOM_CAKE',
        customerName: 'Sophia Montgomery',
        customerPhone: '+1 (555) 892-1144',
        customerEmail: 'sophia.m@example.com',
        status: 'Awaiting baker review',
        pickupDate: dateStr3,
        pickupTimeSlot: '11:30 AM - 01:00 PM',
        totalAmount: 145,
        depositAmount: 58,
        balanceAmount: 87,
        paymentStatus: 'PENDING',
        customerNotes: 'Celebrating my sister’s 30th garden birthday brunch.',
        bakerNotes: 'Reviewing reference photo for edible gold leaf and fresh garden roses.',
        customerApproved: false,
        customCakeRequest: {
          create: {
            size: '8" Classic (12-16 servings)',
            shape: 'Round',
            tiers: '2 Tiers',
            flavor: 'Pistachio Rose',
            filling: 'Fresh Raspberry Compote',
            frostingType: 'Swiss Meringue Buttercream',
            frostingColor: 'Soft Blush & Rose',
            designStyle: 'Vintage Lambeth / Ruffle Piping',
            toppings: 'Fresh Florals & Edible Gold Leaf',
            isEggless: false,
            occasion: 'Birthday',
            cakeMessage: 'Happy 30th Camille!',
            specialInstructions: 'Please keep piping delicate and pastel blush.',
            allergies: 'None',
            referenceImageUrl: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?q=80&w=900&auto=format&fit=crop',
          },
        },
        statusHistory: {
          create: [
            {
              fromStatus: null,
              toStatus: 'New request',
              notes: 'Custom booking submitted online',
              changedBy: 'CUSTOMER',
            },
            {
              fromStatus: 'New request',
              toStatus: 'Awaiting baker review',
              notes: 'Queued for baker inspection and price quotation',
              changedBy: 'SYSTEM',
            },
          ],
        },
      },
    });

    await prisma.notification.create({
      data: {
        orderId: order1.id,
        type: 'REQUEST_RECEIVED',
        title: 'New Custom Cake Request',
        message: `Sophia Montgomery submitted a 2-tier Pistachio Rose request for ${dateStr3}.`,
      },
    });
  }

  // Standard Order: Confirmed / Deposit Paid
  const existingOrder2 = await prisma.order.findUnique({ where: { orderNumber: 'BR25-1088' } });
  if (!existingOrder2) {
    const prod = await prisma.product.findFirst();
    await prisma.order.create({
      data: {
        orderNumber: 'BR25-1088',
        trackingToken: 'ord992tk88441122',
        type: 'STANDARD',
        customerName: 'Eleanor Vance',
        customerPhone: '+1 (555) 432-8765',
        customerEmail: 'eleanor.vance@example.com',
        customerId: sampleCustomer.id,
        status: 'Confirmed',
        pickupDate: dateStr5,
        pickupTimeSlot: '01:30 PM - 03:00 PM',
        totalAmount: 58,
        depositAmount: 23.2,
        balanceAmount: 34.8,
        paymentStatus: 'DEPOSIT_PAID',
        customerNotes: 'Please pack securely for a 20-minute car drive.',
        customerApproved: true,
        items: {
          create: [
            {
              productId: prod?.id,
              productName: prod?.name || 'Rosewater Raspberry Chiffon Cake',
              variantName: '6" Petite (6-8 servings)',
              unitPrice: 58,
              quantity: 1,
              totalPrice: 58,
              cakeMessage: 'With Love, Eleanor',
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 23.2,
              currency: 'USD',
              paymentMethod: 'MOCK_TEST',
              transactionId: 'mock_dep_tx_8831',
              status: 'SUCCESS',
              isDeposit: true,
              notes: '40% deposit paid online via Test Mode',
            },
          ],
        },
        statusHistory: {
          create: [
            {
              fromStatus: 'New request',
              toStatus: 'Confirmed',
              notes: 'Deposit received. Order confirmed for baking schedule.',
              changedBy: 'SYSTEM',
            },
          ],
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
