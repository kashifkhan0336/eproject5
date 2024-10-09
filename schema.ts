import { list } from '@keystone-6/core';
import { text, checkbox, password, timestamp, select, relationship, integer, calendarDay, image } from '@keystone-6/core/fields';
import { allowAll } from '@keystone-6/core/access';
import { type Lists } from '.keystone/types';

type Role = 'manager' | 'receptionist' | 'housekeeping' | 'maintenance';
type Operation = 'create' | 'read' | 'update' | 'delete';

type Session = {
  data: {
    id: string;
    role: Role;
  }
}

// Role-based permission checks
const permissions: Record<Role, Operation[]> = {
  manager: ['create', 'read', 'update', 'delete'],
  receptionist: ['create', 'read', 'update'],
  housekeeping: ['read', 'update'],
  maintenance: ['read', 'update']
};

// Helper functions for access control
const hasPermission = (session: Session | undefined, operation: Operation): boolean => {
  if (!session?.data.role) return false;
  return permissions[session.data.role].includes(operation);
};

const isManager = ({ session }: { session?: Session }) => 
  session?.data.role === 'manager';

const canManageUsers = ({ session }: { session?: Session }) => 
  isManager({ session });

const canManageBookings = ({ session }: { session?: Session }) => 
  session?.data.role === 'manager' || session?.data.role === 'receptionist';

const canManageHousekeeping = ({ session }: { session?: Session }) => 
  ['manager', 'housekeeping'].includes(session?.data.role || '');

const canManageMaintenance = ({ session }: { session?: Session }) => 
  ['manager', 'maintenance'].includes(session?.data.role || '');

// UI visibility helpers
const hideUI = ({ session }: { session?: Session }) => false;

