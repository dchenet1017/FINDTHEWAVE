import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.booking.deleteMany()
  await prisma.checkIn.deleteMany()
  await prisma.communityMembership.deleteMany()
  await prisma.communityWaveLeader.deleteMany()
  await prisma.waveLeader.deleteMany()
  await prisma.advertisement.deleteMany()
  await prisma.event.deleteMany()
  await prisma.promotion.deleteMany()
  await prisma.partnership.deleteMany()
  await prisma.business.deleteMany()
  await prisma.community.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  console.log('👤 Creating users...')
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const userPassword = await bcrypt.hash('User123!', 10)
  const businessPassword = await bcrypt.hash('Business123!', 10)
  const waveLeaderPassword = await bcrypt.hash('WaveLeader123!', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@wavefinder.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
    },
  })

  const baseUser = await prisma.user.create({
    data: {
      email: 'user@wavefinder.com',
      password: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: 'USER',
      isVerified: true,
      isActive: true,
    },
  })

  const businessUser = await prisma.user.create({
    data: {
      email: 'business@wavefinder.com',
      password: businessPassword,
      firstName: 'Biz',
      lastName: 'Owner',
      role: 'BUSINESS',
      isVerified: true,
      isActive: true,
    },
  })

  // Additional business owners to satisfy unique userId per Business
  const businessOwnersData = [
    { email: 'owner1@wavefinder.com', firstName: 'Owner', lastName: 'One' },
    { email: 'owner2@wavefinder.com', firstName: 'Owner', lastName: 'Two' },
    { email: 'owner3@wavefinder.com', firstName: 'Owner', lastName: 'Three' },
    { email: 'owner4@wavefinder.com', firstName: 'Owner', lastName: 'Four' },
    { email: 'owner5@wavefinder.com', firstName: 'Owner', lastName: 'Five' },
    { email: 'owner6@wavefinder.com', firstName: 'Owner', lastName: 'Six' },
    { email: 'owner7@wavefinder.com', firstName: 'Owner', lastName: 'Seven' },
    { email: 'owner8@wavefinder.com', firstName: 'Owner', lastName: 'Eight' },
    { email: 'owner9@wavefinder.com', firstName: 'Owner', lastName: 'Nine' },
  ]
  const businessOwners: { id: string; email: string }[] = []
  for (const owner of businessOwnersData) {
    const created = await prisma.user.create({
      data: {
        email: owner.email,
        password: businessPassword,
        firstName: owner.firstName,
        lastName: owner.lastName,
        role: 'BUSINESS',
        isVerified: true,
        isActive: true,
      },
    })
    businessOwners.push(created)
  }

  const waveLeaderUser = await prisma.user.create({
    data: {
      email: 'waveleader@wavefinder.com',
      password: waveLeaderPassword,
      firstName: 'Wave',
      lastName: 'Leader',
      role: 'WAVELEADER',
      isVerified: true,
      isActive: true,
    },
  })

  console.log('✅ Users created')

  // Create communities
  console.log('🏘️ Creating communities...')
  const communities = [
    {
      name: 'Outdoor Enthusiasts',
      description: 'Connect with nature lovers, hikers, and adventure seekers. Explore the great outdoors together.',
      icon: 'mountain',
      color: '#10B981',
    },
    {
      name: 'Food & Beverage',
      description: 'For foodies and culinary enthusiasts. Discover new restaurants, recipes, and dining experiences.',
      icon: 'utensils',
      color: '#F59E0B',
    },
    {
      name: 'Nightlife & Entertainment',
      description: 'Party people unite! Find the best bars, clubs, concerts, and nightlife experiences.',
      icon: 'music',
      color: '#8B5CF6',
    },
    {
      name: 'Tech & Innovation',
      description: 'Tech enthusiasts, developers, and innovators. Share knowledge and build the future together.',
      icon: 'laptop-code',
      color: '#3B82F6',
    },
    {
      name: 'Wellness & Fitness',
      description: 'Health and wellness focused community. Yoga, fitness, meditation, and holistic living.',
      icon: 'dumbbell',
      color: '#EC4899',
    },
    {
      name: 'Arts & Culture',
      description: 'Artists, creators, and culture enthusiasts. Museums, galleries, performances, and creative expression.',
      icon: 'palette',
      color: '#EF4444',
    },
  ]

  const createdCommunities = []
  for (const community of communities) {
    const created = await prisma.community.create({
      data: community,
    })
    createdCommunities.push(created)
    console.log(`✅ Created community: ${community.name}`)
  }

  // Optional extra sample users
  const extraUsersData = [
    { email: 'john.doe@example.com', firstName: 'John', lastName: 'Doe', role: 'USER' },
    { email: 'jane.smith@example.com', firstName: 'Jane', lastName: 'Smith', role: 'USER' },
  ]
  const extraUsers = []
  for (const u of extraUsersData) {
    const created = await prisma.user.create({
      data: {
        ...u,
        password: userPassword,
        isVerified: true,
        isActive: true,
      },
    })
    extraUsers.push(created)
  }

  // Create sample businesses
  console.log('🏢 Creating sample businesses...')
  const businesses = []

  const businessData = [
    {
      userId: businessUser.id,
      name: 'The Downtown Brewery',
      description: 'Craft beers and gastropub bites in the heart of Manhattan.',
      type: 'BAR',
      address: '20 W 34th St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      latitude: 40.7484,
      longitude: -73.9857,
      phone: '+1-212-555-0101',
      website: 'https://downtownbrewery.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
      rating: 4.7,
      totalReviews: 220,
    },
    {
      userId: businessOwners[0].id,
      name: 'Sky Lounge Bar',
      description: 'Rooftop cocktails with skyline views.',
      type: 'BAR',
      address: '350 5th Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10118',
      latitude: 40.7549,
      longitude: -73.984,
      phone: '+1-212-555-0102',
      website: 'https://skyloungebarnyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
      rating: 4.6,
      totalReviews: 180,
    },
    {
      userId: businessOwners[1].id,
      name: 'Bella Italia Restaurant',
      description: 'Authentic Italian cuisine with fresh pasta and wood-fired pizza.',
      type: 'RESTAURANT',
      address: '123 4th Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      latitude: 40.732,
      longitude: -73.9927,
      phone: '+1-212-555-0103',
      website: 'https://bellaitalianyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
      rating: 4.8,
      totalReviews: 340,
    },
    {
      userId: businessOwners[2].id,
      name: 'Serenity Yoga Studio',
      description: 'Mindfulness and movement in a calming studio space.',
      type: 'WELLNESS',
      address: '55 W 21st St',
      city: 'New York',
      state: 'NY',
      zipCode: '10010',
      latitude: 40.741,
      longitude: -73.9896,
      phone: '+1-212-555-0104',
      website: 'https://serenityyoganyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
      rating: 4.9,
      totalReviews: 410,
    },
    {
      userId: businessOwners[3].id,
      name: 'PowerFit Gym',
      description: 'High-end fitness center with personal training and classes.',
      type: 'FITNESS',
      address: '200 W 50th St',
      city: 'New York',
      state: 'NY',
      zipCode: '10019',
      latitude: 40.7589,
      longitude: -73.9851,
      phone: '+1-212-555-0105',
      website: 'https://powerfitnyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
      rating: 4.5,
      totalReviews: 290,
    },
    {
      userId: businessOwners[4].id,
      name: 'The Grand Hotel',
      description: 'Luxury accommodations near Midtown.',
      type: 'HOTEL',
      address: '481 8th Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      latitude: 40.7505,
      longitude: -73.9934,
      phone: '+1-212-555-0106',
      website: 'https://grandhotelnc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: true,
      rating: 4.4,
      totalReviews: 510,
    },
    {
      userId: businessOwners[5].id,
      name: 'Laugh Factory Comedy Club',
      description: 'Stand-up shows nightly with top comics.',
      type: 'ENTERTAINMENT',
      address: '250 W 23rd St',
      city: 'New York',
      state: 'NY',
      zipCode: '10011',
      latitude: 40.7425,
      longitude: -73.988,
      phone: '+1-212-555-0107',
      website: 'https://laughfactorynyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: false,
      rating: 4.3,
      totalReviews: 160,
    },
    {
      userId: businessOwners[6].id,
      name: 'Green Leaf Cafe',
      description: 'Healthy eats and coffee in a cozy spot.',
      type: 'RESTAURANT',
      address: '15 E 16th St',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      latitude: 40.7367,
      longitude: -73.99,
      phone: '+1-212-555-0108',
      website: 'https://greenleafnyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: false,
      rating: 4.6,
      totalReviews: 210,
    },
    {
      userId: businessOwners[7].id,
      name: 'Neon Nights Club',
      description: 'Late-night music, dancing, and cocktails.',
      type: 'ENTERTAINMENT',
      address: '45 E 1st St',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      latitude: 40.729,
      longitude: -73.9845,
      phone: '+1-212-555-0109',
      website: 'https://neonnightsnyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: false,
      rating: 4.5,
      totalReviews: 275,
    },
    {
      userId: businessOwners[8].id,
      name: 'Zen Spa & Wellness',
      description: 'Relaxing spa treatments and holistic wellness.',
      type: 'WELLNESS',
      address: '130 W 29th St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      latitude: 40.745,
      longitude: -73.982,
      phone: '+1-212-555-0110',
      website: 'https://zenspanyc.com',
      images: [],
      approvalStatus: 'APPROVED',
      isActive: true,
      isVerified: false,
      rating: 4.9,
      totalReviews: 190,
    },
  ]

  for (const businessInfo of businessData) {
    const business = await prisma.business.create({
      data: businessInfo,
    })
    businesses.push(business)
    console.log(`✅ Created business: ${business.name} (${business.approvalStatus})`)
  }

  // Create waveleader profile for waveLeaderUser
  console.log('🌊 Creating WaveLeader profile...')
  const waveLeader = await prisma.waveLeader.create({
    data: {
      userId: waveLeaderUser.id,
      displayName: 'Wave Leader Pro',
      specialty: 'City Tours',
      description: 'Expert local guide for NYC attractions and experiences.',
      hourlyRate: 85,
      rating: 4.8,
      totalReviews: 44,
      totalBookings: 60,
      isAvailable: true,
      isVerified: true,
      portfolioImages: [],
      tags: ['city', 'history', 'food'],
      location: 'New York, NY',
      latitude: 40.7484,
      longitude: -73.9857,
    },
  })

  // Assign waveleader to community
  await prisma.communityWaveLeader.create({
    data: {
      waveLeaderId: waveLeader.id,
      communityId: createdCommunities[2].id, // Nightlife & Entertainment
    },
  })

  // Promotions
  console.log('🎟️ Creating promotions...')
  const brewery = businessData[0]
  const bella = businessData[2]
  const yoga = businessData[3]

  const createdBusinesses = await prisma.business.findMany()

  const breweryId = createdBusinesses.find(b => b.name === brewery.name)?.id
  const bellaId = createdBusinesses.find(b => b.name === bella.name)?.id
  const yogaId = createdBusinesses.find(b => b.name === yoga.name)?.id

  await prisma.promotion.createMany({
    data: [
      {
        businessId: breweryId!,
        title: 'Happy Hour',
        description: '2-for-1 pints from 5-7pm weekdays.',
        discount: '50%',
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        businessId: bellaId!,
        title: 'Weekend Brunch',
        description: 'Complimentary mimosa with any brunch entree.',
        discount: 'Free mimosa',
        startDate: new Date(),
        endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        businessId: yogaId!,
        title: 'First Visit Special',
        description: '25% off your first class.',
        discount: '25%',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ],
  })

  // Create sample check-ins
  console.log('📍 Creating sample check-ins...')
  const createdBusinessesList = await prisma.business.findMany()
  const approvedBusinesses = createdBusinessesList.filter((b) => b.approvalStatus === 'APPROVED')
  const regularUsers = [baseUser, ...extraUsers]

  if (regularUsers.length > 0 && approvedBusinesses.length > 0) {
    await prisma.checkIn.create({
      data: {
        userId: regularUsers[0].id,
        businessId: approvedBusinesses[0].id,
        method: 'QR_CODE',
        points: 10,
      },
    })

    await prisma.checkIn.create({
      data: {
        userId: regularUsers[0].id,
        businessId: approvedBusinesses[1]?.id || approvedBusinesses[0].id,
        method: 'MANUAL',
        points: 10,
      },
    })
    console.log('✅ Created sample check-ins')
  }

  // Update community member counts
  console.log('📊 Updating community statistics...')
  for (const community of createdCommunities) {
    const memberCount = await prisma.communityMembership.count({
      where: { communityId: community.id },
    })
    await prisma.community.update({
      where: { id: community.id },
      data: { totalMembers: memberCount },
    })
  }
  console.log('✅ Updated community statistics')

  console.log('✨ Database seeded successfully!')
  console.log('\n📝 Login Credentials:')
  console.log('   Admin: admin@wavefinder.com / Admin123!')
  console.log('   User: user@wavefinder.com / User123!')
  console.log('   Business: business@wavefinder.com / Business123!')
  console.log('   WaveLeader: waveleader@wavefinder.com / WaveLeader123!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })