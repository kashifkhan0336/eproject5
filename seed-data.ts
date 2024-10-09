import { KeystoneContext } from '@keystone-6/core/types';

async function seed(context: KeystoneContext) {
  console.log('🌱 Seeding initial data...');

  // Check if any users exist already
  const existingUsers = await context.db.User.findMany();
  if (existingUsers.length === 0) {
    console.log('No users found, creating a new admin user...');

    // Create an admin user with predefined credentials
    const adminUser = await context.db.User.createOne({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // Ensure to use a secure password in production
        role: 'manager',
      },
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);
  } else {
    console.log('Users already exist, skipping user seeding...');
  }

  // Seed Guests
  const existingGuests = await context.db.Guest.findMany();
  if (existingGuests.length === 0) {
    console.log('No guests found, creating sample guests...');

    const guests = await context.db.Guest.createMany({
      data: [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          contactNumber: '1234567890',
          preferences: 'Late check-in, Non-smoking room',
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          contactNumber: '0987654321',
          preferences: 'Allergy-friendly bedding',
        },
        {
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          contactNumber: '5551234567',
          preferences: 'Early check-in',
        },
        {
          name: 'Bob Brown',
          email: 'bob.brown@example.com',
          contactNumber: '5559876543',
          preferences: 'Vegetarian meal',
        },
      ],
    });

    console.log(`✅ Created guests: ${guests.map(guest => guest.name).join(', ')}`);
  } else {
    console.log('Guests already exist, skipping guest seeding...');
  }

  // Seed Rooms
  const existingRooms = await context.db.Room.findMany();
  if (existingRooms.length === 0) {
    console.log('No rooms found, creating sample rooms...');

    const rooms = await context.db.Room.createMany({
      data: [
        {
          roomNumber: 101,
          roomType: 'single',
          pricePerNight: 10000, // Price in cents ($100.00)
          status: 'available',
        },
        {
          roomNumber: 102,
          roomType: 'double',
          pricePerNight: 15000, // Price in cents ($150.00)
          status: 'available',
        },
        {
          roomNumber: 201,
          roomType: 'suite',
          pricePerNight: 25000, // Price in cents ($250.00)
          status: 'available',
        },
        {
          roomNumber: 202,
          roomType: 'suite',
          pricePerNight: 30000, // Price in cents ($300.00)
          status: 'available',
        },
      ],
    });

    console.log(`✅ Created rooms: ${rooms.map(room => room.roomNumber).join(', ')}`);
  } else {
    console.log('Rooms already exist, skipping room seeding...');
  }

  // Seed Bookings
  const existingBookings = await context.db.Booking.findMany();
  if (existingBookings.length === 0) {
    console.log('No bookings found, creating sample bookings...');

    const bookings = await context.db.Booking.createMany({
      data: [
        {
          guest: { connect: { email: 'john.doe@example.com' } },
          room: { connect: { roomNumber: 101 } },
          checkInDate: new Date('2024-10-10').toISOString().split('T')[0],
          checkOutDate: new Date('2024-10-15').toISOString().split('T')[0],
          status: 'booked',
        },
        {
          guest: { connect: { email: 'jane.smith@example.com' } },
          room: { connect: { roomNumber: 102 } },
          checkInDate: new Date('2024-10-12').toISOString().split('T')[0],
          checkOutDate: new Date('2024-10-20').toISOString().split('T')[0],
          status: 'booked',
        },
        {
          guest: { connect: { email: 'alice.johnson@example.com' } },
          room: { connect: { roomNumber: 201 } },
          checkInDate: new Date('2024-10-15').toISOString().split('T')[0],
          checkOutDate: new Date('2024-10-22').toISOString().split('T')[0],
          status: 'booked',
        },
        {
          guest: { connect: { email: 'bob.brown@example.com' } },
          room: { connect: { roomNumber: 202 } },
          checkInDate: new Date('2024-10-18').toISOString().split('T')[0],
          checkOutDate: new Date('2024-10-25').toISOString().split('T')[0],
          status: 'booked',
        },
      ],
    });

    console.log(`✅ Created bookings: ${bookings.length}`);
  } else {
    console.log('Bookings already exist, skipping booking seeding...');
  }

 

  // Seed Services
  const existingServices = await context.db.Service.findMany();
  if (existingServices.length === 0) {
    console.log('No services found, creating sample services...');

    const services = await context.db.Service.createMany({
      data: [
        {
          serviceName: 'Room Service',
          serviceType: 'room_service',
          price: 2000, // Price in cents ($20.00)
        },
        {
          serviceName: 'Food and Beverage',
          serviceType: 'food_beverage',
          price: 1500, // Price in cents ($15.00)
        },
        {
          serviceName: 'Transport',
          serviceType: 'transport',
          price: 3000, // Price in cents ($30.00)
        },
      ],
    });

    console.log(`✅ Created services: ${services.map(service => service.serviceType).join(', ')}`);
  } else {
    console.log('Services already exist, skipping service seeding...');
  }

  // Seed Reviews
  const existingReviews = await context.db.Feedback.findMany();
  if (existingReviews.length === 0) {
    console.log('No reviews found, creating sample reviews...');

    const reviews = await context.db.Feedback.createMany({
      data: [
        {
          guest: { connect: { email: 'john.doe@example.com' } },
          rating: 5,
          comments: 'Excellent stay! The room was clean and the staff was friendly.',
        },
        {
          guest: { connect: { email: 'jane.smith@example.com' } },
          rating: 4,
          comments: 'Great location and comfortable beds, but the Wi-Fi was slow.',
        },
      ],
    });

    console.log(`✅ Created reviews: ${reviews.length}`);
  } else {
    console.log('Reviews already exist, skipping review seeding...');
  }

  // Additional lists can be seeded in a similar manner...

  console.log('🌱 Seed complete.');
}

export default seed;
