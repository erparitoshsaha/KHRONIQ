import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  updateAdminPermissions,
  toggleAdminStatus,
  resetAdminPassword,
  deleteAdminUser,
  fetchAdminUserSessions
} from '../../store/slices/watchSlice';
import { PERMISSION_LIST, DEFAULT_LOCATIONS } from '../../constants/permissions';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit2,
  KeyRound,
  Trash2,
  Power,
  Sliders,
  Smartphone,
  Monitor,
  Laptop,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  AlertTriangle,
  X,
  Lock,
  Mail,
  User,
  MapPin,
  Clock,
  Shield
} from 'lucide-react';

export default function AdminManagement() {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.watch.currentUser);
  const adminUsers = useSelector(state => state.watch.adminUsers || []);
  const loading = useSelector(state => state.watch.adminUsersLoading);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all | super_admin | admin
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | disabled

  // Feedback Notification
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [permissionsAdmin, setPermissionsAdmin] = useState(null);
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState(null);
  const [statusPromptAdmin, setStatusPromptAdmin] = useState(null);
  const [deletePromptAdmin, setDeletePromptAdmin] = useState(null);
  const [sessionsAdmin, setSessionsAdmin] = useState(null);
  const [adminSessionsList, setAdminSessionsList] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: DEFAULT_LOCATIONS[0].name,
    locationId: DEFAULT_LOCATIONS[0].id,
    permissions: []
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    location: '',
    locationId: '',
    isActive: true,
    password: ''
  });

  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  // Filtered admin users
  const filteredAdmins = adminUsers.filter(admin => {
    const matchesSearch =
      admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && admin.isActive !== false) ||
      (statusFilter === 'disabled' && admin.isActive === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle Create Admin
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      showFeedback('error', 'Passwords do not match.');
      return;
    }
    if (createForm.password.length < 8) {
      showFeedback('error', 'Password must be at least 8 characters long.');
      return;
    }

    setActionLoading(true);
    const res = await dispatch(createAdminUser(createForm));
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', `Admin account '${createForm.name}' created successfully.`);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: DEFAULT_LOCATIONS[0].name,
        locationId: DEFAULT_LOCATIONS[0].id,
        permissions: []
      });
    } else {
      showFeedback('error', res.message || 'Failed to create admin account.');
    }
  };

  // Handle Edit Admin
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    const payload = {
      name: editForm.name,
      email: editForm.email,
      location: editForm.location,
      locationId: editForm.locationId,
      isActive: editForm.isActive
    };

    if (editForm.password && editForm.password.trim()) {
      if (editForm.password.trim().length < 8) {
        showFeedback('error', 'New password must be at least 8 characters long.');
        return;
      }
      payload.password = editForm.password.trim();
    }

    setActionLoading(true);
    const res = await dispatch(updateAdminUser(editingAdmin.id || editingAdmin._id, payload));
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', 'Admin profile updated successfully.');
      setEditingAdmin(null);
    } else {
      showFeedback('error', res.message || 'Failed to update admin profile.');
    }
  };

  // Handle Permissions Submit
  const handlePermissionsSubmit = async () => {
    if (!permissionsAdmin) return;

    setActionLoading(true);
    const res = await dispatch(
      updateAdminPermissions(permissionsAdmin.id || permissionsAdmin._id, selectedPermissions)
    );
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', `Permissions for ${permissionsAdmin.name} updated successfully.`);
      setPermissionsAdmin(null);
    } else {
      showFeedback('error', res.message || 'Failed to update permissions.');
    }
  };

  // Handle Toggle Status
  const handleToggleStatusConfirm = async () => {
    if (!statusPromptAdmin) return;
    const newStatus = !statusPromptAdmin.isActive;

    setActionLoading(true);
    const res = await dispatch(
      toggleAdminStatus(statusPromptAdmin.id || statusPromptAdmin._id, newStatus)
    );
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', `Admin account ${newStatus ? 'activated' : 'disabled'}.`);
      setStatusPromptAdmin(null);
    } else {
      showFeedback('error', res.message || 'Failed to change admin status.');
    }
  };

  // Handle Password Reset
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showFeedback('error', 'Passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showFeedback('error', 'Password must be at least 8 characters long.');
      return;
    }

    setActionLoading(true);
    const res = await dispatch(
      resetAdminPassword(
        resetPasswordAdmin.id || resetPasswordAdmin._id,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      )
    );
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', `Password for ${resetPasswordAdmin.name} reset successfully.`);
      setResetPasswordAdmin(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } else {
      showFeedback('error', res.message || 'Failed to reset password.');
    }
  };

  // Handle Delete Admin
  const handleDeleteConfirm = async () => {
    if (!deletePromptAdmin) return;

    setActionLoading(true);
    const res = await dispatch(deleteAdminUser(deletePromptAdmin.id || deletePromptAdmin._id));
    setActionLoading(false);

    if (res.success) {
      showFeedback('success', 'Admin account permanently deleted.');
      setDeletePromptAdmin(null);
    } else {
      showFeedback('error', res.message || 'Failed to delete admin account.');
    }
  };

  // Open Sessions Viewer
  const handleViewSessions = async (admin) => {
    setSessionsAdmin(admin);
    setLoadingSessions(true);
    const res = await dispatch(fetchAdminUserSessions(admin.id || admin._id));
    setLoadingSessions(false);
    if (res.success) {
      setAdminSessionsList(res.sessions || []);
    } else {
      showFeedback('error', res.message || 'Failed to fetch sessions.');
    }
  };

  const togglePermission = (permKey) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(PERMISSION_LIST.map(p => p.key));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Notice */}
      {feedback && (
        <div
          className={`p-4 rounded border text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-red-950/40 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-luxury-gray border border-white/10 p-6 rounded-md">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="font-serif text-xl font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert size={20} className="text-white" />
              <span>Administrative Access Control</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white border border-white/30">
              Super Admin Realm
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1.5 max-w-2xl">
            Provision restricted administrative accounts, assign granular role permissions per functional module, configure store location scopes, and manage access credentials.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => dispatch(fetchAdminUsers())}
            disabled={loading}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold uppercase tracking-wider rounded transition flex items-center space-x-2 cursor-pointer shadow-md"
            style={{ backgroundColor: '#c8a96a', color: '#0a0a0a' }}
          >
            <UserPlus size={14} className="stroke-[2.5]" />
            <span>Create Admin</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-luxury-dark/40 border border-white/5 p-4 rounded-md">
        <div className="sm:col-span-6 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search admins by name, email, or store location..."
            className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs pl-9 pr-3 py-2.5 focus:outline-none focus:border-white"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs px-3 py-2.5 focus:outline-none focus:border-white"
          >
            <option value="all">All Administrative Roles</option>
            <option value="super_admin">Super Admins (Full Access)</option>
            <option value="admin">Restricted Admins</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs px-3 py-2.5 focus:outline-none focus:border-white"
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Accounts Only</option>
            <option value="disabled">Disabled Accounts Only</option>
          </select>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-luxury-gray border border-white/10 rounded-md overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-black/60 uppercase tracking-widest text-[10px] text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-bold">Admin User</th>
                <th className="py-3.5 px-4 font-bold">Role</th>
                <th className="py-3.5 px-4 font-bold">Store Location</th>
                <th className="py-3.5 px-4 font-bold">Permissions</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Last Activity</th>
                <th className="py-3.5 px-4 font-bold text-right min-w-[210px] w-[210px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <ShieldAlert size={32} className="mx-auto mb-2 opacity-30 text-white" />
                    <p className="text-xs">No administrative accounts match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isSuper = admin.role === 'super_admin' || admin.email === 'er.paritoshsaha@gmail.com';
                  const isSelf = admin._id === currentUser?.id || admin.id === currentUser?.id;
                  const perms = admin.permissions || [];

                  return (
                    <tr key={admin.id || admin._id} className="hover:bg-white/[0.02] transition">
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSuper
                              ? 'bg-white/20 text-white border border-white/40'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}>
                            {admin.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <span>{isSuper ? 'Super Admin' : (admin.name === 'Master Admin' ? 'Khroniq Admin' : admin.name)}</span>
                              {isSelf && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-white text-black font-bold rounded uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">{admin.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isSuper ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/40">
                            <Shield size={10} className="stroke-[2.5]" />
                            <span>SUPER ADMIN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <ShieldCheck size={10} />
                            <span>ADMIN</span>
                          </span>
                        )}
                      </td>

                      {/* Store Location */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 text-gray-300">
                          <MapPin size={12} className="text-white shrink-0" />
                          <span className="font-medium">{admin.location || 'Main Flagship'}</span>
                        </div>
                      </td>

                      {/* Permissions Summary */}
                      <td className="py-4 px-4">
                        {isSuper ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white text-black font-bold">
                              FULL ACCESS
                            </span>
                            <span className="text-[11px] text-gray-300 font-medium">All Modules & System Controls</span>
                          </div>
                        ) : perms.length === 0 ? (
                          <span className="text-[11px] text-red-400/80 italic">
                            No permissions assigned
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {perms.slice(0, 3).map((pKey) => {
                              const meta = PERMISSION_LIST.find(p => p.key === pKey);
                              return (
                                <span
                                  key={pKey}
                                  className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-gray-300 border border-white/10 whitespace-nowrap"
                                >
                                  {meta?.label || pKey}
                                </span>
                              );
                            })}
                            {perms.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-400 border border-white/10 font-bold">
                                +{perms.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {admin.isActive !== false ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={10} />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                            <XCircle size={10} />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-4 px-4 whitespace-nowrap text-gray-400 text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Clock size={11} className="text-gray-500" />
                          <span>
                            {admin.lastLogin
                              ? new Date(admin.lastLogin).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Never'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 whitespace-nowrap text-right min-w-[210px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setEditingAdmin(admin);
                              setEditForm({
                                name: admin.name || '',
                                email: admin.email || '',
                                location: admin.location || DEFAULT_LOCATIONS[0].name,
                                locationId: admin.locationId || DEFAULT_LOCATIONS[0].id,
                                isActive: admin.isActive !== false,
                                password: ''
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition cursor-pointer shrink-0"
                            title="Edit Details"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Manage Permissions (Only for regular admins) */}
                          {!isSuper && (
                            <button
                              onClick={() => {
                                setPermissionsAdmin(admin);
                                setSelectedPermissions(admin.permissions || []);
                              }}
                              className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-500/20 rounded transition cursor-pointer shrink-0"
                              title="Configure Permissions"
                            >
                              <Sliders size={13} />
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetPasswordAdmin(admin);
                              setPasswordForm({ newPassword: '', confirmPassword: '' });
                            }}
                            className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-500/20 rounded transition cursor-pointer shrink-0"
                            title="Reset Password"
                          >
                            <KeyRound size={13} />
                          </button>

                          {/* Sessions Viewer */}
                          <button
                            onClick={() => handleViewSessions(admin)}
                            className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-500/20 rounded transition cursor-pointer shrink-0"
                            title="View Active Sessions"
                          >
                            <Monitor size={13} />
                          </button>

                          {/* Disable / Enable (Cannot disable self or super_admin) */}
                          {!isSuper && !isSelf && (
                            <button
                              onClick={() => setStatusPromptAdmin(admin)}
                              className={`p-1.5 rounded transition cursor-pointer shrink-0 ${
                                admin.isActive !== false
                                  ? 'text-red-400 hover:text-white hover:bg-red-500/20'
                                  : 'text-emerald-400 hover:text-white hover:bg-emerald-500/20'
                              }`}
                              title={admin.isActive !== false ? 'Disable Account' : 'Enable Account'}
                            >
                              <Power size={13} />
                            </button>
                          )}

                          {/* Delete Account (Cannot delete self or super_admin) */}
                          {!isSuper && !isSelf && (
                            <button
                              onClick={() => setDeletePromptAdmin(admin)}
                              className="p-1.5 text-red-500 hover:text-white hover:bg-red-600/30 rounded transition cursor-pointer shrink-0"
                              title="Delete Account"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: CREATE ADMIN ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-white/15 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2.5">
                <UserPlus size={18} className="text-white" />
                <h3 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
                  Create Restricted Admin Account
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g., Jane Smith"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="admin@khroniq.com"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                    Initial Password * (Min 8 Chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                  />
                </div>

                {/* Store Location Scope */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                    Store Location Scope
                  </label>
                  <select
                    value={createForm.locationId}
                    onChange={(e) => {
                      const selectedLoc = DEFAULT_LOCATIONS.find(l => l.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        locationId: e.target.value,
                        location: selectedLoc ? selectedLoc.name : e.target.value
                      });
                    }}
                    className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                  >
                    {DEFAULT_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Module Permissions Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div>
                    <label className="text-[11px] font-bold text-white uppercase tracking-widest block">
                      Assign Module Permissions
                    </label>
                    <p className="text-[10px] text-gray-400">
                      Default is NO permissions. Select the specific tabs and APIs this admin can manage.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, permissions: PERMISSION_LIST.map(p => p.key) })}
                      className="text-white hover:underline font-bold uppercase"
                    >
                      Select All
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, permissions: [] })}
                      className="text-gray-400 hover:underline uppercase"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {PERMISSION_LIST.map((perm) => {
                    const isChecked = createForm.permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start space-x-2.5 p-2.5 rounded border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-white/10 border-white/40 text-white'
                            : 'bg-luxury-dark/40 border-white/5 text-gray-400 hover:border-white/15'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const current = createForm.permissions;
                            const next = current.includes(perm.key)
                              ? current.filter(k => k !== perm.key)
                              : [...current, perm.key];
                            setCreateForm({ ...createForm, permissions: next });
                          }}
                          className="mt-0.5 accent-[#c8a96a]"
                        />
                        <div>
                          <div className="font-bold text-white text-[11px]">{perm.label}</div>
                          <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{perm.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer shadow-md"
                  style={{ backgroundColor: '#c8a96a', color: '#0a0a0a' }}
                >
                  {actionLoading ? 'Creating...' : 'Provision Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT ADMIN DETAILS ─────────────────────────────────────────── */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-white/15 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Edit2 size={16} className="text-white" />
                <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                  Edit Admin Profile
                </h3>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  Store Location
                </label>
                <select
                  value={editForm.locationId}
                  onChange={(e) => {
                    const selectedLoc = DEFAULT_LOCATIONS.find(l => l.id === e.target.value);
                    setEditForm({
                      ...editForm,
                      locationId: e.target.value,
                      location: selectedLoc ? selectedLoc.name : e.target.value
                    });
                  }}
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                >
                  {DEFAULT_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  Account Status
                </label>
                <select
                  value={editForm.isActive ? 'true' : 'false'}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                >
                  <option value="true">Active</option>
                  <option value="false">Deactivated (Disabled)</option>
                </select>
              </div>

              {/* Optional Password Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  New Password (Optional — leave blank to keep current password)
                </label>
                <input
                  type="password"
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Min 8 characters or leave blank"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer shadow-md"
                  style={{ backgroundColor: '#c8a96a', color: '#0a0a0a' }}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: MANAGE PERMISSIONS ────────────────────────────────────────── */}
      {permissionsAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-white/15 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Sliders size={16} className="text-white" />
                  <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                    Permissions: {permissionsAdmin.name}
                  </h3>
                </div>
                <p className="text-gray-400 text-xs mt-1">{permissionsAdmin.email}</p>
              </div>
              <button
                onClick={() => setPermissionsAdmin(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-300 font-medium">
                {selectedPermissions.length} of {PERMISSION_LIST.length} modules granted
              </span>
              <div className="flex items-center space-x-2 text-[10px]">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="text-white hover:underline font-bold uppercase"
                >
                  Grant All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  type="button"
                  onClick={clearAllPermissions}
                  className="text-gray-400 hover:underline uppercase"
                >
                  Revoke All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {PERMISSION_LIST.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-start space-x-2.5 p-3 rounded border text-xs cursor-pointer transition ${
                      isChecked
                        ? 'bg-white/15 border-white/40 text-white'
                        : 'bg-luxury-dark/40 border-white/5 text-gray-400 hover:border-white/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(perm.key)}
                      className="mt-0.5 accent-[#c8a96a]"
                    />
                    <div>
                      <div className="font-bold text-white text-[11px]">{perm.label}</div>
                      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{perm.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPermissionsAdmin(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePermissionsSubmit}
                disabled={actionLoading}
                className="px-5 py-2 bg-white hover:bg-neutral-200 text-black border border-white text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer shadow-md"
                style={{ backgroundColor: '#c8a96a', color: '#0a0a0a' }}
              >
                {actionLoading ? 'Saving...' : 'Apply Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: RESET PASSWORD ────────────────────────────────────────────── */}
      {resetPasswordAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-white/15 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <KeyRound size={16} className="text-amber-400" />
                <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                  Reset Password
                </h3>
              </div>
              <button
                onClick={() => setResetPasswordAdmin(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Set a new secure password for <strong className="text-white">{resetPasswordAdmin.name}</strong> ({resetPasswordAdmin.email}). This will revoke all of their existing active sessions.
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  New Password (Min 8 Characters)
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-300 uppercase tracking-widest block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-luxury-dark border border-white/10 rounded text-white text-xs p-3 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setResetPasswordAdmin(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer shadow-md"
                >
                  {actionLoading ? 'Resetting...' : 'Confirm Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: DISABLE / ENABLE CONFIRMATION ──────────────────────────────── */}
      {statusPromptAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-white/15 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle size={20} />
              <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                {statusPromptAdmin.isActive !== false ? 'Disable Admin Account' : 'Enable Admin Account'}
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              {statusPromptAdmin.isActive !== false
                ? `Are you sure you want to disable '${statusPromptAdmin.name}' (${statusPromptAdmin.email})? They will immediately lose access to all admin panel endpoints and their active sessions will be terminated.`
                : `Are you sure you want to re-enable '${statusPromptAdmin.name}' (${statusPromptAdmin.email})? They will regain access to their assigned modules.`}
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStatusPromptAdmin(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatusConfirm}
                disabled={actionLoading}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer shadow-md ${
                  statusPromptAdmin.isActive !== false
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {actionLoading ? 'Processing...' : statusPromptAdmin.isActive !== false ? 'Disable Account' : 'Enable Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: DELETE CONFIRMATION ────────────────────────────────────────── */}
      {deletePromptAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-red-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-500">
              <Trash2 size={20} />
              <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                Permanently Delete Admin
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{deletePromptAdmin.name}</strong> ({deletePromptAdmin.email})? This action is irreversible. All access and credentials will be removed.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletePromptAdmin(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded transition cursor-pointer shadow-md"
              >
                {actionLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADMIN SESSIONS VIEWER ─────────────────────────────────────── */}
      {sessionsAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-luxury-gray border border-white/15 rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Monitor size={16} className="text-blue-400" />
                <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider">
                  Active Sessions: {sessionsAdmin.name}
                </h3>
              </div>
              <button
                onClick={() => setSessionsAdmin(null)}
                className="text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {loadingSessions ? (
              <div className="text-center py-8 text-gray-400 text-xs">Loading active sessions...</div>
            ) : adminSessionsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                No active device sessions found for this admin.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {adminSessionsList.map((s) => (
                  <div
                    key={s.sessionId}
                    className="p-3 bg-luxury-dark border border-white/5 rounded flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white/5 rounded text-gray-300">
                        {s.deviceType === 'Mobile' ? (
                          <Smartphone size={16} />
                        ) : s.deviceType === 'Tablet' ? (
                          <Laptop size={16} />
                        ) : (
                          <Monitor size={16} />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>{s.browser} on {s.os}</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-white/10 rounded text-gray-400">
                            {s.deviceType}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          IP: {s.ip} • {s.location} • Method: {s.loginMethod}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSessionsAdmin(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold uppercase tracking-wider rounded transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
