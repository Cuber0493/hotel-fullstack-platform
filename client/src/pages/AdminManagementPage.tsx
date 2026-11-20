import React, { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../api/client';
import { PropertyDetail, Booking, Enquiry } from '../types';
import {
  Building,
  Bed,
  Calendar,
  MessageSquare,
  Plus,
  Upload,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'properties' | 'rooms' | 'bookings' | 'enquiries'>(
    'properties'
  );

  const [properties, setProperties] = useState<PropertyDetail[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Property modal states
  const [createPropModal, setCreatePropModal] = useState(false);
  const [newProp, setNewProp] = useState({
    name: '',
    neighborhood: '',
    address: '',
    description: '',
    amenities: 'Sea View, Butler, WiFi, Pool',
  });

  // Room modal states
  const [createRoomModal, setCreateRoomModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [newRoom, setNewRoom] = useState({
    roomTypeId: '',
    roomNumber: '',
    floor: '2nd Floor',
  });

  // Upload modal states
  const [uploadModalProp, setUploadModalProp] = useState<PropertyDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch all management data
  const loadData = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      const [propsRes, bookingsRes, enquiriesRes] = await Promise.all([
        api.get<{ properties: PropertyDetail[] }>('/properties'),
        api.get<{ bookings: Booking[] }>('/bookings'),
        api.get<{ enquiries: Enquiry[] }>('/enquiries'),
      ]);
      setProperties(propsRes.data.properties);
      setBookings(bookingsRes.data.bookings);
      setEnquiries(enquiriesRes.data.enquiries);
      if (propsRes.data.properties.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(propsRes.data.properties[0].id);
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Create Property
  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/properties', {
        name: newProp.name,
        neighborhood: newProp.neighborhood,
        address: newProp.address,
        description: newProp.description,
        amenities: newProp.amenities.split(',').map((a) => a.trim()).filter(Boolean),
      });
      setCreatePropModal(false);
      setNewProp({ name: '', neighborhood: '', address: '', description: '', amenities: '' });
      setFeedbackMessage({ type: 'success', text: 'Property created successfully' });
      await loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    }
  };

  // 2. Delete Property
  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm('Are you sure you wish to delete this property?')) return;
    try {
      await api.delete(`/properties/${id}`);
      setFeedbackMessage({ type: 'success', text: 'Property deleted successfully' });
      await loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    }
  };

  // 3. Upload Property Image
  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalProp || !selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      await api.post(`/properties/${uploadModalProp.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadModalProp(null);
      setSelectedFile(null);
      setFeedbackMessage({
        type: 'success',
        text: `Image uploaded to ${uploadModalProp.name} successfully`,
      });
      await loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    } finally {
      setUploading(false);
    }
  };

  // 4. Add Room Inventory
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !newRoom.roomNumber) return;

    try {
      const prop = properties.find((p) => p.id === selectedPropertyId);
      const targetRt = prop?.roomTypes?.[0]?.id || newRoom.roomTypeId;

      await api.post(`/properties/${selectedPropertyId}/rooms`, {
        propertyId: selectedPropertyId,
        roomTypeId: targetRt,
        roomNumber: newRoom.roomNumber,
        floor: newRoom.floor,
      });

      setCreateRoomModal(false);
      setNewRoom({ roomTypeId: '', roomNumber: '', floor: '2nd Floor' });
      setFeedbackMessage({ type: 'success', text: 'Room inventory added successfully' });
      await loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    }
  };

  // 5. Cancel Booking
  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Cancel this guest booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`, {
        reason: 'Cancelled by front desk administrator',
      });
      setFeedbackMessage({ type: 'success', text: 'Booking cancelled successfully' });
      await loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    }
  };

  // 6. Update Enquiry Status
  const handleUpdateEnquiry = async (
    id: string,
    status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED'
  ) => {
    try {
      await api.patch(`/enquiries/${id}`, {
        status,
        internalNotes: `Status updated to ${status} via Admin Hub`,
      });
      setFeedbackMessage({ type: 'success', text: `Enquiry updated to ${status}` });
      await loadData();
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: getApiErrorMessage(err) });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">
          Operations & Assets
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-950 mt-1">
          Management Console
        </h1>
        <p className="text-stone-600 text-sm mt-1">
          Manage properties, room inventory, guest reservations, and concierge inquiries
        </p>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center space-x-2 text-sm shadow-sm ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-stone-200 space-x-4">
        {[
          { key: 'properties', label: 'Properties', icon: Building, count: properties.length },
          { key: 'rooms', label: 'Room Inventory', icon: Bed },
          { key: 'bookings', label: 'Reservations', icon: Calendar, count: bookings.length },
          { key: 'enquiries', label: 'Inquiries', icon: MessageSquare, count: enquiries.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-sm font-semibold transition-all ${
                active
                  ? 'border-amber-600 text-amber-800 font-serif'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-stone-500 font-serif tracking-widest text-xs uppercase">
            Loading Asset Management Records...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: PROPERTIES */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-stone-600">
                  {properties.length} Collective Boutiques
                </span>
                <button
                  onClick={() => setCreatePropModal(true)}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Property</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="h-40 rounded-2xl overflow-hidden relative">
                        <img
                          src={
                            prop.heroImage ||
                            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'
                          }
                          alt={prop.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 bg-stone-950/80 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase">
                          {prop.neighborhood}
                        </div>
                      </div>

                      <h3 className="font-serif font-bold text-stone-950 text-lg">
                        {prop.name}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {prop.description}
                      </p>
                      <p className="text-xs text-stone-400">
                        {prop.galleryImages?.length || 0} gallery images attached
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                      <button
                        onClick={() => setUploadModalProp(prop)}
                        className="flex items-center space-x-1 text-amber-700 hover:text-amber-800 font-semibold"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete Property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ROOM INVENTORY */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <label className="text-xs uppercase tracking-wider font-semibold text-stone-700">
                    Select Haven:
                  </label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-semibold text-stone-900"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setCreateRoomModal(true)}
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Room Inventory</span>
                </button>
              </div>

              {/* Room Types & Rooms List */}
              {(() => {
                const activeProp = properties.find((p) => p.id === selectedPropertyId);
                if (!activeProp || !activeProp.roomTypes?.length) {
                  return (
                    <div className="p-8 text-center text-sm text-stone-500 bg-white rounded-3xl border border-stone-200">
                      No room types found for this property.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProp.roomTypes.map((rt) => (
                      <div
                        key={rt.id}
                        className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm space-y-4"
                      >
                        <div className="flex justify-between items-baseline border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="font-serif font-bold text-stone-950 text-base">
                              {rt.name}
                            </h4>
                            <span className="text-xs text-stone-500">
                              ₹{rt.basePrice.toLocaleString('en-IN')} / night
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                            {rt.totalInventory} Rooms
                          </span>
                        </div>

                        <div>
                          <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-500 block mb-2">
                            Assigned Physical Rooms
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {rt.rooms && rt.rooms.length > 0 ? (
                              rt.rooms.map((r) => (
                                <span
                                  key={r.id}
                                  className="px-2.5 py-1 bg-stone-100 text-stone-900 font-mono text-xs rounded-lg border border-stone-200"
                                >
                                  {r.roomNumber} ({r.status})
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-stone-400">
                                No physical rooms assigned yet.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 3: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 uppercase tracking-wider text-stone-500 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Guest</th>
                      <th className="py-3 px-4">Dates</th>
                      <th className="py-3 px-4">Guests</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-stone-950">
                          {b.bookingCode}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-stone-900">{b.guestName}</p>
                          <p className="text-[11px] text-stone-500">{b.guestEmail}</p>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {String(b.checkInDate).slice(0, 10)} to{' '}
                          {String(b.checkOutDate).slice(0, 10)}
                        </td>
                        <td className="py-3 px-4 text-center">{b.totalGuests}</td>
                        <td className="py-3 px-4 font-mono font-bold">
                          ₹{b.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {b.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-red-600 hover:text-red-800 font-semibold text-xs"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ENQUIRIES */}
          {activeTab === 'enquiries' && (
            <div className="space-y-4">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-stone-950">{enq.name}</span>
                      <span className="text-xs text-stone-500 font-mono">{enq.email}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                          enq.status === 'NEW'
                            ? 'bg-amber-100 text-amber-900'
                            : enq.status === 'CLOSED'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-blue-100 text-blue-900'
                        }`}
                      >
                        {enq.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      "{enq.message}"
                    </p>

                    {enq.internalNotes && (
                      <p className="text-xs text-stone-500 italic">
                        Notes: {enq.internalNotes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateEnquiry(enq.id, 'CONTACTED')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg"
                    >
                      Mark Contacted
                    </button>
                    <button
                      onClick={() => handleUpdateEnquiry(enq.id, 'CLOSED')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg"
                    >
                      Mark Closed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE PROPERTY MODAL */}
      {createPropModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-xl text-stone-950">Add New Boutique Haven</h3>
            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Property Name</label>
                <input
                  type="text"
                  required
                  value={newProp.name}
                  onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                  placeholder="The Malabar Coast Sanctuary"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Neighborhood</label>
                  <input
                    type="text"
                    required
                    value={newProp.neighborhood}
                    onChange={(e) => setNewProp({ ...newProp, neighborhood: e.target.value })}
                    placeholder="Malabar Hill"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={newProp.address}
                    onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                    placeholder="12 Ridge Road, Mumbai"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newProp.description}
                  onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                  placeholder="Colonial heritage architecture with private butler service..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  value={newProp.amenities}
                  onChange={(e) => setNewProp({ ...newProp, amenities: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreatePropModal(false)}
                  className="px-4 py-2 bg-stone-100 rounded-xl text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl font-semibold"
                >
                  Create Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD IMAGE MODAL */}
      {uploadModalProp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-xl text-stone-950">
              Upload Image: {uploadModalProp.name}
            </h3>
            <p className="text-xs text-stone-600">
              Supported file types: JPEG, PNG, WebP (Max 5MB). Persisted directly to Cloudinary.
            </p>
            <form onSubmit={handleImageUpload} className="space-y-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-black cursor-pointer"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalProp(null)}
                  className="px-4 py-2 bg-stone-100 rounded-xl text-xs text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD ROOM MODAL */}
      {createRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-stone-200">
            <h3 className="font-serif font-bold text-xl text-stone-950">Add Room Inventory</h3>
            <form onSubmit={handleAddRoom} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  placeholder="e.g. 401 or Suite-A"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Floor</label>
                <input
                  type="text"
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateRoomModal(false)}
                  className="px-4 py-2 bg-stone-100 rounded-xl text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl font-semibold"
                >
                  Add Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
