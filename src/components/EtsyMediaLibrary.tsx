'use client';

import { useState, useEffect } from 'react';
import {
    ImageIcon,
    Video,
    FileText,
    Layers,
    Upload,
    Trash2,
    RefreshCw,
    Loader2,
    Plus,
    AlertCircle,
    Edit,
    ZoomIn,
    ZoomOut,
    Maximize2,
    X
} from 'lucide-react';
import SelectField from './SelectField';
import ImageEditor from './ImageEditor';
import toast from 'react-hot-toast';

interface EtsyMediaLibraryProps {
    shopId: string | null;
    listings: any[]; // We pass listings to select which one to manage
}

type MediaTab = 'images' | 'videos' | 'files' | 'variation-images';

export default function EtsyMediaLibrary({ shopId, listings }: EtsyMediaLibraryProps) {
    const [selectedListingId, setSelectedListingId] = useState<string>('');
    const [isListingDropdownOpen, setIsListingDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<MediaTab>('images');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[] | any>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [editingImage, setEditingImage] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [zoomScale, setZoomScale] = useState(1);

    // Load data when tab or listing changes
    useEffect(() => {
        if (!shopId || !selectedListingId) {
            setData([]);
            return;
        }

        const loadData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                let endpoint = '';

                // All GET endpoints need shopId Param
                const baseQuery = `?shopId=${shopId}`;

                switch (activeTab) {
                    case 'images':
                        endpoint = `/api/etsy/listings/${selectedListingId}/images${baseQuery}`;
                        break;
                    case 'videos':
                        endpoint = `/api/etsy/listings/${selectedListingId}/videos${baseQuery}`;
                        break;
                    case 'files':
                        endpoint = `/api/etsy/listings/${selectedListingId}/files${baseQuery}`;
                        break;
                    case 'variation-images':
                        endpoint = `/api/etsy/listings/${selectedListingId}/variation-images${baseQuery}`;
                        break;
                }

                const res = await fetch(endpoint, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });

                const json = await res.json();
                if (json.success) {
                    setData(json.results || json.variation_images || []);
                } else {
                    toast.error(json.error || 'Failed to load media');
                }
            } catch (error) {
                console.error('Error loading media:', error);
                toast.error('Failed to load media');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [shopId, selectedListingId, activeTab, refreshTrigger]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !shopId || !selectedListingId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const formData = new FormData();

            let endpoint = '';
            // All POST endpoints need shopId Param
            const baseQuery = `?shopId=${shopId}`;

            if (activeTab === 'images') {
                formData.append('image', file);
                endpoint = `/api/etsy/listings/${selectedListingId}/images${baseQuery}`;
            } else if (activeTab === 'videos') {
                formData.append('video', file);
                formData.append('name', file.name);
                endpoint = `/api/etsy/listings/${selectedListingId}/videos${baseQuery}`;
            } else if (activeTab === 'files') {
                formData.append('file', file);
                formData.append('name', file.name);
                endpoint = `/api/etsy/listings/${selectedListingId}/files${baseQuery}`;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}, // No Content-Type for FormData
                body: formData,
            });

            const json = await res.json();
            if (json.success) {
                toast.success('Upload successful');
                setRefreshTrigger(prev => prev + 1);
            } else {
                toast.error(json.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed');
        } finally {
            setLoading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const handleDelete = async (itemId: string | number) => {
        if (!shopId || !selectedListingId || !confirm('Are you sure you want to delete this item?')) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let endpoint = '';

            // All DELETE endpoints use query params for IDs
            if (activeTab === 'images') {
                endpoint = `/api/etsy/listings/${selectedListingId}/images?shopId=${shopId}&imageId=${itemId}`;
            } else if (activeTab === 'videos') {
                endpoint = `/api/etsy/listings/${selectedListingId}/videos?shopId=${shopId}&videoId=${itemId}`;
            } else if (activeTab === 'files') {
                endpoint = `/api/etsy/listings/${selectedListingId}/files?shopId=${shopId}&fileId=${itemId}`;
            }

            const res = await fetch(endpoint, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });

            // DELETE usually returns 204, but API route might return JSON
            if (res.ok) {
                // Try parsing JSON if available, otherwise just success
                const json = await res.json().catch(() => ({ success: true }));
                if (json.success || res.status === 204) {
                    toast.success('Deleted successfully');
                    setRefreshTrigger(prev => prev + 1);
                } else {
                    toast.error(json.error || 'Delete failed');
                }
            } else {
                const json = await res.json().catch(() => ({}));
                toast.error(json.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEditedImage = async (processedUrl: string) => {
        if (!shopId || !selectedListingId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // 1. Fetch the processed image from Cloudinary URL
            const response = await fetch(processedUrl);
            const blob = await response.blob();

            // 2. Create a File object
            const file = new File([blob], `edited_image_${Date.now()}.png`, { type: 'image/png' });

            // 3. Upload to Etsy
            const formData = new FormData();
            const baseQuery = `?shopId=${shopId}`;
            const endpoint = `/api/etsy/listings/${selectedListingId}/images${baseQuery}`;

            formData.append('image', file);

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });

            const json = await res.json();
            if (json.success) {
                toast.success('Edited image saved to listing!');
                setRefreshTrigger(prev => prev + 1);
            } else {
                toast.error(json.error || 'Failed to save edited image');
            }
        } catch (error) {
            console.error('Error saving edited image:', error);
            toast.error('Failed to save edited image');
        } finally {
            setLoading(false);
            setEditingImage(null);
        }
    };

    // Helper to render content based on active tab
    const renderContent = () => {
        if (loading && (!data || data.length === 0)) {
            return (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            );
        }

        if (!data || data.length === 0) {
            return (
                <div className="text-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No media found.</p>
                </div>
            );
        }

        if (activeTab === 'images') {
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.map((img: any) => (
                        <div key={img.listing_image_id} className="relative group border rounded-lg overflow-hidden">
                            <img
                                src={img.url_570xN || img.url_fullxfull || img.url}
                                alt="Listing"
                                className="w-full h-48 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPreviewImage(img.url_fullxfull || img.url_570xN || img.url)}
                                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
                                    title="View Larger"
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setEditingImage(img.url_fullxfull || img.url_570xN || img.url)}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                                    title="Edit"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(img.listing_image_id)}
                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 px-2">
                                ID: {img.listing_image_id}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'videos') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.map((video: any, idx: number) => (
                        <div key={video.video_id || `video-${idx}`} className="border rounded-lg p-4">
                            <div className="aspect-video bg-black rounded mb-2 flex items-center justify-center text-white">
                                {/* Video preview or thumbnail if available */}
                                {video.thumbnail_url ? (
                                    <img src={video.thumbnail_url} alt="Video Thumbnail" className="w-full h-full object-cover" />
                                ) : (
                                    <Video className="h-12 w-12" />
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm">{video.name || 'Untitled Video'}</p>
                                    <p className="text-xs text-gray-500">{video.state}</p>
                                </div>
                                <button
                                    onClick={() => handleDelete(video.video_id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'files') {
            return (
                <div className="space-y-2">
                    {data.map((file: any) => (
                        <div key={file.listing_file_id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-500" />
                                <div>
                                    <p className="font-medium">{file.filename || `File ${file.listing_file_id}`}</p>
                                    <p className="text-xs text-gray-500">{file.filesize} bytes • {new Date(file.create_timestamp * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(file.listing_file_id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'variation-images') {
            return (
                <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        <p>Variation images are read-only here. Use the Listing Editor to update variation images linkings.</p>
                    </div>
                    {/* Render variation images map if API returns it in a specific structure */}
                    <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>
            );
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
                <h3 className="text-lg font-semibold mb-4 text-purple-900">Media Library Management</h3>
                <p className="text-gray-600 mb-6">
                    Manage listing images, videos, and digital files. Select a listing below to get started.
                </p>

                {/* Listing Selector */}
                <div className="mb-6 max-w-xl">
                    <SelectField
                        label="Select Listing"
                        value={selectedListingId}
                        options={listings.map((l: any) => ({
                            value: l.listingId.toString(),
                            label: `${l.title?.substring(0, 60)}${l.title?.length > 60 ? '...' : ''} (ID: ${l.listingId})`
                        }))}
                        onSelect={(val) => setSelectedListingId(val)}
                        isOpen={isListingDropdownOpen}
                        onOpenChange={setIsListingDropdownOpen}
                        placeholder="-- Choose a listing --"
                        className="w-full"
                    />
                </div>

                {selectedListingId ? (
                    <div>
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setActiveTab('images')}
                                className={`px-4 py-2 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'images' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <ImageIcon className="h-4 w-4" /> Images
                            </button>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`px-4 py-2 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'videos' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Video className="h-4 w-4" /> Videos
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                className={`px-4 py-2 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'files' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <FileText className="h-4 w-4" /> Digital Files
                            </button>
                            <button
                                onClick={() => setActiveTab('variation-images')}
                                className={`px-4 py-2 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'variation-images' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                <Layers className="h-4 w-4" /> Variation Images
                            </button>
                        </div>

                        {/* Toolbar */}
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-lg capitalize">{activeTab.replace('-', ' ')}</h4>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setRefreshTrigger(prev => prev + 1)}
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>

                                {activeTab !== 'variation-images' && (
                                    <label className="cursor-pointer bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm font-medium">
                                        <Upload className="h-4 w-4" />
                                        Upload {activeTab.slice(0, -1)}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept={
                                                activeTab === 'images' ? 'image/*' :
                                                    activeTab === 'videos' ? 'video/*' :
                                                        '*/*'
                                            }
                                            onChange={handleUpload}
                                            disabled={loading}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="min-h-[200px]">
                            {renderContent()}
                        </div>

                    </div>
                ) : (
                    <div>
                        <h4 className="font-medium text-gray-700 mb-4">Or choose from your listings:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto p-2">
                            {listings.length > 0 ? (
                                listings.map((listing: any) => {
                                    const mainImage = listing.images && listing.images.length > 0
                                        ? (listing.images.find((img: any) => img.rank === 1) || listing.images[0])
                                        : null;
                                    const imageUrl = mainImage?.url || mainImage?.url_570xN || mainImage?.url_fullxfull || mainImage?.url_170x135 || mainImage?.url_75x75;

                                    return (
                                        <div
                                            key={listing.listingId}
                                            onClick={() => setSelectedListingId(listing.listingId.toString())}
                                            className="cursor-pointer border border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all bg-white overflow-hidden group"
                                        >
                                            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={listing.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-8 w-8 text-gray-300" />
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </div>
                                            <div className="p-3">
                                                <p className="text-sm font-medium text-gray-800 line-clamp-2" title={listing.title}>
                                                    {listing.title || 'Untitled Listing'}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">ID: {listing.listingId}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                    <p>No listings found available.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
            {editingImage && (
                <ImageEditor
                    imageUrl={editingImage}
                    isOpen={!!editingImage}
                    onClose={() => setEditingImage(null)}
                    onSave={handleSaveEditedImage}
                    productName={`Etsy Listing ${selectedListingId}`}
                />
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Header Controls */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                <button
                                    onClick={() => setZoomScale(prev => Math.max(0.25, prev - 0.25))}
                                    className="text-white hover:text-purple-400 transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="h-5 w-5" />
                                </button>
                                <span className="text-white text-sm font-medium w-12 text-center">
                                    {Math.round(zoomScale * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))}
                                    className="text-white hover:text-purple-400 transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="h-5 w-5" />
                                </button>
                                <div className="w-px h-4 bg-white/20 mx-1" />
                                <button
                                    onClick={() => setZoomScale(1)}
                                    className="text-xs text-white hover:text-purple-400 transition-colors px-1"
                                >
                                    Reset
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    setPreviewImage(null);
                                    setZoomScale(1);
                                }}
                                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full border border-white/20 transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Image Container */}
                        <div
                            className="w-full h-full flex items-center justify-center overflow-auto cursor-grab active:cursor-grabbing p-8"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setPreviewImage(null);
                                    setZoomScale(1);
                                }
                            }}
                            onWheel={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                    e.preventDefault();
                                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                                    setZoomScale(prev => Math.min(3, Math.max(0.25, prev + delta)));
                                } else {
                                    // Regular scroll zooming
                                    const delta = e.deltaY > 0 ? -0.05 : 0.05;
                                    setZoomScale(prev => Math.min(3, Math.max(0.25, prev + delta)));
                                }
                            }}
                        >
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="max-w-none transition-transform duration-200 ease-out shadow-2xl rounded-sm"
                                style={{
                                    transform: `scale(${zoomScale})`,
                                    maxHeight: zoomScale <= 1 ? '85vh' : 'none',
                                    maxWidth: zoomScale <= 1 ? '85vw' : 'none'
                                }}
                            />
                        </div>

                        {/* Footer Info */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white/70 text-xs">
                            Scroll to zoom or use controls above
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
