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

    // Insert or update roles
    for (const roleData of roles) {
      await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true }
      );
      console.log(`✅ Role ${roleData.name} created/updated`);
    }

    // Create default super admin user if it doesn't exist
    const superAdminRole = await Role.findOne({ name: 'SUPER_ADMIN' });
    if (superAdminRole) {
      const existingSuperAdmin = await User.findOne({ email: 'admin@shopease.com' });
      
      if (!existingSuperAdmin) {
        const superAdminUser = new User({
          name: 'Super Admin',
          email: 'admin@shopease.com',
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
        console.log('✅ Default super admin user created (admin@shopease.com / admin123)');
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
