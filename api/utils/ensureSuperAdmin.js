import User from '../_models/User.js';

const SUPER_ADMIN_EMAIL = 'er.paritoshsaha@gmail.com';

/**
 * Ensures strict role integrity on startup/connection:
 * 1. er.paritoshsaha@gmail.com is the ONE AND ONLY role="super_admin"
 * 2. Any other account marked as super_admin or master_admin is converted to normal admin
 * 3. admin@khroniq.com is named "Khroniq Admin" (never "Master Admin") and has role="admin"
 * 4. Safe and idempotent: does not duplicate, does not overwrite passwords or permissions
 */
export async function ensureSuperAdminRoleIntegrity() {
  try {
    // 1. Ensure the sole Super Admin
    const superAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (superAdmin) {
      const updates = {};
      if (superAdmin.role !== 'super_admin') updates.role = 'super_admin';
      if (!superAdmin.isActive) updates.isActive = true;
      if (!superAdmin.name || superAdmin.name === 'Admin User') updates.name = 'Super Admin';

      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: superAdmin._id }, { $set: updates });
        console.log(`[AUTH-INIT] Ensured ${SUPER_ADMIN_EMAIL} is role="super_admin"`);
      }
    }

    // 2. Ensure admin@khroniq.com is a normal admin and never named "Master Admin"
    const khroniqAdmin = await User.findOne({ email: 'admin@khroniq.com' });
    if (khroniqAdmin) {
      const updates = {};
      if (khroniqAdmin.role !== 'admin') updates.role = 'admin';
      if (khroniqAdmin.name === 'Master Admin' || !khroniqAdmin.name) updates.name = 'Khroniq Admin';

      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: khroniqAdmin._id }, { $set: updates });
        console.log('[AUTH-INIT] Normalized admin@khroniq.com to role="admin"');
      }
    }

    // 3. Ensure no other accounts have super_admin or master_admin role
    await User.updateMany(
      {
        email: { $ne: SUPER_ADMIN_EMAIL },
        role: { $in: ['super_admin', 'master_admin'] }
      },
      { $set: { role: 'admin' } }
    );
  } catch (err) {
    console.error('[AUTH-INIT] Error maintaining Super Admin role integrity:', err.message);
  }
}

export default ensureSuperAdminRoleIntegrity;