export const lists: Lists = {
  // User list for staff accounts
  User: list({
    
    access: {
      operation: {
        query: () => true,
        create: canManageUsers,
        update: canManageUsers,
        delete: isManager,
      },
      filter: {
        query: ({ session }) => {
          if (!session?.data.role) return false;
          if (session.data.role === 'manager') return true;
          return { role: { not: { equals: 'manager' } } };
        }
      }
    },
    ui: {
      isHidden: ({ session }) => !isManager({ session }),
      // Hide the entire User section from non-managers
      hideCreate: ({ session }) => !isManager({ session }),
      hideDelete: ({ session }) => !isManager({ session }),
      listView: {
        initialColumns: ['name', 'email', 'role'],
      },
    },
    fields: {
      name: text({
        validation: { isRequired: true },
        ui: {
          createView: { fieldMode: ({ session }) => 
            isManager({ session }) ? 'edit' : 'hidden' 
          },
          itemView: { fieldMode: ({ session }) =>
            isManager({ session }) ? 'edit' : 'read'
          },
        },
      }),
      email: text({
        validation: { isRequired: true },
        isIndexed: 'unique',
        ui: {
          createView: { fieldMode: ({ session }) => 
            isManager({ session }) ? 'edit' : 'hidden' 
          },
          itemView: { fieldMode: ({ session }) =>
            isManager({ session }) ? 'edit' : 'read'
          },
        },
      }),
      password: password({
        validation: { isRequired: true },
        ui: {
          createView: { fieldMode: ({ session }) => 
            isManager({ session }) ? 'edit' : 'hidden' 
          },
          itemView: { fieldMode: ({ session }) =>
            isManager({ session }) ? 'edit' : 'hidden'
          },
        },
      }),
      role: select({
        options: [
          { label: 'Manager', value: 'manager' },
          { label: 'Receptionist', value: 'receptionist' },
          { label: 'Housekeeping', value: 'housekeeping' },
          { label: 'Maintenance', value: 'maintenance' },
        ],
        validation: { isRequired: true },
        ui: {
          displayMode: 'select',
          createView: { fieldMode: ({ session }) => 
            isManager({ session }) ? 'edit' : 'hidden' 
          },
          itemView: { fieldMode: ({ session }) =>
            isManager({ session }) ? 'edit' : 'read'
          },
        },
      }),
      createdAt: timestamp({
        defaultValue: { kind: 'now' },
      }),
    },
  }),
  // Guest list
  // Guest list
  Guest: list({
    access: allowAll,
    fields: {
      name: text({ validation: { isRequired: true } }),
      email: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
      contactNumber: text({ validation: { isRequired: true } }),  // Guest contact number
      preferences: text({ ui: { displayMode: 'textarea' } }),  // Guest preferences
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
      feedback: relationship({ ref: 'Feedback.guest', many: true }),  // Link to feedback given by the guest
    },
  }),


  // Room list with room image
  Room: list({
    access: {
      operation: {
        create: isManager,
        query: () => true,
        update: ({ session }) => hasPermission(session, 'update'),
        delete: isManager,
      }
    },
    fields: {
      roomNumber: integer({
        validation: { isRequired: true },
        isIndexed: 'unique',
        ui: {
          createView: { fieldMode: ({ session }) => 
            isManager({ session }) ? 'edit' : 'hidden' 
          },
          itemView: { fieldMode: ({ session }) =>
            isManager({ session }) ? 'edit' : 'read'
          },
        },
      }),  // Room number instead of relying on ID
      roomType: select({
        options: [
          { label: 'Single', value: 'single' },
          { label: 'Double', value: 'double' },
          { label: 'Suite', value: 'suite' },
        ],
        validation: { isRequired: true },
      }),
      pricePerNight: integer({
        validation: { isRequired: true },
        ui: { description: 'Price in cents (e.g., 10000 for $100.00)' }
      }),
      status: select({
        options: [
          { label: 'Available', value: 'available' },
          { label: 'Occupied', value: 'occupied' },
          { label: 'Cleaning', value: 'cleaning' },
          { label: 'Maintenance', value: 'maintenance' },
        ],
        ui: {
          createView: { fieldMode: ({ session }) => 
            isManager({ session }) ? 'edit' : 'hidden' 
          },
          itemView: { fieldMode: ({ session, item }) => {
            if (isManager({ session })) return 'edit';
            if (session?.data.role === 'housekeeping' && item.status === 'cleaning') return 'edit';
            if (session?.data.role === 'maintenance' && item.status === 'maintenance') return 'edit';
            return 'read';
          }},
        },
      }),
      roomImage: image({ storage: 'media_assets' }),
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),


  // Booking list for reservation and check-in/out management
  Booking: list({
    access: {
      operation: {
        create: canManageBookings,
        query: () => true,
        update: canManageBookings,
        delete: isManager,
      }
    },
    ui: {
      hideCreate: ({ session }) => !canManageBookings({ session }),
      hideDelete: ({ session }) => !isManager({ session }),
      isHidden: ({ session }) => !canManageBookings({ session }),
      listView: {
        initialColumns: ['guest', 'room', 'checkInDate', 'checkOutDate', 'status'],
      },
    },
    fields: {
      guest: relationship({ ref: 'Guest', many: false }),
      room: relationship({
        ref: 'Room',
        many: false,
        ui: {
          labelField: 'roomNumber',  // Show roomNumber instead of id
        },
      }),  // Select room by roomNumber, not id
      services: relationship({ ref: 'Service', many: true,ui:{labelField:'serviceName'}}),
      checkInDate: calendarDay({ validation: { isRequired: true } }),
      checkOutDate: calendarDay({ validation: { isRequired: true } }),
      expenses: relationship({ ref: 'Expense.booking', many: true }),
      status: select({
        options: [
          { label: 'Booked', value: 'booked' },
          { label: 'Checked-In', value: 'checked_in' },
          { label: 'Checked-Out', value: 'checked_out' },
        ],
        defaultValue: 'booked',
        validation: { isRequired: true },
      }),
      totalAmount: integer({ ui: { description: 'Total amount in cents (e.g., 25000 for $250.00)' } }),
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
    hooks: {
      afterOperation: async ({ operation, item, context }) => {
        if (operation === 'update') {
          const roomId = item.roomId;
          const room = await context.db.Room.findOne({
            where: { id: roomId },
          });
          if (room) {
            if (item.status == 'checked_in') {

              await context.db.Room.updateOne({
                where: { id: roomId }, data: {
                  status: 'occupied'
                }

              })
            }

            console.log(`Booking created. ${room.roomNumber} is now ${item.status}`)
          }
        }
      }
    }
    // hooks: {
    //   afterChange: async ({ updatedItem, context }) => {
    //     if (updatedItem.status === 'checked_in') {
    //       const roomId = updatedItem.room;

    //       await context.db.Room.updateOne({
    //         where: { id: roomId },
    //         data: { status: 'occupied' },
    //       });
    //     }

    //     if (updatedItem.status === 'checked_out') {
    //       const roomId = updatedItem.room;

    //       await context.db.Room.updateOne({
    //         where: { id: roomId },
    //         data: { status: 'available' },
    //       });
    //     }
    //   },
    // },
  }),

  Expense: list({
    access: allowAll,
    fields: {
      description: text({ validation: { isRequired: true } }), // Expense description
      amount: integer({ validation: { isRequired: true } }), // Expense amount in cents
      booking: relationship({ ref: 'Booking.expenses' }), // Link to the booking
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),
  // Service list for additional services like food, laundry, etc.
  Service: list({
    access: allowAll,
    fields: {
      serviceName: text({ validation: { isRequired: true } }),  // Name of the service (e.g., Laundry, Spa)
      serviceType: select({
        options: [
          { label: 'Room Service', value: 'room_service' },
          { label: 'Laundry', value: 'laundry' },
          { label: 'Spa', value: 'spa' },
          { label: 'Food and Beverage', value: 'food_beverage' },
          { label: 'Transport', value: 'transport' },
        ],
        validation: { isRequired: true },
        ui: { displayMode: 'select' },
      }),  // Type of service (e.g., Laundry, Spa)
      price: integer({
        validation: { isRequired: true },
        ui: { description: 'Price in cents (e.g., 5000 for $50.00)' }
      }),  // Price of the service
      duration: integer({
        ui: { description: 'Duration in minutes (e.g., 60 for a 1-hour spa treatment)' },
        validation: { isRequired: false },
      }),  // Duration (applicable for services like Spa, Transport, etc.)
      description: text({
        ui: { displayMode: 'textarea' },
      }),  // Description of the service
      isRecurring: checkbox({
        defaultValue: false,
        ui: { description: 'Is this service recurring (e.g., daily cleaning or weekly laundry)?' },
      }),  // Whether the service is recurring
      availability: select({
        options: [
          { label: 'Available', value: 'available' },
          { label: 'Unavailable', value: 'unavailable' },
        ],
        defaultValue: 'available',
      }),  // Availability of the service
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),

  // Housekeeping list to track room cleaning status and tasks
  Housekeeping: list({
    access: {
      operation: {
        create: canManageHousekeeping,
        query: () => true,
        update: canManageHousekeeping,
        delete: isManager,
      }
    },
    ui: {
      hideCreate: ({ session }) => !canManageHousekeeping({ session }),
      hideDelete: ({ session }) => !isManager({ session }),
      isHidden: ({ session }) => !canManageHousekeeping({ session }),
      listView: {
        initialColumns: ['room', 'staff', 'status', 'comments'],
      },
    },
    fields: {
      room: relationship({ ref: 'Room', many: false }),  // Link to the room being cleaned
      staff: relationship({ ref: 'User', many: false }),  // Staff performing the cleaning
      status: select({
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
        ],
        defaultValue: 'pending',
      }),
      comments: text({ ui: { displayMode: 'textarea' } }),
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),

  // Maintenance Request list for reporting and managing maintenance issues
  MaintenanceRequest: list({
    access: {
      operation: {
        create: () => true,
        query: () => true,
        update: canManageMaintenance,
        delete: isManager,
      }
    },
    ui: {
      hideCreate: false, // Anyone can create maintenance requests
      hideDelete: ({ session }) => !isManager({ session }),
      isHidden: ({ session }) => !canManageMaintenance({ session }),
      listView: {
        initialColumns: ['room', 'description', 'status', 'reportedBy'],
      },
    },
    fields: {
      room: relationship({ ref: 'Room', many: false }),  // Link to the room with the issue
      reportedBy: relationship({ ref: 'User', many: false }),  // Guest or staff reporting the issue
      description: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),
      status: select({
        options: [
          { label: 'Reported', value: 'reported' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' },
        ],
        defaultValue: 'reported',
      }),
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),

  // Service Request list for tracking service requests made by guests
  ServiceRequest: list({
    access: allowAll,
    fields: {
      guest: relationship({ ref: 'Guest', many: false }),  // Link to the guest who requested the service
      service: relationship({ ref: 'Service', many: false }), // Link to the requested service
      status: select({
        options: [
          { label: 'Requested', value: 'requested' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
        defaultValue: 'requested',
      }),  // Status of the service request
      comments: text({ ui: { displayMode: 'textarea' } }),  // Additional comments
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),  // Timestamp of the request
    },
  }),

  // Feedback list for guest feedback
  // Feedback list for guest feedback
  // Feedback list for guest feedback
  Feedback: list({
    access: allowAll,
    fields: {
      guest: relationship({ ref: 'Guest.feedback', many: false }),  // Link to the guest providing feedback
      rating: integer({
        validation: {
          isRequired: true,
          min: 1,
          max: 10,
        },
      }), // Rating given by the guest
      comments: text({ ui: { displayMode: 'textarea' } }),  // Feedback comments
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),

  // Support Request list for guest support queries
  SupportRequest: list({
    access: allowAll,
    fields: {
      guest: relationship({ ref: 'Guest', many: false }),  // Link to the guest submitting the support request
      subject: text({ validation: { isRequired: true } }),  // Subject of the support request
      description: text({ validation: { isRequired: true }, ui: { displayMode: 'textarea' } }),  // Description of the issue
      status: select({
        options: [
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Closed', value: 'closed' },
        ],
        defaultValue: 'open',
      }),  // Status of the support request
      createdAt: timestamp({ defaultValue: { kind: 'now' } }),
    },
  }),
};
