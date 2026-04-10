import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.booking.deleteMany()
  await prisma.checkIn.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.userReward.deleteMany()
  await prisma.communityMembership.deleteMany()
  await prisma.communityWaveLeader.deleteMany()
  await prisma.advertisement.deleteMany()
  await prisma.eventCheckIn.deleteMany()
  await prisma.eventAttendee.deleteMany()
  await prisma.event.deleteMany()
  await prisma.waveLeader.deleteMany()
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

  // Create WaveLeader profile for waveLeaderUser
  console.log('🌊 Creating WaveLeader profile...')
  const waveLeader = await prisma.waveLeader.create({
    data: {
      userId: waveLeaderUser.id,
      displayName: 'DJ FuzionSpeaker',
      specialty: 'Music Curator & DJ',
      description: 'Professional DJ and music curator with 5+ years of experience creating perfect ambiance for retail shops, bars, and events. Specializing in curated playlists and live mixing for all occasions.',
      hourlyRate: 150,
      rating: 4.9,
      totalReviews: 87,
      totalBookings: 156,
      isAvailable: true,
      isVerified: true,
      tags: ['Music', 'DJ', 'Events', 'Content Creator', 'Nightlife', 'Curated Playlists'],
      portfolioImages: [
        'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
      ],
      location: 'New York, NY',
      latitude: 40.758,
      longitude: -73.9855,
    },
  })

  const waveLeaderSarahUser = await prisma.user.create({
    data: {
      email: 'sarah.chen@wavefinder.com',
      password: waveLeaderPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: 'WAVELEADER',
      isVerified: true,
      isActive: true,
    },
  })
  const waveLeaderSarah = await prisma.waveLeader.create({
    data: {
      userId: waveLeaderSarahUser.id,
      displayName: 'Sarah Chen',
      specialty: 'Yoga & Meditation Instructor',
      description:
        'Certified yoga instructor specializing in outdoor flows and guided meditation.',
      hourlyRate: 85,
      rating: 4.9,
      totalReviews: 64,
      totalBookings: 120,
      isAvailable: true,
      isVerified: true,
      tags: ['Yoga', 'Wellness', 'Meditation', 'Outdoor'],
      portfolioImages: [],
      location: 'New York, NY',
      latitude: 40.741,
      longitude: -73.9896,
    },
  })

  const waveLeaderMarcusUser = await prisma.user.create({
    data: {
      email: 'marcus.rodriguez@wavefinder.com',
      password: waveLeaderPassword,
      firstName: 'Marcus',
      lastName: 'Rodriguez',
      role: 'WAVELEADER',
      isVerified: true,
      isActive: true,
    },
  })
  const waveLeaderMarcus = await prisma.waveLeader.create({
    data: {
      userId: waveLeaderMarcusUser.id,
      displayName: 'Marcus Rodriguez',
      specialty: 'HIIT & Personal Training',
      description:
        'Certified trainer focused on high-intensity workouts and virtual bootcamps.',
      hourlyRate: 95,
      rating: 4.8,
      totalReviews: 72,
      totalBookings: 200,
      isAvailable: true,
      isVerified: true,
      tags: ['Fitness', 'HIIT', 'Virtual', 'Bootcamp'],
      portfolioImages: [],
      location: 'New York, NY',
      latitude: 40.7589,
      longitude: -73.9851,
    },
  })

  // Assign WaveLeader to communities (CommunityWaveLeader)
  await prisma.communityWaveLeader.create({
    data: {
      waveLeaderId: waveLeader.id,
      communityId: createdCommunities[2].id, // Nightlife & Entertainment
    },
  })
  await prisma.communityWaveLeader.create({
    data: {
      waveLeaderId: waveLeader.id,
      communityId: createdCommunities[1].id, // Food & Beverage
    },
  })

  console.log('📅 Creating sample bookings...')
  const regularUser = baseUser
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  await prisma.booking.create({
    data: {
      userId: regularUser.id,
      waveLeaderId: waveLeader.id,
      scheduledDate: sevenDaysAgo,
      scheduledTime: '14:00',
      duration: 2,
      serviceType: 'DJ Service',
      location: '123 Event Street, New York, NY',
      totalAmount: 300,
      serviceFee: 45,
      status: 'COMPLETED',
      paidAt: sevenDaysAgo,
      confirmedAt: sevenDaysAgo,
      completedAt: sevenDaysAgo,
      rating: 5,
      review:
        'Amazing DJ! The music selection was perfect for our event. Very professional and punctual.',
      reviewTags: ['Professional', 'Punctual', 'Great Value', 'Would Book Again'],
      reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.booking.create({
    data: {
      userId: regularUser.id,
      waveLeaderId: waveLeader.id,
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      scheduledTime: '18:00',
      duration: 3,
      serviceType: 'Private Event',
      location: '456 Party Avenue, New York, NY',
      totalAmount: 450,
      serviceFee: 67.5,
      status: 'CONFIRMED',
      paidAt: new Date(),
      confirmedAt: new Date(),
    },
  })
  await prisma.booking.create({
    data: {
      userId: regularUser.id,
      waveLeaderId: waveLeader.id,
      scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      scheduledTime: '20:00',
      duration: 4,
      serviceType: 'Bar Event',
      location: '789 Lounge Street, New York, NY',
      notes: 'Looking for upbeat music, mostly electronic and house.',
      totalAmount: 600,
      serviceFee: 90,
      status: 'PENDING',
    },
  })
  console.log('✅ Sample bookings created')

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

  // Create UserReward for test user
  console.log('🎁 Creating user rewards...')
  await prisma.userReward.create({
    data: {
      userId: baseUser.id,
      points: 120,
      totalEarned: 120,
      totalSpent: 0,
      level: 2, // Silver level
    },
  })
  console.log('✅ Created user rewards')

  // Advertisements
  console.log('📢 Creating sample advertisements...')

  // Create an active ad for Downtown Brewery
  const activeAd = await prisma.advertisement.create({
    data: {
      businessId: businesses[0].id, // The Downtown Brewery
      title: 'Happy Hour Special - 50% Off All Beers!',
      description:
        'Join us for happy hour! Get 50% off all draft beers from 5-7 PM daily.',
      targetRadius: 10,
      dailyBudget: 225, // 10-mile radius: $150 × 1.5
      totalBudget: 6750, // 30 days
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      impressions: 4532,
      clicks: 127,
      conversions: 18,
    },
  })

  // Create a scheduled ad for Bella Italia
  const scheduledAd = await prisma.advertisement.create({
    data: {
      businessId: businesses[2].id, // Bella Italia Restaurant
      title: 'New Summer Menu Launch!',
      description:
        'Try our new summer Italian menu. Fresh pasta, wood-fired pizzas, and more!',
      targetRadius: 5,
      dailyBudget: 150,
      totalBudget: 2100, // 14 days
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Starts in 7 days
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      status: 'SCHEDULED',
    },
  })

  // Create a paused ad for PowerFit Gym
  const pausedAd = await prisma.advertisement.create({
    data: {
      businessId: businesses[4].id, // PowerFit Gym
      title: 'Join PowerFit - First Month Free!',
      description:
        'New members get their first month free. State-of-the-art equipment and classes.',
      targetRadius: 15,
      dailyBudget: 300, // 15-mile radius: $150 × 2
      totalBudget: 9000, // 30 days
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      status: 'PAUSED',
      isActive: false,
      impressions: 2134,
      clicks: 56,
      conversions: 8,
      spent: 3000, // 10 days × $300
    },
  })

  console.log('✅ Sample advertisements created')

  // Sample events (event management)
  console.log('🎉 Creating sample events...')
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  const nextMonth = new Date(now)
  nextMonth.setMonth(nextMonth.getMonth() + 1)

  const b0 = businesses[0]
  const b1 = businesses[1]
  const b2 = businesses[2]
  const b3 = businesses[3]
  const b4 = businesses[4]

  const musicEvent = await prisma.event.create({
    data: {
      businessId: b0.id,
      title: 'Live Jazz Night with The Blue Notes',
      description:
        'Join us for an unforgettable evening of smooth jazz featuring The Blue Notes. Enjoy craft beers and appetizers while soaking in the soulful sounds of local jazz legends.',
      imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800',
      category: 'MUSIC',
      tags: ['jazz', 'live-music', 'nightlife', 'drinks'],
      latitude: Number(b0.latitude),
      longitude: Number(b0.longitude),
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
      requiresRegistration: true,
      maxAttendees: 100,
      currentAttendees: 23,
      ticketPrice: 15,
      status: 'PUBLISHED',
      isPublished: true,
      isFeatured: true,
      views: 342,
      registrations: 23,
    },
  })

  const yogaEvent = await prisma.event.create({
    data: {
      businessId: b3.id,
      featuredWaveLeaderId: waveLeaderSarah.id,
      title: 'Sunrise Yoga & Meditation',
      description:
        'Start your day with peaceful yoga and guided meditation in the park. All levels welcome! Bring your own mat or rent one from us.',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      category: 'WELLNESS',
      tags: ['yoga', 'meditation', 'outdoor', 'morning'],
      highlights: ['Guided sunrise flow', 'Breathwork intro', 'Closing meditation'],
      whatsIncluded: ['Certified instructor', 'Optional mat rental ($5)'],
      whatToBring: ['Water bottle', 'Towel', 'Sunscreen', 'Comfortable layers'],
      venueName: 'Central Park - Great Lawn',
      address: 'Central Park, New York, NY',
      latitude: 40.7829,
      longitude: -73.9654,
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 90 * 60 * 1000),
      requiresRegistration: true,
      maxAttendees: 50,
      currentAttendees: 12,
      ticketPrice: 0,
      waveLeaderRate: 100,
      status: 'PUBLISHED',
      isPublished: true,
      views: 156,
      registrations: 12,
    },
  })

  await prisma.event.create({
    data: {
      businessId: b2.id,
      title: 'Authentic Italian Pasta Making Workshop',
      description:
        'Learn the art of making fresh pasta from scratch! Our chef will guide you through creating fettuccine, ravioli, and pappardelle. Includes wine pairing and dinner.',
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800',
      category: 'FOOD_DRINK',
      tags: ['cooking', 'italian', 'workshop', 'food'],
      latitude: Number(b2.latitude),
      longitude: Number(b2.longitude),
      startDate: nextWeek,
      endDate: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000),
      requiresRegistration: true,
      maxAttendees: 20,
      currentAttendees: 18,
      ticketPrice: 75,
      registrationDeadline: new Date(nextWeek.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      isPublished: true,
      views: 234,
      registrations: 18,
    },
  })

  await prisma.event.create({
    data: {
      businessId: b1.id,
      title: 'Tech Professionals Networking Mixer',
      description:
        'Connect with fellow tech professionals over coffee and cocktails. Great opportunity to expand your network and discuss industry trends.',
      imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
      category: 'NETWORKING',
      tags: ['networking', 'tech', 'professionals', 'social'],
      latitude: Number(b1.latitude),
      longitude: Number(b1.longitude),
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      requiresRegistration: true,
      maxAttendees: null,
      currentAttendees: 45,
      ticketPrice: 0,
      status: 'PUBLISHED',
      isPublished: true,
      views: 512,
      registrations: 45,
    },
  })

  await prisma.event.create({
    data: {
      businessId: b4.id,
      featuredWaveLeaderId: waveLeaderMarcus.id,
      title: 'HIIT Bootcamp Challenge - Online',
      description:
        'High-intensity interval training from the comfort of your home! 45-minute full-body workout led by our certified trainer.',
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      category: 'SPORTS',
      tags: ['fitness', 'HIIT', 'virtual', 'workout'],
      isVirtual: true,
      virtualLink: 'https://zoom.us/j/123456789',
      latitude: Number(b4.latitude),
      longitude: Number(b4.longitude),
      startDate: tomorrow,
      endDate: new Date(tomorrow.getTime() + 45 * 60 * 1000),
      requiresRegistration: true,
      maxAttendees: 100,
      currentAttendees: 67,
      ticketPrice: 10,
      waveLeaderRate: 150,
      status: 'PUBLISHED',
      isPublished: true,
      views: 423,
      registrations: 67,
    },
  })

  await prisma.event.create({
    data: {
      businessId: b0.id,
      title: 'Summer Beer Festival 2026',
      description:
        'Annual summer beer festival featuring 50+ craft breweries. Food trucks, live music, and more!',
      category: 'FOOD_DRINK',
      tags: ['beer', 'festival', 'summer'],
      latitude: Number(b0.latitude),
      longitude: Number(b0.longitude),
      startDate: nextMonth,
      endDate: new Date(nextMonth.getTime() + 8 * 60 * 60 * 1000),
      maxAttendees: 500,
      ticketPrice: 35,
      status: 'DRAFT',
      isPublished: false,
    },
  })

  console.log('✅ Sample events created')

  console.log('👥 Creating event attendees...')
  await prisma.eventAttendee.create({
    data: {
      eventId: musicEvent.id,
      userId: baseUser.id,
      status: 'CONFIRMED',
      ticketsPurchased: 2,
      totalPaid: 30,
    },
  })
  await prisma.eventAttendee.create({
    data: {
      eventId: yogaEvent.id,
      userId: baseUser.id,
      status: 'REGISTERED',
      ticketsPurchased: 1,
    },
  })
  console.log('✅ Event attendees created')

  // Create sample check-ins for test user
  console.log('📍 Creating sample check-ins...')
  const createdBusinessesList = await prisma.business.findMany()
  const approvedBusinesses = createdBusinessesList.filter((b) => b.approvalStatus === 'APPROVED')
  const regularUsers = [baseUser, ...extraUsers]

  if (regularUsers.length > 0 && approvedBusinesses.length > 0) {
    // Create check-ins with different dates (spread over last 30 days)
    const checkInDates = [
      new Date(), // Today
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
    ]

    const methods: Array<'GEOFENCE' | 'QR_CODE' | 'MANUAL'> = ['GEOFENCE', 'QR_CODE', 'MANUAL']

    for (let i = 0; i < Math.min(checkInDates.length, approvedBusinesses.length); i++) {
      await prisma.checkIn.create({
        data: {
          userId: baseUser.id,
          businessId: approvedBusinesses[i].id,
          method: methods[i % methods.length],
          points: 10 + (i === 0 ? 5 : 0), // Bonus for today
          createdAt: checkInDates[i],
        },
      })
    }

    // Create additional check-ins for other users
    if (regularUsers.length > 1 && approvedBusinesses.length > 2) {
      await prisma.checkIn.create({
        data: {
          userId: regularUsers[1]?.id || regularUsers[0].id,
          businessId: approvedBusinesses[0].id,
          method: 'QR_CODE',
          points: 10,
        },
      })

      await prisma.checkIn.create({
        data: {
          userId: regularUsers[1]?.id || regularUsers[0].id,
          businessId: approvedBusinesses[1]?.id || approvedBusinesses[0].id,
          method: 'MANUAL',
          points: 10,
        },
      })
    }

    console.log('✅ Created sample check-ins')
  }

  // Create community memberships for test users
  console.log('🏘️ Creating community memberships...')
  const nightlifeComm = createdCommunities[2] // Nightlife & Entertainment
  const foodComm = createdCommunities[1] // Food & Beverage

  if (createdCommunities.length > 0) {
    // Join base user (regular user) to communities
    await prisma.communityMembership.create({
      data: {
        userId: baseUser.id,
        communityId: createdCommunities[0].id, // Outdoor Enthusiasts
        isAvailable: false,
      },
    })
    await prisma.communityMembership.create({
      data: {
        userId: baseUser.id,
        communityId: nightlifeComm.id,
        isAvailable: false,
      },
    })
    await prisma.communityMembership.create({
      data: {
        userId: baseUser.id,
        communityId: foodComm.id,
        isAvailable: false,
      },
    })

    // Join WaveLeader to communities as member
    await prisma.communityMembership.create({
      data: {
        userId: waveLeaderUser.id,
        communityId: nightlifeComm.id,
        isAvailable: true,
      },
    })
    await prisma.communityMembership.create({
      data: {
        userId: waveLeaderUser.id,
        communityId: foodComm.id,
        isAvailable: true,
      },
    })

    // Join extra users to some communities
    if (extraUsers.length > 0 && extraUsers[0]) {
      await prisma.communityMembership.create({
        data: {
          userId: extraUsers[0].id,
          communityId: foodComm.id,
          isAvailable: false,
        },
      })
    }
    console.log('✅ WaveLeader and communities seeded')
  }

  // Create favorites for test user
  console.log('❤️ Creating favorites...')
  if (approvedBusinesses.length > 0) {
    // Add first 5 businesses as favorites
    for (let i = 0; i < Math.min(5, approvedBusinesses.length); i++) {
      await prisma.favorite.create({
        data: {
          userId: baseUser.id,
          businessId: approvedBusinesses[i].id,
        },
      })
    }
    console.log('✅ Created favorites')
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