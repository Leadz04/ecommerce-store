'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, LogOut, ShoppingBag, Heart, Settings, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { AuthUser } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile, isLoading, error, clearError } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<AuthUser>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'profile' | 'wishlist' | 'settings'>('profile');


  // Wishlist
  const { items: wishlistItems, isLoading: isWishlistLoading, error: wishlistError, fetchWishlist, removeFromWishlist } = useWishlistStore();

  // Settings
  const [settings, setSettings] = useState({ emailNotifications: true, smsNotifications: false, theme: 'system', language: 'en' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const { items: cartItems, addItem } = useCartStore();
  const [wishlistQty, setWishlistQty] = useState<Record<string, number>>({});
  const changeQty = (id: string, delta: number) => {
    setWishlistQty((prev) => {
      const next = Math.max(1, (prev[id] || 1) + delta);
      return { ...prev, [id]: next };
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (user) {
      setEditData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: (user.address as any) || ({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        } as any)
      });

      // Prefill settings if present
      const userAny = user as any;
      if (userAny.settings) {
        setSettings({
          emailNotifications: !!userAny.settings.emailNotifications,
          smsNotifications: !!userAny.settings.smsNotifications,
          theme: userAny.settings.theme || 'system',
          language: userAny.settings.language || 'en'
        });
      }
    }
  }, [isAuthenticated, user, router]);

  // Initialize active section from URL
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'wishlist' || tab === 'settings' || tab === 'profile') {
      setActiveSection(tab);
    }
  }, [searchParams]);

  // Sync active section to URL and load data
  useEffect(() => {
    if (!isAuthenticated) return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeSection);
    window.history.replaceState(null, '', url.toString());
    if (activeSection === 'wishlist') {
      fetchWishlist();
    }
  }, [activeSection, isAuthenticated, fetchWishlist]);

  const handleSaveSettings = async () => {
    try {
      setIsSavingSettings(true);
      const token = localStorage.getItem('token');
      await fetch('/api/users/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      // Notify
      try {
        const mod: any = await import('react-hot-toast');
        mod.toast.success('Settings saved');
      } catch {}
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1] as string;
      setEditData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value
        }
      }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!editData.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!editData.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (editData.phone && !/^\+?[\d\s\-\(\)]+$/.test(editData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (editData.address) {
      if (!editData.address.address1?.trim()) {
        errors['address.address1'] = 'Street address is required';
      }
      if (!editData.address.city?.trim()) {
        errors['address.city'] = 'City is required';
      }
      if (!editData.address.state?.trim()) {
        errors['address.state'] = 'State is required';
      }
      if (!editData.address.zipCode?.trim()) {
        errors['address.zipCode'] = 'ZIP code is required';
      }
      if (!editData.address.country?.trim()) {
        errors['address.country'] = 'Country is required';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      await updateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: (user.address as any) || ({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        } as any)
      });
    }
    setIsEditing(false);
    setValidationErrors({});
    clearError();
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold">My Profile</h1>
          <p className="text-xl text-blue-100 mt-2">Manage your account settings and preferences</p>
        </div>
      </section>

      {/* Profile Content */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-12 w-12 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h2>
                  <p className="text-gray-600 mb-4">{user.email}</p>
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
                    <Calendar className="h-4 w-4 mr-1" />
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Link href="/orders" className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <ShoppingBag className="h-5 w-5 mr-3" />
                    Order History
                  </Link>
                  <button onClick={() => setActiveSection('wishlist')} className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Heart className="h-5 w-5 mr-3" />
                    Wishlist
                  </button>
                  <button onClick={() => setActiveSection('settings')} className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full mt-6 flex items-center justify-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2">
              {/* Profile Section */}
              {activeSection === 'profile' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 rounded-lg transition-colors"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={editData.name || ''}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                          validationErrors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <p className="text-gray-900">{user.name}</p>
                    )}
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editData.email || ''}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                          validationErrors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <p className="text-gray-900">{user.email}</p>
                    )}
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editData.phone || ''}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                          validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    )}
                    {validationErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Address
                    </label>
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          name="address.address1"
                          value={editData.address?.address1 || ''}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                            validationErrors['address.address1'] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Street address"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="address.city"
                            value={editData.address?.city || ''}
                            onChange={handleInputChange}
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                              validationErrors['address.city'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="City"
                          />
                          <input
                            type="text"
                            name="address.state"
                            value={editData.address?.state || ''}
                            onChange={handleInputChange}
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                              validationErrors['address.state'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="State"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="address.zipCode"
                            value={editData.address?.zipCode || ''}
                            onChange={handleInputChange}
                            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                              validationErrors['address.zipCode'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="ZIP Code"
                          />
                          <select
                            name="address.country"
                            value={editData.address?.country || 'United States'}
                            onChange={handleInputChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                          >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                          </select>
                        </div>
                        {Object.keys(validationErrors).filter(key => key.startsWith('address')).map(key => (
                          <p key={key} className="text-sm text-red-600">{validationErrors[key]}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-900">
                        {user.address ? (
                          <div>
                            <p>{user.address.address1}</p>
                            <p>{user.address.city}, {user.address.state} {user.address.zipCode}</p>
                            <p>{user.address.country}</p>
                          </div>
                        ) : (
                          <p>No address provided</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}


              {/* Wishlist Section */}
              {activeSection === 'wishlist' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Wishlist</h3>
                </div>
                {isWishlistLoading ? (
                  <p className="text-gray-600">Loading wishlist...</p>
                ) : wishlistError ? (
                  <p className="text-red-600">{wishlistError}</p>
                ) : wishlistItems.length === 0 ? (
                  <p className="text-gray-600">Your wishlist is empty.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlistItems.map((p: any) => {
                      const inCartQty = cartItems.reduce((sum, it) => {
                        const pid = (it.product as any)._id || (it.product as any).id;
                        return pid === p._id ? sum + it.quantity : sum;
                      }, 0);
                      return (
                      <div key={p._id} className="border rounded-lg p-4 flex items-center gap-4 hover:border-gray-300 transition-colors">
                        <Link href={`/products/${p._id}`} className="shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden" title={p.name}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${p._id}`} className="block font-medium text-gray-900 hover:text-blue-600 truncate" title={p.name}>
                            {p.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-gray-600 text-sm">${p.price}</div>
                            {inCartQty > 0 && (
                              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">In cart: {inCartQty}</span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-3 flex-wrap">
                            <Link href={`/products/${p._id}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm">
                              View <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                            <button onClick={() => removeFromWishlist(p._id)} className="text-red-600 hover:text-red-700 text-sm">
                              Remove
                            </button>
                            <div className="ml-auto flex items-center gap-2">
                              <button onClick={() => changeQty(p._id, -1)} className="px-2 py-1 border rounded text-xs hover:bg-gray-50">-</button>
                              <span className="text-sm w-6 text-center">{wishlistQty[p._id] || 1}</span>
                              <button onClick={() => changeQty(p._id, 1)} className="px-2 py-1 border rounded text-xs hover:bg-gray-50">+</button>
                              <button
                                onClick={() => addItem(p, wishlistQty[p._id] || 1)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                disabled={!p.inStock}
                              >
                                {p.inStock ? 'Add to Cart' : 'Out of Stock'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* Settings Section */}
              {activeSection === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-gray-600 text-sm">Receive updates about orders and offers</div>
                    </div>
                    <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">SMS Notifications</div>
                      <div className="text-gray-600 text-sm">Receive text messages about your orders</div>
                    </div>
                    <input type="checkbox" checked={settings.smsNotifications} onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })} className="px-3 py-2 border text-gray-700 mb-2 rounded">
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                    <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="px-3 py-2 border  text-gray-700 mb-2 rounded">
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <button onClick={handleSaveSettings} disabled={isSavingSettings} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                      {isSavingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
