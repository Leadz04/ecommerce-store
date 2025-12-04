import connectDB from './mongodb';
import Role from '@/models/Role';
import User from '@/models/User';
import { ROLE_PERMISSIONS } from './permissions';

export async function seedRoles() {
  try {
    await connectDB();
    
    console.log('🌱 Seeding roles and permissions...');
    
    // Create roles
    const roles = [
      {
        name: 'SUPER_ADMIN',
        description: 'Full system access with all permissions',
        permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
        isActive: true
      },
      {
        name: 'ADMIN',
        description: 'Administrative access with most permissions',
        permissions: ROLE_PERMISSIONS.ADMIN,
        isActive: true
      },
      {
        name: 'MANAGER',
        description: 'Management access for day-to-day operations',
        permissions: ROLE_PERMISSIONS.MANAGER,
        isActive: true
      },
      {
        name: 'STAFF',
        description: 'Staff access for basic operations',
        permissions: ROLE_PERMISSIONS.STAFF,
        isActive: true
      },
      {
        name: 'CUSTOMER',
        description: 'Customer access with limited permissions',
        permissions: ROLE_PERMISSIONS.CUSTOMER,
        isActive: true
      }
    ];

    // Insert or update roles and update users with those roles
    for (const roleData of roles) {
      const updatedRole = await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
      console.log(`✅ Role ${roleData.name} created/updated`);
      
      // Update all users with this role to have the updated permissions
      if (updatedRole) {
        const usersWithRole = await User.find({ role: updatedRole._id });
        if (usersWithRole.length > 0) {
          await User.updateMany(
            { role: updatedRole._id },
            { permissions: roleData.permissions }
          );
          console.log(`✅ Updated ${usersWithRole.length} users with ${roleData.name} role permissions`);
        }
      }
    }

    // Create default super admin user if it doesn't exist
    const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
    if (superAdminRole) {
      const existingSuperAdmin = await User.findOne({ email: 'testleadz04@gmail.com' });
      
      if (!existingSuperAdmin) {
        const superAdminUser = new User({
          name: 'Super Admin',
          email: 'testleadz04@gmail.com',
          password: 'admin123', // This will be hashed by the pre-save hook
          role: superAdminRole._id,
          permissions: ROLE_PERMISSIONS.SUPER_ADMIN,
          isEmailVerified: true,
          isActive: true,
          settings: {
            emailNotifications: true,
            smsNotifications: false,
            theme: 'system',
            language: 'en'
          }
        });

        await superAdminUser.save();
        console.log('✅ Default super admin user created (testleadz04@gmail.com / admin123)');
      } else {
        // Update existing user to have super admin role
        existingSuperAdmin.role = superAdminRole._id;
        existingSuperAdmin.permissions = ROLE_PERMISSIONS.SUPER_ADMIN;
        await existingSuperAdmin.save();
        console.log('✅ Existing user updated to super admin role');
      }
    }

    // Update existing users without roles to have CUSTOMER role
    const customerRole = await Role.findOne({ name: 'CUSTOMER' });
    if (customerRole) {
      const usersWithoutRoles = await User.find({ 
        $or: [
          { role: { $exists: false } },
          { role: null },
          { permissions: { $exists: false } },
          { permissions: { $size: 0 } }
        ]
      });

      for (const user of usersWithoutRoles) {
        user.role = customerRole._id;
        user.permissions = ROLE_PERMISSIONS.CUSTOMER;
        user.isActive = true;
        await user.save();
      }

      if (usersWithoutRoles.length > 0) {
        console.log(`✅ Updated ${usersWithoutRoles.length} users with CUSTOMER role`);
      }

      // Create demo user (john@example.com) if it doesn't exist
      const existingDemoUser = await User.findOne({ email: 'john@example.com' });
      if (!existingDemoUser) {
        const demoUser = new User({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123', // This will be hashed by the pre-save hook
          role: customerRole._id,
          permissions: ROLE_PERMISSIONS.CUSTOMER,
          isEmailVerified: true,
          isActive: true,
          settings: {
            emailNotifications: true,
            smsNotifications: false,
            theme: 'system',
            language: 'en'
          }
        });

        await demoUser.save();
        console.log('✅ Demo user created (john@example.com / password123)');
      } else {
        // Ensure demo user has CUSTOMER role
        existingDemoUser.role = customerRole._id;
        existingDemoUser.permissions = ROLE_PERMISSIONS.CUSTOMER;
        existingDemoUser.isActive = true;
        await existingDemoUser.save();
        console.log('✅ Demo user updated with CUSTOMER role');
      }
    }

    console.log('🎉 Roles and permissions seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    throw error;
  }
}

// Function to get user with role and permissions
export async function getUserWithRole(userId: string) {
  try {
    await connectDB();
    
    const user = await User.findById(userId)
      .populate('role', 'name description permissions')
      .select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }

    // If user has a role, use role permissions, otherwise use user's direct permissions
    const permissions = user.role && (user.role as any).permissions 
      ? (user.role as any).permissions 
      : user.permissions;

    return {
      ...user.toObject(),
      permissions
    };
  } catch (error) {
    console.error('Error getting user with role:', error);
    throw error;
  }
}
