warning: in the working copy of 'src/app/admin/tools/page.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/app/api/admin/products/route.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/app/admin/page.tsx b/src/app/admin/page.tsx[m
[1mindex 40213a7..ccac953 100644[m
[1m--- a/src/app/admin/page.tsx[m
[1m+++ b/src/app/admin/page.tsx[m
[36m@@ -5,12 +5,12 @@[m [mimport type { KeyboardEvent as ReactKeyboardEvent } from 'react';[m
 import { useRouter, useSearchParams, usePathname } from 'next/navigation';[m
 import Link from 'next/link';[m
 import Script from 'next/script';[m
[31m-import { [m
[31m-  Users, [m
[31m-  Package, [m
[31m-  ShoppingCart, [m
[31m-  BarChart3, [m
[31m-  Settings, [m
[32m+[m[32mimport {[m[41m[m
[32m+[m[32m  Users,[m[41m[m
[32m+[m[32m  Package,[m[41m[m
[32m+[m[32m  ShoppingCart,[m[41m[m
[32m+[m[32m  BarChart3,[m[41m[m
[32m+[m[32m  Settings,[m[41m[m
   Shield,[m
   ShieldCheck,[m
   UserPlus,[m
[36m@@ -75,7 +75,7 @@[m [mimport { AdminSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';[m
 import SelectField, { SelectOption } from '@/components/SelectField';[m
 import toast from 'react-hot-toast';[m
 [m
[31m-const allowedTabs = ['users','roles','products','policy-review','orders','overview','marketing','performance','analytics','etsy','seo','seo-raw','analytics-seo','blogs','keyword-planner','sourcing','email-tracking'] as const;[m
[32m+[m[32mconst allowedTabs = ['users', 'roles', 'products', 'policy-review', 'orders', 'overview', 'marketing', 'performance', 'analytics', 'etsy', 'seo', 'seo-raw', 'analytics-seo', 'blogs', 'keyword-planner', 'sourcing', 'email-tracking'] as const;[m[41m[m
 type TabKey = typeof allowedTabs[number];[m
 type SidebarTab = {[m
   id: TabKey;[m
[36m@@ -285,7 +285,7 @@[m [mexport default function AdminDashboard() {[m
   const [segmentDaysSinceLogin, setSegmentDaysSinceLogin] = useState<number | ''>('');[m
   const [segmentCategory, setSegmentCategory] = useState('');[m
   const [sendingCampaign, setSendingCampaign] = useState(false);[m
[31m-  [m
[32m+[m[41m[m
   // SEO Research (SerpAPI) state[m
   const [keywordQuery, setKeywordQuery] = useState('');[m
   const [seoSelectedCategory, setSeoSelectedCategory] = useState('');[m
[36m@@ -295,7 +295,7 @@[m [mexport default function AdminDashboard() {[m
   const seoLoadedOnceRef = useRef(false);[m
   const [seoAudit, setSeoAudit] = useState<any>(null);[m
   const [seoHistory, setSeoHistory] = useState<any[]>([]);[m
[31m-  [m
[32m+[m[41m[m
   // Product modal state[m
   const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);[m
   const [showProductModal, setShowProductModal] = useState(false);[m
[36m@@ -305,13 +305,13 @@[m [mexport default function AdminDashboard() {[m
   const [analysisSelectedMeta, setAnalysisSelectedMeta] = useState<Record<string, { name: string; price?: number }>>({});[m
   const [etsyExportLoading, setEtsyExportLoading] = useState<Record<string, boolean>>({});[m
   const [etsyProductSearch, setEtsyProductSearch] = useState('');[m
[31m-  [m
[32m+[m[41m[m
   const ETSY_SYNC_ACTION_OPTIONS: SelectOption[] = [[m
     { value: 'create', label: 'Create' },[m
     { value: 'update', label: 'Update' },[m
     { value: 'delete', label: 'Delete' },[m
   ];[m
[31m-  [m
[32m+[m[41m[m
   const ETSY_EXPORT_CATEGORY_OPTIONS: SelectOption[] = [[m
     { value: 'all', label: 'All Categories' },[m
     { value: 'Men', label: 'Men' },[m
[36m@@ -320,7 +320,7 @@[m [mexport default function AdminDashboard() {[m
     { value: 'Accessories', label: 'Accessories' },[m
     { value: 'Gifting', label: 'Gifting' },[m
   ];[m
[31m-  [m
[32m+[m[41m[m
   const ETSY_EXPORT_LIMIT_OPTIONS: SelectOption[] = [[m
     { value: '10', label: '10' },[m
     { value: '25', label: '25' },[m
[36m@@ -330,7 +330,7 @@[m [mexport default function AdminDashboard() {[m
     { value: '500', label: '500' },[m
     { value: 'custom', label: 'Custom' },[m
   ];[m
[31m-  [m
[32m+[m[41m[m
   const [etsySyncProductId, setEtsySyncProductId] = useState('');[m
   const [etsySyncProductOpen, setEtsySyncProductOpen] = useState(false);[m
   const [etsySyncAction, setEtsySyncAction] = useState<'create' | 'update' | 'delete'>('create');[m
[36m@@ -348,7 +348,7 @@[m [mexport default function AdminDashboard() {[m
   const [policyReviewStatus, setPolicyReviewStatus] = useState<Record<string, { loading: boolean; error?: string; result?: PolicyReviewResult }>>({});[m
   const [policyImprovements, setPolicyImprovements] = useState<Record<string, ProductImprovementState>>({});[m
   const [rawSearchItems, setRawSearchItems] = useState<any[]>([]);[m
[31m-  [m
[32m+[m[41m[m
   const hydratePolicyReviewsFromProducts = (productList: Product[]) => {[m
     if (!Array.isArray(productList) || productList.length === 0) {[m
       return;[m
[36m@@ -447,11 +447,11 @@[m [mexport default function AdminDashboard() {[m
       action[m
     };[m
   }, [keywordQuery, keywords, productsSeo]);[m
[31m-  [m
[32m+[m[41m[m
   // SEO Research functions[m
   const searchKeywords = async () => {[m
     if (!keywordQuery.trim()) return;[m
[31m-    [m
[32m+[m[41m[m
     setSeoLoading(prev => ({ ...prev, keywords: true }));[m
     try {[m
       const response = await fetch(`/api/seo/keywords?q=${encodeURIComponent(keywordQuery)}&limit=20`);[m
[36m@@ -549,7 +549,7 @@[m [mexport default function AdminDashboard() {[m
   // Google & Google Shopping Analytics functions[m
   const searchAnalytics = async () => {[m
     if (!analyticsSearchQuery.trim()) return;[m
[31m-    [m
[32m+[m[41m[m
     setAnalyticsSeoLoading(true);[m
     try {[m
       const response = await fetch(`/api/seo/raw-search?q=${encodeURIComponent(analyticsSearchQuery)}&limit=10`);[m
[36m@@ -594,7 +594,7 @@[m [mexport default function AdminDashboard() {[m
     totalClicked: number;[m
     lastSentAt: string;[m
   }>>({});[m
[31m-  [m
[32m+[m[41m[m
   const etsyProductOptions = useMemo<SelectOption[]>(() => {[m
     if (!Array.isArray(products) || products.length === 0) return [];[m
     return products.map((product) => {[m
[36m@@ -606,7 +606,7 @@[m [mexport default function AdminDashboard() {[m
       };[m
     });[m
   }, [products]);[m
[31m-  [m
[32m+[m[41m[m
   const [orders, setOrders] = useState<Order[]>([]);[m
   const [loading, setLoading] = useState(false);[m
   const [searchTerm, setSearchTerm] = useState('');[m
[36m@@ -651,7 +651,7 @@[m [mexport default function AdminDashboard() {[m
   const isProductOrganized = (product: Product): boolean => {[m
     const allImages = [product.image, ...(product.images || [])].filter(Boolean);[m
     if (allImages.length === 0) return false;[m
[31m-    return allImages.some((url: string) => [m
[32m+[m[32m    return allImages.some((url: string) =>[m[41m[m
       url && typeof url === 'string' && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'))[m
     );[m
   };[m
[36m@@ -698,11 +698,31 @@[m [mexport default function AdminDashboard() {[m
     try {[m
       setMetricsLoading(true);[m
       const token = localStorage.getItem('token');[m
[32m+[m[32m      if (!token) {[m[41m[m
[32m+[m[32m        // If no token, we can't fetch metrics.[m[41m[m
[32m+[m[32m        // We might want to redirect or just stop here.[m[41m[m
[32m+[m[32m        // Since this is called in useEffect, stopping is safer to avoid loops.[m[41m[m
[32m+[m[32m        console.warn('No token found, skipping metrics fetch');[m[41m[m
[32m+[m[32m        return;[m[41m[m
[32m+[m[32m      }[m[41m[m
[32m+[m[41m[m
       const response = await fetch(`/api/admin/metrics?days=${days}`, {[m
         headers: { 'Authorization': `Bearer ${token}` }[m
       });[m
[32m+[m[41m[m
       const data = await response.json();[m
[31m-      if (!response.ok) throw new Error(data.error || 'Failed to fetch metrics');[m
[32m+[m[41m[m
[32m+[m[32m      if (!response.ok) {[m[41m[m
[32m+[m[32m        if (response.status === 401) {[m[41m[m
[32m+[m[32m          // Token expired or invalid[m[41m[m
[32m+[m[32m          localStorage.removeItem('token');[m[41m[m
[32m+[m[32m          router.push('/login');[m[41m[m
[32m+[m[32m          toast.error('Session expired. Please login again.');[m[41m[m
[32m+[m[32m          return;[m[41m[m
[32m+[m[32m        }[m[41m[m
[32m+[m[32m        throw new Error(data.error || 'Failed to fetch metrics');[m[41m[m
[32m+[m[32m      }[m[41m[m
[32m+[m[41m[m
       setMetrics(data);[m
     } catch (e) {[m
       console.error('Metrics fetch error', e);[m
[36m@@ -737,7 +757,7 @@[m [mexport default function AdminDashboard() {[m
     try {[m
       setAnalyticsLoading(true);[m
       const token = localStorage.getItem('token');[m
[31m-      const res = await fetch(`/api/admin/analytics?days=${days}` , { headers: { 'Authorization': `Bearer ${token}` } });[m
[32m+[m[32m      const res = await fetch(`/api/admin/analytics?days=${days}`, { headers: { 'Authorization': `Bearer ${token}` } });[m[41m[m
       const data = await res.json();[m
       if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');[m
       setAnalytics(data);[m
[36m@@ -769,11 +789,11 @@[m [mexport default function AdminDashboard() {[m
     ];[m
     return ([m
       <div className="p-6">[m
[31m-          <div className="flex items-center gap-2 mb-4">[m
[32m+[m[32m        <div className="flex items-center gap-2 mb-4">[m[41m[m
           <span className="text-sm text-gray-600">Range:</span>[m
           <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden">[m
[31m-            {[7,30,90].map(d => ([m
[31m-              <button key={d} onClick={() => { lastAnalyticsKeyRef.current = null; setAnalyticsDays(d as 7|30|90); }} className={`px-3 py-1.5 text-sm ${analyticsDays===d?'bg-blue-600 text-white':'text-gray-700 hover:bg-gray-50'}`}>{d}d</button>[m
[32m+[m[32m            {[7, 30, 90].map(d => ([m[41m[m
[32m+[m[32m              <button key={d} onClick={() => { lastAnalyticsKeyRef.current = null; setAnalyticsDays(d as 7 | 30 | 90); }} className={`px-3 py-1.5 text-sm ${analyticsDays === d ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>{d}d</button>[m[41m[m
             ))}[m
           </div>[m
         </div>[m
[36m@@ -810,7 +830,7 @@[m [mexport default function AdminDashboard() {[m
             <div className="border rounded-lg p-4">[m
               <div className="font-medium text-gray-900 mb-2">No-results Queries</div>[m
               <div className="space-y-2">[m
[31m-                {(analytics?.search || []).filter((s: any) => s.noResults>0).map((s: any) => ([m
[32m+[m[32m                {(analytics?.search || []).filter((s: any) => s.noResults > 0).map((s: any) => ([m[41m[m
                   <div key={s._id} className="flex items-center justify-between text-sm">[m
                     <span className="truncate max-w-[70%]">{s._id}</span>[m
                     <span className="font-mono">{s.noResults}</span>[m
[36m@@ -825,7 +845,7 @@[m [mexport default function AdminDashboard() {[m
   }[m
 [m
   function CohortAnalytics() {[m
[31m-    const entries = Object.entries(analytics?.cohorts || {}).sort(([a],[b]) => a.localeCompare(b));[m
[32m+[m[32m    const entries = Object.entries(analytics?.cohorts || {}).sort(([a], [b]) => a.localeCompare(b));[m[41m[m
     return ([m
       <div className="p-6">[m
         <div className="mb-4 text-gray-700">Estimated average LTV: <span className="font-semibold">${(analytics?.ltv || 0).toFixed(2)}</span></div>[m
[36m@@ -836,228 +856,224 @@[m [mexport default function AdminDashboard() {[m
               <div className="text-sm text-gray-700">Users: <span className="font-medium">{val.users}</span></div>[m
               <div className="text-sm text-gray-700">Revenue: <span className="font-medium">${val.revenue.toFixed(2)}</span></div>[m
             </div>[m
[31m-          )        )}[m
[31m-      </div>[m
[31m-      [m
[31m-      {/* Product Details Modal */}[m
[31m-      {showProductModal && selectedProductForModal && ([m
[31m-        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">[m
[31m-          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">[m
[31m-            <div className="p-6">[m
[31m-              <div className="flex items-center justify-between mb-4">[m
[31m-                <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>[m
[31m-                <button[m
[31m-                  onClick={() => setShowProductModal(false)}[m
[31m-                  className="text-gray-400 hover:text-gray-600 transition-colors"[m
[31m-                >[m
[31m-                  <XCircle className="h-6 w-6" />[m
[31m-                </button>[m
[31m-              </div>[m
[31m-              [m
[31m-              <div className="space-y-6">[m
[31m-                {/* Product Image */}[m
[31m-                <div className="flex justify-center">[m
[31m-                  <img[m
[31m-                    src={selectedProductForModal.image || '/placeholder-product.svg'}[m
[31m-                    alt={selectedProductForModal.name}[m
[31m-                    className="w-48 h-48 object-cover rounded-lg border border-gray-200"[m
[31m-                    onError={(e) => {[m
[31m-                      (e.target as HTMLImageElement).src = '/placeholder-product.svg';[m
[31m-                    }}[m
[31m-                  />[m
[32m+[m[32m          ))}[m[41m[m
[32m+[m[32m        </div>[m[41m[m
[32m+[m[41m[m
[32m+[m[32m        {/* Product Details Modal */}[m[41m[m
[32m+[m[32m        {showProductModal && selectedProductForModal && ([m[41m[m
[32m+[m[32m          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">[m[41m[m
[32m+[m[32m            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">[m[41m[m
[32m+[m[32m              <div className="p-6">[m[41m[m
[32m+[m[32m                <div className="flex items-center justify-between mb-4">[m[41m[m
[32m+[m[32m                  <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>[m[41m[m
[32m+[m[32m                  <button[m[41m[m
[32m+[m[32m                    onClick={() => setShowProductModal(false)}[m[41m[m
[32m+[m[32m                    className="text-gray-400 hover:text-gray-600 transition-colors"[m[41m[m
[32m+[m[32m                  >[m[41m[m
[32m+[m[32m                    <XCircle className="h-6 w-6" />[m[41m[m
[32m+[m[32m                  </button>[m[41m[m
                 </div>[m
[31m-                [m
[31m-                {/* Product Info */}[m
[31m-                <div className="space-y-4">[m
[31m-                  <div>[m
[31m-                    <h3 className="text-2xl font-bold text-gray-900">{selectedProductForModal.name}</h3>[m
[31m-                    <p className="text-lg text-gray-600 mt-1">{selectedProductForModal.description}</p>[m
[31m-                  </div>[m
[31m-                  [m
[31m-                  <div className="flex items-center space-x-4">[m
[31m-                    <span className="text-3xl font-bold text-green-600">${selectedProductForModal.price}</span>[m
[31m-                    {selectedProductForModal.originalPrice && selectedProductForModal.originalPrice > selectedProductForModal.price && ([m
[31m-                      <span className="text-xl text-gray-500 line-through">${selectedProductForModal.originalPrice}</span>[m
[31m-                    )}[m
[31m-                  </div>[m
[31m-                  [m
[31m-                  <div className="flex items-center space-x-4">[m
[31m-                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">[m
[31m-                      {selectedProductForModal.category}[m
[31m-                    </span>[m
[31m-                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">[m
[31m-                      {selectedProductForModal.brand}[m
[31m-                    </span>[m
[31m-                  </div>[m
[31m-                  [m
[31m-                  <div className="flex items-center space-x-2">[m
[31m-                    <div className="flex items-center">[m
[31m-                      {[...Array(5)].map((_, i) => ([m
[31m-                        <svg[m
[31m-                          key={i}[m
[31m-                          className={`h-5 w-5 ${[m
[31m-                            i < Math.floor(selectedProductForModal.rating || 0)[m
[31m-                              ? 'text-yellow-400'[m
[31m-                              : 'text-gray-300'[m
[31m-                          }`}[m
[31m-                          fill="currentColor"[m
[31m-                          viewBox="0 0 20 20"[m
[31m-                        >[m
[31m-                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />[m
[31m-                        </svg>[m
[31m-                      ))}[m
[31m-                      <span className="text-sm text-gray-500 ml-2">[m
[31m-                        {selectedProductForModal.rating || 0} ({selectedProductForModal.reviewCount || 0} reviews)[m
[31m-                      </span>[m
[31m-                    </div>[m
[32m+[m[41m[m
[32m+[m[32m                <div className="space-y-6">[m[41m[m
[32m+[m[32m                  {/* Product Image */}[m[41m[m
[32m+[m[32m                  <div className="flex justify-center">[m[41m[m
[32m+[m[32m                    <img[m[41m[m
[32m+[m[32m                      src={selectedProductForModal.image || '/placeholder-product.svg'}[m[41m[m
[32m+[m[32m                      alt={selectedProductForModal.name}[m[41m[m
[32m+[m[32m                      className="w-48 h-48 object-cover rounded-lg border border-gray-200"[m[41m[m
[32m+[m[32m                      onError={(e) => {[m[41m[m
[32m+[m[32m                        (e.target as HTMLImageElement).src = '/placeholder-product.svg';[m[41m[m
[32m+[m[32m                      }}[m[41m[m
[32m+[m[32m                    />[m[41m[m
                   </div>[m
[31m-                  [m
[31m-                  <div className="grid grid-cols-2 gap-4">[m
[32m+[m[41m[m
[32m+[m[32m                  {/* Product Info */}[m[41m[m
[32m+[m[32m                  <div className="space-y-4">[m[41m[m
                     <div>[m
[31m-                      <h4 className="font-medium text-gray-900 mb-2">Stock Status</h4>[m
[31m-                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${[m
[31m-                        selectedProductForModal.inStock [m
[31m-                          ? 'bg-green-100 text-green-800' [m
[31m-                          : 'bg-red-100 text-red-800'[m
[31m-                      }`}>[m
[31m-                        {selectedProductForModal.inStock ? `In Stock (${selectedProductForModal.stockCount || 0})` : 'Out of Stock'}[m
[31m-                      </span>[m
[32m+[m[32m                      <h3 className="text-2xl font-bold text-gray-900">{selectedProductForModal.name}</h3>[m[41m[m
[32m+[m[32m                      <p className="text-lg text-gray-600 mt-1">{selectedProductForModal.description}</p>[m[41m[m
                     </div>[m
[31m-                    <div>[m
[31m-                      <h4 className="font-medium text-gray-900 mb-2">Status</h4>[m
[31m-                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${[m
[31m-                        selectedProductForModal.isActive [m
[31m-                          ? 'bg-green-100 text-green-800' [m
[31m-                          : 'bg-gray-100 text-gray-800'[m
[31m-                      }`}>[m
[31m-                        {selectedProductForModal.isActive ? 'Active' : 'Inactive'}[m
[32m+[m[41m[m
[32m+[m[32m                    <div className="flex items-center space-x-4">[m[41m[m
[32m+[m[32m                      <span className="text-3xl font-bold text-green-600">${selectedProductForModal.price}</span>[m[41m[m
[32m+[m[32m                      {selectedProductForModal.originalPrice && selectedProductForModal.originalPrice > selectedProductForModal.price && ([m[41m[m
[32m+[m[32m                        <span className="text-xl text-gray-500 line-through">${selectedProductForModal.originalPrice}</span>[m[41m[m
[32m+[m[32m                      )}[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    <div className="flex items-center space-x-4">[m[41m[m
[32m+[m[32m                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">[m[41m[m
[32m+[m[32m                        {selectedProductForModal.category}[m[41m[m
[32m+[m[32m                      </span>[m[41m[m
[32m+[m[32m                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">[m[41m[m
[32m+[m[32m                        {selectedProductForModal.brand}[m[41m[m
                       </span>[m
                     </div>[m
[31m-                  </div>[m
[31m-                  [m
[31m-                  {isSuperAdmin && ([m
[31m-                    <div className="flex items-center justify-between p-4 border border-purple-100 rounded-lg bg-purple-50/40">[m
[32m+[m[41m[m
[32m+[m[32m                    <div className="flex items-center space-x-2">[m[41m[m
[32m+[m[32m                      <div className="flex items-center">[m[41m[m
[32m+[m[32m                        {[...Array(5)].map((_, i) => ([m[41m[m
[32m+[m[32m                          <svg[m[41m[m
[32m+[m[32m                            key={i}[m[41m[m
[32m+[m[32m                            className={`h-5 w-5 ${i < Math.floor(selectedProductForModal.rating || 0)[m[41m[m
[32m+[m[32m                              ? 'text-yellow-400'[m[41m[m
[32m+[m[32m                              : 'text-gray-300'[m[41m[m
[32m+[m[32m                              }`}[m[41m[m
[32m+[m[32m                            fill="currentColor"[m[41m[m
[32m+[m[32m                            viewBox="0 0 20 20"[m[41m[m
[32m+[m[32m                          >[m[41m[m
[32m+[m[32m                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />[m[41m[m
[32m+[m[32m                          </svg>[m[41m[m
[32m+[m[32m                        ))}[m[41m[m
[32m+[m[32m                        <span className="text-sm text-gray-500 ml-2">[m[41m[m
[32m+[m[32m                          {selectedProductForModal.rating || 0} ({selectedProductForModal.reviewCount || 0} reviews)[m[41m[m
[32m+[m[32m                        </span>[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    <div className="grid grid-cols-2 gap-4">[m[41m[m
                       <div>[m
[31m-                        <h4 className="font-medium text-purple-900 mb-1">Etsy Export</h4>[m
[31m-                        <p className="text-sm text-purple-700">[m
[31m-                          {selectedProductForModal.etsyExported[m
[31m-                            ? `Exported${selectedProductForModal.etsyExportedAt ? ` on ${new Date(selectedProductForModal.etsyExportedAt).toLocaleDateString()}` : ''}`[m
[31m-                            : 'Not exported yet'}[m
[31m-                        </p>[m
[32m+[m[32m                        <h4 className="font-medium text-gray-900 mb-2">Stock Status</h4>[m[41m[m
[32m+[m[32m                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedProductForModal.inStock[m[41m[m
[32m+[m[32m                          ? 'bg-green-100 text-green-800'[m[41m[m
[32m+[m[32m                          : 'bg-red-100 text-red-800'[m[41m[m
[32m+[m[32m                          }`}>[m[41m[m
[32m+[m[32m                          {selectedProductForModal.inStock ? `In Stock (${selectedProductForModal.stockCount || 0})` : 'Out of Stock'}[m[41m[m
[32m+[m[32m                        </span>[m[41m[m
                       </div>[m
[31m-                      <button[m
[31m-                        onClick={() => handleToggleEtsyExport(selectedProductForModal._id, !selectedProductForModal.etsyExported)}[m
[31m-                        disabled={!!etsyExportLoading[selectedProductForModal._id]}[m
[31m-                        className={`inline-flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium ${[m
[31m-                          selectedProductForModal.etsyExported[m
[32m+[m[32m                      <div>[m[41m[m
[32m+[m[32m                        <h4 className="font-medium text-gray-900 mb-2">Status</h4>[m[41m[m
[32m+[m[32m                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedProductForModal.isActive[m[41m[m
[32m+[m[32m                          ? 'bg-green-100 text-green-800'[m[41m[m
[32m+[m[32m                          : 'bg-gray-100 text-gray-800'[m[41m[m
[32m+[m[32m                          }`}>[m[41m[m
[32m+[m[32m                          {selectedProductForModal.isActive ? 'Active' : 'Inactive'}[m[41m[m
[32m+[m[32m                        </span>[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    {isSuperAdmin && ([m[41m[m
[32m+[m[32m                      <div className="flex items-center justify-between p-4 border border-purple-100 rounded-lg bg-purple-50/40">[m[41m[m
[32m+[m[32m                        <div>[m[41m[m
[32m+[m[32m                          <h4 className="font-medium text-purple-900 mb-1">Etsy Export</h4>[m[41m[m
[32m+[m[32m                          <p className="text-sm text-purple-700">[m[41m[m
[32m+[m[32m                            {selectedProductForModal.etsyExported[m[41m[m
[32m+[m[32m                              ? `Exported${selectedProductForModal.etsyExportedAt ? ` on ${new Date(selectedProductForModal.etsyExportedAt).toLocaleDateString()}` : ''}`[m[41m[m
[32m+[m[32m                              : 'Not exported yet'}[m[41m[m
[32m+[m[32m                          </p>[m[41m[m
[32m+[m[32m                        </div>[m[41m[m
[32m+[m[32m                        <button[m[41m[m
[32m+[m[32m                          onClick={() => handleToggleEtsyExport(selectedProductForModal._id, !selectedProductForModal.etsyExported)}[m[41m[m
[32m+[m[32m                          disabled={!!etsyExportLoading[selectedProductForModal._id]}[m[41m[m
[32m+[m[32m                          className={`inline-flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium ${selectedProductForModal.etsyExported[m[41m[m
                             ? 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'[m
                             : 'bg-purple-600 text-white hover:bg-purple-700'[m
[31m-                        } ${etsyExportLoading[selectedProductForModal._id] ? 'opacity-60 cursor-not-allowed' : ''}`}[m
[31m-                      >[m
[31m-                        {etsyExportLoading[selectedProductForModal._id] ? ([m
[31m-                          <Loader2 className="h-4 w-4 animate-spin" />[m
[31m-                        ) : ([m
[31m-                          <CheckCircle className="h-4 w-4" />[m
[31m-                        )}[m
[31m-                        <span>{selectedProductForModal.etsyExported ? 'Unmark' : 'Mark exported'}</span>[m
[31m-                      </button>[m
[31m-                    </div>[m
[31m-                  )}[m
[31m-                  [m
[31m-                  {selectedProductForModal.tags && selectedProductForModal.tags.length > 0 && ([m
[31m-                    <div>[m
[31m-                      <h4 className="font-medium text-gray-900 mb-2">Tags</h4>[m
[31m-                      <div className="flex flex-wrap gap-2">[m
[31m-                        {selectedProductForModal.tags.map((tag, index) => ([m
[31m-                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">[m
[31m-                            {tag}[m
[31m-                          </span>[m
[31m-                        ))}[m
[32m+[m[32m                            } ${etsyExportLoading[selectedProductForModal._id] ? 'opacity-60 cursor-not-allowed' : ''}`}[m[41m[m
[32m+[m[32m                        >[m[41m[m
[32m+[m[32m                          {etsyExportLoading[selectedProductForModal._id] ? ([m[41m[m
[32m+[m[32m                            <Loader2 className="h-4 w-4 animate-spin" />[m[41m[m
[32m+[m[32m                          ) : ([m[41m[m
[32m+[m[32m                            <CheckCircle className="h-4 w-4" />[m[41m[m
[32m+[m[32m                          )}[m[41m[m
[32m+[m[32m                          <span>{selectedProductForModal.etsyExported ? 'Unmark' : 'Mark exported'}</span>[m[41m[m
[32m+[m[32m                        </button>[m[41m[m
                       </div>[m
[31m-                    </div>[m
[31m-                  )}[m
[31m-                  [m
[31m-                  {selectedProductForModal.specifications && Object.keys(selectedProductForModal.specifications).length > 0 && ([m
[31m-                    <div>[m
[31m-                      <h4 className="font-medium text-gray-900 mb-2">Specifications</h4>[m
[31m-                      <div className="grid grid-cols-1 gap-2">[m
[31m-                        {Object.entries(selectedProductForModal.specifications).map(([key, value]) => ([m
[31m-                          <div key={key} className="flex justify-between py-1 border-b border-gray-100">[m
[31m-                            <span className="font-medium text-gray-600">{key}:</span>[m
[31m-                            <span className="text-gray-900">{value}</span>[m
[32m+[m[32m                    )}[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    {selectedProductForModal.tags && selectedProductForModal.tags.length > 0 && ([m[41m[m
[32m+[m[32m                      <div>[m[41m[m
[32m+[m[32m                        <h4 className="font-medium text-gray-900 mb-2">Tags</h4>[m[41m[m
[32m+[m[32m                        <div className="flex flex-wrap gap-2">[m[41m[m
[32m+[m[32m                          {selectedProductForModal.tags.map((tag, index) => ([m[41m[m
[32m+[m[32m                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">[m[41m[m
[32m+[m[32m                              {tag}[m[41m[m
[32m+[m[32m                            </span>[m[41m[m
[32m+[m[32m                          ))}[m[41m[m
[32m+[m[32m                        </div>[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                    )}[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    {selectedProductForModal.specifications && Object.keys(selectedProductForModal.specifications).length > 0 && ([m[41m[m
[32m+[m[32m                      <div>[m[41m[m
[32m+[m[32m                        <h4 className="font-medium text-gray-900 mb-2">Specifications</h4>[m[41m[m
[32m+[m[32m                        <div className="grid grid-cols-1 gap-2">[m[41m[m
[32m+[m[32m                          {Object.entries(selectedProductForModal.specifications).map(([key, value]) => ([m[41m[m
[32m+[m[32m                            <div key={key} className="flex justify-between py-1 border-b border-gray-100">[m[41m[m
[32m+[m[32m                              <span className="font-medium text-gray-600">{key}:</span>[m[41m[m
[32m+[m[32m                              <span className="text-gray-900">{value}</span>[m[41m[m
[32m+[m[32m                            </div>[m[41m[m
[32m+[m[32m                          ))}[m[41m[m
[32m+[m[32m                        </div>[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                    )}[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    {isSuperAdmin && ([m[41m[m
[32m+[m[32m                      <div className="space-y-3">[m[41m[m
[32m+[m[32m                        <h4 className="font-medium text-gray-900">Quick Copy for Etsy</h4>[m[41m[m
[32m+[m[32m                        {[[m[41m[m
[32m+[m[32m                          { label: 'Title', value: selectedProductTitle },[m[41m[m
[32m+[m[32m                          { label: 'Description', value: selectedProductDescription },[m[41m[m
[32m+[m[32m                          { label: 'Tags', value: selectedProductTagsText },[m[41m[m
[32m+[m[32m                          { label: 'Specifications', value: selectedProductSpecsText },[m[41m[m
[32m+[m[32m                        ].map(section => ([m[41m[m
[32m+[m[32m                          <div key={section.label} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3">[m[41m[m
[32m+[m[32m                            <div className="flex-1">[m[41m[m
[32m+[m[32m                              <p className="text-xs uppercase tracking-wide text-gray-500">{section.label}</p>[m[41m[m
[32m+[m[32m                              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">[m[41m[m
[32m+[m[32m                                {section.value || '—'}[m[41m[m
[32m+[m[32m                              </p>[m[41m[m
[32m+[m[32m                            </div>[m[41m[m
[32m+[m[32m                            <button[m[41m[m
[32m+[m[32m                              onClick={() => copyProductSection(section.label, section.value)}[m[41m[m
[32m+[m[32m                              className="inline-flex items-center space-x-1 rounded-md border border-purple-200 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"[m[41m[m
[32m+[m[32m                            >[m[41m[m
[32m+[m[32m                              <Copy className="h-4 w-4" />[m[41m[m
[32m+[m[32m                              <span>Copy</span>[m[41m[m
[32m+[m[32m                            </button>[m[41m[m
                           </div>[m
                         ))}[m
                       </div>[m
[31m-                    </div>[m
[31m-                  )}[m
[31m-                  [m
[31m-                  {isSuperAdmin && ([m
[31m-                    <div className="space-y-3">[m
[31m-                      <h4 className="font-medium text-gray-900">Quick Copy for Etsy</h4>[m
[31m-                      {[[m
[31m-                        { label: 'Title', value: selectedProductTitle },[m
[31m-                        { label: 'Description', value: selectedProductDescription },[m
[31m-                        { label: 'Tags', value: selectedProductTagsText },[m
[31m-                        { label: 'Specifications', value: selectedProductSpecsText },[m
[31m-                      ].map(section => ([m
[31m-                        <div key={section.label} className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-3">[m
[31m-                          <div className="flex-1">[m
[31m-                            <p className="text-xs uppercase tracking-wide text-gray-500">{section.label}</p>[m
[31m-                            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">[m
[31m-                              {section.value || '—'}[m
[31m-                            </p>[m
[31m-                          </div>[m
[31m-                          <button[m
[31m-                            onClick={() => copyProductSection(section.label, section.value)}[m
[31m-                            className="inline-flex items-center space-x-1 rounded-md border border-purple-200 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"[m
[31m-                          >[m
[31m-                            <Copy className="h-4 w-4" />[m
[31m-                            <span>Copy</span>[m
[31m-                          </button>[m
[31m-                        </div>[m
[31m-                      ))}[m
[31m-                    </div>[m
[31m-                  )}[m
[31m-                  [m
[31m-                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">[m
[31m-                    <div>[m
[31m-                      <span className="font-medium">Created:</span> {new Date(selectedProductForModal.createdAt).toLocaleDateString()}[m
[31m-                    </div>[m
[31m-                    <div>[m
[31m-                      <span className="font-medium">Updated:</span> {new Date(selectedProductForModal.updatedAt).toLocaleDateString()}[m
[32m+[m[32m                    )}[m[41m[m
[32m+[m[41m[m
[32m+[m[32m                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">[m[41m[m
[32m+[m[32m                      <div>[m[41m[m
[32m+[m[32m                        <span className="font-medium">Created:</span> {new Date(selectedProductForModal.createdAt).toLocaleDateString()}[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                      <div>[m[41m[m
[32m+[m[32m                        <span className="font-medium">Updated:</span> {new Date(selectedProductForModal.updatedAt).toLocaleDateString()}[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
                     </div>[m
                   </div>[m
                 </div>[m
[31m-              </div>[m
[31m-              [m
[31m-              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">[m
[31m-                <button[m
[31m-                  onClick={() => setShowProductModal(false)}[m
[31m-                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"[m
[31m-                >[m
[31m-                  Close[m
[31m-                </button>[m
[31m-                <button[m
[31m-                  onClick={() => {[m
[31m-                    handleProductSelection(selectedProductForModal._id);[m
[31m-                    toast.success(selectedProductIds.includes(selectedProductForModal._id) ? 'Product deselected' : 'Product selected');[m
[31m-                    setShowProductModal(false);[m
[31m-                  }}[m
[31m-                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"[m
[31m-                >[m
[31m-                  {selectedProductIds.includes(selectedProductForModal._id) ? 'Deselect' : 'Select'} Product[m
[31m-                </button>[m
[32m+[m[41m[m
[32m+[m[32m                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">[m[41m[m
[32m+[m[32m                  <button[m[41m[m
[32m+[m[32m                    onClick={() => setShowProductModal(false)}[m[41m[m
[32m+[m[32m                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"[m[41m[m
[32m+[m[32m                  >[m[41m[m
[32m+[m[32m                    Close[m[41m[m
[32m+[m[32m                  </button>[m[41m[m
[32m+[m[32m                  <button[m[41m[m
[32m+[m[32m                    onClick={() => {[m[41m[m
[32m+[m[32m                      handleProductSelection(selectedProductForModal._id);[m[41m[m
[32m+[m[32m                      toast.success(selectedProductIds.includes(selectedProductForModal._id) ? 'Product deselected' : 'Product selected');[m[41m[m
[32m+[m[32m                      setShowProductModal(false);[m[41m[m
[32m+[m[32m                    }}[m[41m[m
[32m+[m[32m                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"[m[41m[m
[32m+[m[32m                  >[m[41m[m
[32m+[m[32m                    {selectedProductIds.includes(selectedProductForModal._id) ? 'Deselect' : 'Select'} Product[m[41m[m
[32m+[m[32m                  </button>[m[41m[m
[32m+[m[32m                </div>[m[41m[m
               </div>[m
             </div>[m
           </div>[m
[31m-        </div>[m
[31m-      )}[m
[31m-    </div>[m
[31m-  );[m
[31m-}[m
[32m+[m[32m        )}[m[41m[m
[32m+[m[32m      </div>[m[41m[m
[32m+[m[32m    );[m[41m[m
[32m+[m[32m  }[m[41m[m
 [m
   function EventTester() {[m
[31m-    const [type, setType] = useState<'product_view'|'add_to_cart'|'checkout_start'|'purchase'|'page_view'>('page_view');[m
[32m+[m[32m    const [type, setType] = useState<'product_view' | 'add_to_cart' | 'checkout_start' | 'purchase' | 'page_view'>('page_view');[m[41m[m
     const [productId, setProductId] = useState('');[m
     const [orderId, setOrderId] = useState('');[m
     const [value, setValue] = useState('');[m
[36m@@ -1102,9 +1118,9 @@[m [mexport default function AdminDashboard() {[m
         <div className="space-y-4">[m
           <div className="text-sm font-semibold text-blue-900">Send Event</div>[m
           <div className="grid grid-cols-2 gap-3">[m
[31m-            <select [m
[31m-              value={type} [m
[31m-              onChange={(e) => setType(e.target.value as any)} [m
[32m+[m[32m            <select[m[41m[m
[32m+[m[32m              value={type}[m[41m[m
[32m+[m[32m              onChange={(e) => setType(e.target.value as any)}[m[41m[m
               className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"[m
             >[m
               <option value="page_view">page_view</option>[m
[36m@@ -1113,28 +1129,28 @@[m [mexport default function AdminDashboard() {[m
               <option value="checkout_start">checkout_start</option>[m
               <option value="purchase">purchase</option>[m
             </select>[m
[31m-            <input [m
[31m-              placeholder="value (optional)" [m
[31m-              value={value} [m
[31m-              onChange={(e)=>setValue(e.target.value)} [m
[31m-              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" [m
[32m+[m[32m            <input[m[41m[m
[32m+[m[32m              placeholder="value (optional)"[m[41m[m
[32m+[m[32m              value={value}[m[41m[m
[32m+[m[32m              onChange={(e) => setValue(e.target.value)}[m[41m[m
[32m+[m[32m              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"[m[41m[m
             />[m
[31m-            <input [m
[31m-              placeholder="productId" [m
[31m-              value={productId} [m
[31m-              onChange={(e)=>setProductId(e.target.value)} [m
[31m-              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" [m
[32m+[m[32m            <input[m[41m[m
[32m+[m[32m              placeholder="productId"[m[41m[m
[32m+[m[32m              value={productId}[m[41m[m
[32m+[m[32m              onChange={(e) => setProductId(e.target.value)}[m[41m[m
[32m+[m[32m              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"[m[41m[m
             />[m
[31m-            <input [m
[31m-              placeholder="orderId" [m
[31m-              value={orderId} [m
[31m-              onChange={(e)=>setOrderId(e.target.value)} [m
[31m-              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" [m
[32m+[m[32m            <input[m[41m[m
[32m+[m[32m              placeholder="orderId"[m[41m[m
[32m+[m[32m              value={orderId}[m[41m[m
[32m+[m[32m              onChange={(e) => setOrderId(e.target.value)}[m[41m[m
[32m+[m[32m              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"[m[41m[m
             />[m
           </div>[m
[31m-          <button [m
[31m-            onClick={sendEvent} [m
[31m-            disabled={loading} [m
[32m+[m[32m          <button[m[41m[m
[32m+[m[32m            onClick={sendEvent}[m[41m[m
[32m+[m[32m            disabled={loading}[m[41m[m
             className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 w-fit transition-all duration-200 shadow-sm hover:shadow-md"[m
           >[m
             {loading ? 'Sending...' : 'Send'}[m
[36m@@ -1143,22 +1159,22 @@[m [mexport default function AdminDashboard() {[m
         <div className="space-y-4">[m
           <div className="text-sm font-semibold text-blue-900">Record Search</div>[m
           <div className="grid grid-cols-2 gap-3">[m
[31m-            <input [m
[31m-              placeholder="query" [m
[31m-              value={query} [m
[31m-              onChange={(e)=>setQuery(e.target.value)} [m
[31m-              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" [m
[32m+[m[32m            <input[m[41m[m
[32m+[m[32m              placeholder="query"[m[41m[m
[32m+[m[32m              value={query}[m[41m[m
[32m+[m[32m              onChange={(e) => setQuery(e.target.value)}[m[41m[m
[32m+[m[32m              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"[m[41m[m
             />[m
[31m-            <input [m
[31m-              placeholder="results count" [m
[31m-              value={results} [m
[31m-              onChange={(e)=>setResults(e.target.value)} [m
[31m-              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors" [m
[32m+[m[32m            <input[m[41m[m
[32m+[m[32m              placeholder="results count"[m[41m[m
[32m+[m[32m              value={results}[m[41m[m
[32m+[m[32m              onChange={(e) => setResults(e.target.value)}[m[41m[m
[32m+[m[32m              className="px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"[m[41m[m
             />[m
           </div>[m
[31m-          <button [m
[31m-            onClick={sendSearch} [m
[31m-            disabled={loading} [m
[32m+[m[32m          <button[m[41m[m
[32m+[m[32m            onClick={sendSearch}[m[41m[m
[32m+[m[32m            disabled={loading}[m[41m[m
             className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 w-fit transition-all duration-200 shadow-sm hover:shadow-md"[m
           >[m
             {loading ? 'Recording...' : 'Record'}[m
[36m@@ -1295,8 +1311,8 @@[m [mexport default function AdminDashboard() {[m
   }, [isAuthenticated, user, router, activeTab]);[m
 [m
   const getAttributionCookies = () => {[m
[31m-    if (typeof document === 'undefined') return [] as Array<{ key: string; value: string }>; [m
[31m-    const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','ref','aff'];[m
[32m+[m[32m    if (typeof document === 'undefined') return [] as Array<{ key: string; value: string }>;[m[41m[m
[32m+[m[32m    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'aff'];[m[41m[m
     const cookies = document.cookie.split(';').map(c => c.trim());[m
     const map: Record<string, string> = {};[m
     for (const c of cookies) {[m
[36m@@ -1465,13 +1481,13 @@[m [mexport default function AdminDashboard() {[m
       const token = localStorage.getItem('token');[m
       const page = pageToFetch || productPage;[m
       const limit = productPerPage;[m
[31m-      [m
[32m+[m[41m[m
       // Build query params including all filters[m
       const params = new URLSearchParams({[m
         page: page.toString(),[m
         limit: limit.toString(),[m
       });[m
[31m-      [m
[32m+[m[41m[m
       if (searchTerm) {[m
         params.append('search', searchTerm);[m
       }[m
[36m@@ -1499,7 +1515,7 @@[m [mexport default function AdminDashboard() {[m
       if (productSortOrder) {[m
         params.append('sortOrder', productSortOrder);[m
       }[m
[31m-      [m
[32m+[m[41m[m
       const res = await fetch(`/api/admin/products?${params.toString()}`, {[m
         headers: { 'Authorization': `Bearer ${token}` },[m
       });[m
[36m@@ -1549,7 +1565,7 @@[m [mexport default function AdminDashboard() {[m
       const response = await fetch('/api/products/email-stats', {[m
         headers: { 'Authorization': `Bearer ${token}` },[m
       });[m
[31m-      [m
[32m+[m[41m[m
       if (response.ok) {[m
         const data = await response.json();[m
         if (data.success && data.productStats) {[m
[36m@@ -1582,7 +1598,7 @@[m [mexport default function AdminDashboard() {[m
     if (productSortBy !== column) {[m
       return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />;[m
     }[m
[31m-    return productSortOrder === 'asc' [m
[32m+[m[32m    return productSortOrder === 'asc'[m[41m[m
       ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />[m
       : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />;[m
   };[m
[36m@@ -1658,15 +1674,15 @@[m [mexport default function AdminDashboard() {[m
               prev.map(p =>[m
                 p._id === product._id[m
                   ? {[m
[31m-                      ...p,[m
[31m-                      policyReview: {[m
[31m-                        lastRunAt: data.policyReview.lastRunAt,[m
[31m-                        score: data.policyReview.score,[m
[31m-                        complianceRate: data.policyReview.complianceRate,[m
[31m-                        summary: data.policyReview.summary,[m
[31m-                        aiReview: data.policyReview.aiReview,[m
[31m-                      },[m
[31m-                    }[m
[32m+[m[32m                    ...p,[m[41m[m
[32m+[m[32m                    policyReview: {[m[41m[m
[32m+[m[32m                      lastRunAt: data.policyReview.lastRunAt,[m[41m[m
[32m+[m[32m                      score: data.policyReview.score,[m[41m[m
[32m+[m[32m                      complianceRate: data.policyReview.complianceRate,[m[41m[m
[32m+[m[32m                      summary: data.policyReview.summary,[m[41m[m
[32m+[m[32m                      aiReview: data.policyReview.aiReview,[m[41m[m
[32m+[m[32m                    },[m[41m[m
[32m+[m[32m                  }[m[41m[m
                   : p[m
               )[m
             );[m
[36m@@ -1711,15 +1727,15 @@[m [mexport default function AdminDashboard() {[m
         prev.map(p =>[m
           p._id === product._id[m
             ? {[m
[31m-                ...p,[m
[31m-                policyReview: {[m
[31m-                  lastRunAt: persistedPolicyReview.lastRunAt,[m
[31m-                  score: persistedPolicyReview.score,[m
[31m-                  complianceRate: persistedPolicyReview.complianceRate,[m
[31m-                  summary: persistedPolicyReview.summary,[m
[31m-                  aiReview: persistedPolicyReview.aiReview,[m
[31m-                },[m
[31m-              }[m
[32m+[m[32m              ...p,[m[41m[m
[32m+[m[32m              policyReview: {[m[41m[m
[32m+[m[32m                lastRunAt: persistedPolicyReview.lastRunAt,[m[41m[m
[32m+[m[32m                score: persistedPolicyReview.score,[m[41m[m
[32m+[m[32m                complianceRate: persistedPolicyReview.complianceRate,[m[41m[m
[32m+[m[32m                summary: persistedPolicyReview.summary,[m[41m[m
[32m+[m[32m                aiReview: persistedPolicyReview.aiReview,[m[41m[m
[32m+[m[32m              },[m[41m[m
[32m+[m[32m            }[m[41m[m
             : p[m
         )[m
       );[m
[36m@@ -1780,10 +1796,10 @@[m [mexport default function AdminDashboard() {[m
         },[m
         body: JSON.stringify({ reviewSummary: review }),[m
       });[m
[31m-      [m
[32m+[m[41m[m
       console.log('[Frontend] Response status:', response.status);[m
       console.log('[Frontend] Response ok:', response.ok);[m
[31m-      [m
[32m+[m[41m[m
       let data;[m
       try {[m
         const text = await response.text();[m
[36m@@ -1794,9 +1810,9 @@[m [mexport default function AdminDashboard() {[m
         console.error('[Frontend] Failed to parse response:', parseError);[m
         throw new Error('Failed to parse server response');[m
       }[m
[31m-      [m
[32m+[m[41m[m
       console.log('[Frontend] Parsed data:', data);[m
[31m-      [m
[32m+[m[41m[m
       if (!response.ok) {[m
         console.error('[Frontend] Response not ok. Error:', data.error);[m
         throw new Error(data.error || 'Failed to generate improvements');[m
[36m@@ -1804,7 +1820,7 @@[m [mexport default function AdminDashboard() {[m
 [m
       const improvements: ProductImprovementResult | undefined = data?.improvements;[m
       console.log('[Frontend] Improvements received:', !!improvements);[m
[31m-      [m
[32m+[m[41m[m
       const selection = {[m
         title: !!improvements?.title?.suggestion,[m
         description: !!improvements?.description?.suggestion,[m
[36m@@ -1998,11 +2014,10 @@[m [mexport default function AdminDashboard() {[m
             type="button"[m
             onClick={() => goToProductPage(productPage - 1)}[m
             disabled={productPage === 1 || loading}[m
[31m-            className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${[m
[31m-              productPage === 1 || loading[m
[31m-                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'[m
[31m-                : 'text-gray-700 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'[m
[31m-            }`}[m
[32m+[m[32m            className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${productPage === 1 || loading[m[41m[m
[32m+[m[32m              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'[m[41m[m
[32m+[m[32m              : 'text-gray-700 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'[m[41m[m
[32m+[m[32m              }`}[m[41m[m
           >[m
             <span className="flex items-center space-x-1.5">[m
               <ChevronLeft className="h-4 w-4" />[m
[36m@@ -2016,11 +2031,10 @@[m [mexport default function AdminDashboard() {[m
             type="button"[m
             onClick={() => goToProductPage(productPage + 1)}[m
             disabled={productPage === totalPages || loading}[m
[31m-            className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${[m
[31m-              productPage === totalPages || loading[m
[31m-                ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'[m
[31m-                : 'text-gray-700 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'[m
[31m-            }`}[m
[32m+[m[32m            className={`px-4 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${productPage === totalPages || loading[m[41m[m
[32m+[m[32m              ? 'text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed'[m[41m[m
[32m+[m[32m              : 'text-gray-700 border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5'[m[41m[m
[32m+[m[32m              }`}[m[41m[m
           >[m
             <span className="flex items-center space-x-1.5">[m
               <span>Next</span>[m
[36m@@ -2204,7 +2218,7 @@[m [mexport default function AdminDashboard() {[m
       toast.success([m
         `Images organized! ${data.stats?.uploaded || 0} uploaded to Cloudinary folder: ${data.product?.folder || ''}`[m
       );[m
[31m-      [m
[32m+[m[41m[m
       // Refresh products list[m
       fetchProducts();[m
     } catch (error) {[m
[36m@@ -2283,7 +2297,7 @@[m [mexport default function AdminDashboard() {[m
       toast.error('No alt texts available. Generate them first!');[m
       return;[m
     }[m
[31m-    const altTextsString = altTexts.map((text: string, index: number) => [m
[32m+[m[32m    const altTextsString = altTexts.map((text: string, index: number) =>[m[41m[m
       `Image ${index + 1}: ${text}`[m
     ).join('\n');[m
     copyToClipboard(altTextsString, 'Image Alt Texts');[m
[36m@@ -2313,7 +2327,7 @@[m [mexport default function AdminDashboard() {[m
       toast.success([m
         `Generated ${data.altTexts?.length || 0} unique alt texts for product images!`[m
       );[m
[31m-      [m
[32m+[m[41m[m
       // Refresh products list[m
       fetchProducts();[m
     } catch (error) {[m
[36m@@ -2347,8 +2361,8 @@[m [mexport default function AdminDashboard() {[m
 [m
   // Handle product selection for export[m
   const handleProductSelection = (productId: string) => {[m
[31m-    setSelectedProductIds(prev => [m
[31m-      prev.includes(productId) [m
[32m+[m[32m    setSelectedProductIds(prev =>[m[41m[m
[32m+[m[32m      prev.includes(productId)[m[41m[m
         ? prev.filter(id => id !== productId)[m
         : [...prev, productId][m
     );[m
[36m@@ -2588,6 +2602,55 @@[m [mexport default function AdminDashboard() {[m
     }[m
   };[m
 [m
[32m+[m[32m  const handleExportCsv = async () => {[m[41m[m
[32m+[m[32m    try {[m[41m[m
[32m+[m[32m      const token = localStorage.getItem('token');[m[41m[m
[32m+[m[32m      if (!token) {[m[41m[m
[32m+[m[32m        toast.error('Please login to export data');[m[41m[m
[32m+[m[32m        router.push('/login');[m[41m[m
[32m+[m[32m        return;[m[41m[m
[32m+[m[32m      }[m[41m[m
[32m+[m[41m[m
[32m+[m[32m      const response = await fetch('/api/admin/products/export-csv', {[m[41m[m
[32m+[m[32m        headers: {[m[41m[m
[32m+[m[32m          'Authorization': `Bearer ${token}`,[m[41m[m
[32m+[m[32m        },[m[41m[m
[32m+[m[32m      });[m[41m[m
[32m+[m[41m[m
[32m+[m[32m      if (!response.ok) {[m[41m[m
[32m+[m[32m        if (response.status === 401) {[m[41m[m
[32m+[m[32m          localStorage.removeItem('token');[m[41m[m
[32m+[m[32m          router.push('/login');[m[41m[m
[32m+[m[32m          toast.error('Session expired. Please login again.');[m[41m[m
[32m+[m[32m          return;[m[41m[m
[32m+[m[32m        }[m[41m[m
[32m+[m[32m        const errorData = await response.json().catch(() => ({}));[m[41m[m
[32m+[m[32m        throw new Error(errorData.error || 'Failed to export CSV');[m[41m[m
[32m+[m[32m      }[m[41m[m
[32m+[m[41m[m
[32m+[m[32m      // Get the blob content[m[41m[m
[32m+[m[32m      const blob = await response.blob();[m[41m[m
[32m+[m[32m      const url = window.URL.createObjectURL(blob);[m[41m[m
[32m+[m[41m[m
[32m+[m[32m      // Create download link[m[41m[m
[32m+[m[32m      const a = document.createElement('a');[m[41m[m
[32m+[m[32m      a.href = url;[m[41m[m
[32m+[m[32m      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;[m[41m[m
[32m+[m[32m      a.style.display = 'none';[m[41m[m
[32m+[m[32m      document.body.appendChild(a);[m[41m[m
[32m+[m[32m      a.click();[m[41m[m
[32m+[m[41m[m
[32m+[m[32m      // Cleanup[m[41m[m
[32m+[m[32m      window.URL.revokeObjectURL(url);[m[41m[m
[32m+[m[32m      document.body.removeChild(a);[m[41m[m
[32m+[m[41m[m
[32m+[m[32m      toast.success('Products exported successfully');[m[41m[m
[32m+[m[32m    } catch (error) {[m[41m[m
[32m+[m[32m      console.error('Export CSV error:', error);[m[41m[m
[32m+[m[32m      toast.error(error instanceof Error ? error.message : 'Failed to export CSV');[m[41m[m
[32m+[m[32m    }[m[41m[m
[32m+[m[32m  };[m[41m[m
[32m+[m[41m[m
   const handleDownloadInvoice = async (orderId: string) => {[m
     try {[m
       const token = localStorage.getItem('token');[m
[36m@@ -2604,11 +2667,11 @@[m [mexport default function AdminDashboard() {[m
 [m
       // Get the HTML content[m
       const htmlContent = await response.text();[m
[31m-      [m
[32m+[m[41m[m
       // Create a blob with the HTML content[m
       const blob = new Blob([htmlContent], { type: 'text/html' });[m
       const url = window.URL.createObjectURL(blob);[m
[31m-      [m
[32m+[m[41m[m
       // Create download link[m
       const a = document.createElement('a');[m
       a.href = url;[m
[36m@@ -2616,11 +2679,11 @@[m [mexport default function AdminDashboard() {[m
       a.style.display = 'none';[m
       document.body.appendChild(a);[m
       a.click();[m
[31m-      [m
[32m+[m[41m[m
       // Cleanup[m
       window.URL.revokeObjectURL(url);[m
       document.body.removeChild(a);[m
[31m-      [m
[32m+[m[41m[m
       toast.success('Invoice downloaded successfully');[m
     } catch (error) {[m
       console.error('Download invoice error:', error);[m
[36m@@ -2680,7 +2743,7 @@[m [mexport default function AdminDashboard() {[m
   // Filter users[m
   const filteredUsers = users.filter(user => {[m
     const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||[m
[31m-                         user.email.toLowerCase().includes(searchTerm.toLowerCase());[m
[32m+[m[32m      user.email.toLowerCase().includes(searchTerm.toLowerCase());[m[41m[m
     const matchesRole = !selectedRole || user.role?.name === selectedRole;[m
     return matchesSearch && matchesRole;[m
   });[m
[36m@@ -2757,8 +2820,8 @@[m [mexport default function AdminDashboard() {[m
   const selectedProductTagsText = selectedProductForModal?.tags?.join(', ') || '';[m
   const selectedProductSpecsText = selectedProductForModal?.specifications[m
     ? Object.entries(selectedProductForModal.specifications)[m
[31m-        .map(([key, value]) => `${key}: ${value}`)[m
[31m-        .join('\n')[m
[32m+[m[32m      .map(([key, value]) => `${key}: ${value}`)[m[41m[m
[32m+[m[32m      .join('\n')[m[41m[m
     : '';[m
 [m
   if (!isAuthenticated || !user?.permissions?.includes('system:settings')) {[m
[36m@@ -2804,11 +2867,10 @@[m [mexport default function AdminDashboard() {[m
           <aside[m
             id="admin-sidebar"[m
             aria-label="Admin navigation"[m
[31m-            className={`md:w-64 lg:w-72 xl:w-80 ${[m
[31m-              mobileSidebarOpen[m
[31m-                ? 'fixed inset-y-4 left-4 right-4 z-40 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl md:relative md:block md:h-full md:max-h-none md:p-0 md:border-0 md:shadow-none'[m
[31m-                : 'hidden md:block md:sticky md:top-6'[m
[31m-            }`}[m
[32m+[m[32m            className={`md:w-64 lg:w-72 xl:w-80 ${mobileSidebarOpen[m[41m[m
[32m+[m[32m              ? 'fixed inset-y-4 left-4 right-4 z-40 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl md:relative md:block md:h-full md:max-h-none md:p-0 md:border-0 md:shadow-none'[m[41m[m
[32m+[m[32m              : 'hidden md:block md:sticky md:top-6'[m[41m[m
[32m+[m[32m              }`}[m[41m[m
           >[m
             <div className={`space-y-6 ${mobileSidebarOpen ? '' : 'md:sticky md:top-6'}`}>[m
               {mobileSidebarOpen && ([m
[36m@@ -2857,11 +2919,10 @@[m [mexport default function AdminDashboard() {[m
                     return ([m
                       <div key={tab.id} className="space-y-1.5">[m
                         <div[m
[31m-                          className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm transition-all border ${[m
[31m-                            active[m
[31m-                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 shadow-sm'[m
[31m-                              : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'[m
[31m-                          }`}[m
[32m+[m[32m                          className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm transition-all border ${active[m[41m[m
[32m+[m[32m                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 shadow-sm'[m[41m[m
[32m+[m[32m                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'[m[41m[m
[32m+[m[32m                            }`}[m[41m[m
                         >[m
                           <button[m
                             type="button"[m
[36m@@ -2893,9 +2954,8 @@[m [mexport default function AdminDashboard() {[m
                               aria-controls={`sidebar-section-${tab.id}`}[m
                             >[m
                               <ChevronDown[m
[31m-                                className={`h-4 w-4 transition-transform ${[m
[31m-                                  childrenVisible ? 'rotate-180 text-blue-600' : 'text-gray-400'[m
[31m-                                }`}[m
[32m+[m[32m                                className={`h-4 w-4 transition-transform ${childrenVisible ? 'rotate-180 text-blue-600' : 'text-gray-400'[m[41m[m
[32m+[m[32m                                  }`}[m[41m[m
                               />[m
                             </button>[m
                           )}[m
[36m@@ -2906,9 +2966,8 @@[m [mexport default function AdminDashboard() {[m
                             role="region"[m
                             aria-label={`${tab.label} submenu`}[m
                             aria-hidden={!childrenVisible}[m
[31m-                            className={`ml-9 flex flex-col gap-1 border-l border-gray-100 pl-3 transition-all duration-200 ${[m
[31m-                              childrenVisible ? 'mt-1 mb-2 opacity-100' : 'max-h-0 overflow-hidden opacity-0'[m
[31m-                            }`}[m
[32m+[m[32m                            className={`ml-9 flex flex-col gap-1 border-l border-gray-100 pl-3 transition-all duration-200 ${childrenVisible ? 'mt-1 mb-2 opacity-100' : 'max-h-0 overflow-hidden opacity-0'[m[41m[m
[32m+[m[32m                              }`}[m[41m[m
                           >[m
                             {tab.children.map((child) => {[m
                               const childActive = activeTab === child.id;[m
[36m@@ -2918,11 +2977,10 @@[m [mexport default function AdminDashboard() {[m
                                   key={child.id}[m
                                   onClick={() => handleTabChange(child.id)}[m
                                   aria-current={childActive ? 'page' : undefined}[m
[31m-                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${[m
[31m-                                    childActive[m
[31m-                                      ? 'bg-blue-600/10 text-blue-700'[m
[31m-                                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'[m
[31m-                                  }`}[m
[32m+[m[32m                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${childActive[m[41m[m
[32m+[m[32m                                    ? 'bg-blue-600/10 text-blue-700'[m[41m[m
[32m+[m[32m                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'[m[41m[m
[32m+[m[32m                                    }`}[m[41m[m
                                 >[m
                                   {child.icon && ([m
                                     <child.icon[m
[36m@@ -2988,854 +3046,852 @@[m [mexport default function AdminDashboard() {[m
           <div className={`flex-1 min-w-0 ${mobileSidebarOpen ? 'lg:pl-0' : ''}`}>[m
             <div className="space-y-8">[m
 [m
[31m-        {/* Sourcing Tab */}[m
[31m-        {activeTab === 'sourcing' && ([m
[31m-          <div className="space-y-6">[m
[31m-            <SourcingPanel />[m
[31m-          </div>[m
[31m-        )}[m
[31m-[m
[31m-        {/* Overview Tab */}[m
[31m-        {activeTab === 'overview' && ([m
[31m-          <div className="space-y-6">[m
[31m-            {/* Controls for metrics */}[m
[31m-            <div className="flex items-center justify-between">[m
[31m-              <div className="flex items-center gap-2">[m
[31m-                <span className="text-sm text-gray-600">Metrics Range:</span>[m
[31m-                <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden">[m
[31m-                  {[7, 30, 90].map((d) => ([m
[31m-                    <button[m
[31m-                      key={d}[m
[31m-                      onClick={() => { setMetricsDays(d as 7 | 30 | 90); fetchMetrics(d as 7 | 30 | 90); }}[m
[31m-                      className={`px-3 py-1.5 text-sm ${metricsDays === d ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}[m
[31m-                    >[m
[31m-                      {d}d[m
[31m-                    </button>[m
[31m-                  ))}[m
[31m-        </div>[m
[31m-[m
[31m-        [m
[31m-              </div>[m
[31m-              <button onClick={() => fetchMetrics(metricsDays)} className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md">[m
[31m-                <RefreshCw className="h-4 w-4" /> Refresh[m
[31m-              </button>[m
[31m-            </div>[m
[31m-[m
[31m-            {/* New KPI Cards */}[m
[31m-            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">[m
[31m-              <div className="bg-white p-6 rounded-lg shadow-sm border">[m
[31m-                <p className="text-sm font-medium text-gray-600">Total Revenue ({metricsDays}d)</p>[m
[31m-                <p className="text-3xl font-bold text-green-600 mt-2">[m
[31m-                  ${metrics?.kpis.totalRevenue?.toFixed(2) || '0.00'}[m
[31m-                </p>[m
[31m-              </div>[m
[31m-              <div className="bg-white p-6 rounded-lg shadow-sm border">[m
[31m-                <p className="text-sm font-medium text-gray-600">Total Orders ({metricsDays}d)</p>[m
[31m-                <p className="text-3xl font-bold text-blue-600 mt-2">[m
[31m-                  {metrics?.kpis.totalOrders ?? 0}[m
[31m-                </p>[m
[31m-              </div>[m
[31m-              <div className="bg-white p-6 rounded-lg shadow-sm border">[m
[31m-                <p className="text-sm font-medium text-gray-600">Average Order Value</p>[m
[31m-                <p className="text-3xl font-bold text-purple-600 mt-2">[m
[31m-                  ${metrics?.kpis.avgOrderValue?.toFixed(2) || '0.00'}[m
[31m-                </p>[m
[31m-              </div>[m
[31m-            </div>[m
[31m-[m
[31m-            {/* Inline SVG Revenue Chart */}[m
[31m-            <div className="bg-white p-6 rounded-lg shadow-sm border">[m
[31m-              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue (last {metricsDays} days)</h3>[m
[31m-              {metricsLoading ? ([m
[31m-                <p className="text-gray-500">Loading metrics...</p>[m
[31m-              ) : chartPoints.length ? ([m
[31m-                <div className="overflow-x-auto">[m
[31m-                  <svg width={640} height={180} className="min-w-[640px]">[m
[31m-                    {/* Axes */}[m
[31m-                    <line x1="20" y1="160" x2="620" y2="160" stroke="#e5e7eb" />[m
[31m-                    <line x1="20" y1="20" x2="20" y2="160" stroke="#e5e7eb" />[m
[31m-                    {/* Path */}[m
[31m-                    <polyline[m
[31m-                      fill="none"[m
[31m-                      stroke="#3b82f6"[m
[31m-                      strokeWidth="2"[m
[31m-                      points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}[m
[31m-                    />[m
[31m-                    {/* Points */}[m
[31m-                    {chartPoints.map((p, i) => ([m
[31m-                      <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2563eb" />[m
[31m-                    ))}[m
[31m-                  </svg>[m
[32m+[m[32m              {/* Sourcing Tab */}[m[41m[m
[32m+[m[32m              {activeTab === 'sourcing' && ([m[41m[m
[32m+[m[32m                <div className="space-y-6">[m[41m[m
[32m+[m[32m                  <SourcingPanel />[m[41m[m
                 </div>[m
[31m-              ) : ([m
[31m-                <p className="text-gray-500">No data</p>[m
               )}[m
[31m-            </div>[m
 [m
[31m-            {/* Top Products */}[m
[31m-            <div className="bg-white p-6 rounded-lg shadow-sm border">[m
[31m-              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products (by revenue)</h3>[m
[31m-              {metrics?.topProducts?.length ? ([m
[31m-                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">[m
[31m-                  {metrics.topProducts.map((p) => ([m
[31m-                    <div key={p.productId} className="flex items-center gap-4 border rounded-lg p-3">[m
[31m-                      <img src={p.image || '/vercel.svg'} alt={p.name || 'Product'} className="w-14 h-14 rounded object-cover border" />[m
[31m-                      <div className="flex-1">[m
[31m-                        <div className="font-medium text-gray-900 truncate">{p.name || p.productId}</div>[m
[31m-                        <div className="text-sm text-gray-600">${p.revenue.toFixed(2)} · {p.units} units</div>[m
[32m+[m[32m              {/* Overview Tab */}[m[41m[m
[32m+[m[32m              {activeTab === 'overview' && ([m[41m[m
[32m+[m[32m                <div className="space-y-6">[m[41m[m
[32m+[m[32m                  {/* Controls for metrics */}[m[41m[m
[32m+[m[32m                  <div className="flex items-center justify-between">[m[41m[m
[32m+[m[32m                    <div className="flex items-center gap-2">[m[41m[m
[32m+[m[32m                      <span className="text-sm text-gray-600">Metrics Range:</span>[m[41m[m
[32m+[m[32m                      <div className="inline-flex rounded-md border bg-white shadow-sm overflow-hidden">[m[41m[m
[32m+[m[32m                        {[7, 30, 90].map((d) => ([m[41m[m
[32m+[m[32m                          <button[m[41m[m
[32m+[m[32m                            key={d}[m[41m[m
[32m+[m[32m                            onClick={() => { setMetricsDays(d as 7 | 30 | 90); fetchMetrics(d as 7 | 30 | 90); }}[m[41m[m
[32m+[m[32m                            className={`px-3 py-1.5 text-sm ${metricsDays === d ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}[m[41m[m
[32m+[m[32m                          >[m[41m[m
[32m+[m[32m                            {d}d[m[41m[m
[32m+[m[32m                          </button>[m[41m[m
[32m+[m[32m                        ))}[m[41m[m
                       </div>[m
[31m-                    </div>[m
[31m-                  ))}[m
[31m-                </div>[m
[31m-              ) : ([m
[31m-                <p className="text-gray-500">No top products yet.</p>[m
[31m-              )}[m
[31m-            </div>[m
 [m
[31m-            {/* Stats Grid */}[m
[31m-            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">[m
[31m-              <div onClick={goToUsers} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-blue-100 rounded-lg">[m
[31m-                    <Users className="h-6 w-6 text-blue-600" />[m
[32m+[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
[32m+[m[32m                    <button onClick={() => fetchMetrics(metricsDays)} className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-md">[m[41m[m
[32m+[m[32m                      <RefreshCw className="h-4 w-4" /> Refresh[m[41m[m
[32m+[m[32m                    </button>[m[41m[m
                   </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Total Users</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>[m
[32m+[m[41m[m
[32m+[m[32m                  {/* New KPI Cards */}[m[41m[m
[32m+[m[32m                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">[m[41m[m
[32m+[m[32m                    <div className="bg-white p-6 rounded-lg shadow-sm border">[m[41m[m
[32m+[m[32m                      <p className="text-sm font-medium text-gray-600">Total Revenue ({metricsDays}d)</p>[m[41m[m
[32m+[m[32m                      <p className="text-3xl font-bold text-green-600 mt-2">[m[41m[m
[32m+[m[32m                        ${metrics?.kpis.totalRevenue?.toFixed(2) || '0.00'}[m[41m[m
[32m+[m[32m                      </p>[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
[32m+[m[32m                    <div className="bg-white p-6 rounded-lg shadow-sm border">[m[41m[m
[32m+[m[32m                      <p className="text-sm font-medium text-gray-600">Total Orders ({metricsDays}d)</p>[m[41m[m
[32m+[m[32m                      <p className="text-3xl font-bold text-blue-600 mt-2">[m[41m[m
[32m+[m[32m                        {metrics?.kpis.totalOrders ?? 0}[m[41m[m
[32m+[m[32m                      </p>[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
[32m+[m[32m                    <div className="bg-white p-6 rounded-lg shadow-sm border">[m[41m[m
[32m+[m[32m                      <p className="text-sm font-medium text-gray-600">Average Order Value</p>[m[41m[m
[32m+[m[32m                      <p className="text-3xl font-bold text-purple-600 mt-2">[m[41m[m
[32m+[m[32m                        ${metrics?.kpis.avgOrderValue?.toFixed(2) || '0.00'}[m[41m[m
[32m+[m[32m                      </p>[m[41m[m
[32m+[m[32m                    </div>[m[41m[m
                   </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={goToUsers} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-green-100 rounded-lg">[m
[31m-                    <UserCheck className="h-6 w-6 text-green-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Active Users</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">[m
[31m-                      {users.filter(u => u.isActive).length}[m
[31m-                    </p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={goToRoles} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-purple-100 rounded-lg">[m
[31m-                    <Shield className="h-6 w-6 text-purple-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Roles</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">{roles.length}</p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={goToProducts} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-orange-100 rounded-lg">[m
[31m-                    <Package className="h-6 w-6 text-orange-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Total Products</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">{products.length}</p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-            </div>[m
 [m
[31m-            {/* Order Statistics */}[m
[31m-            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">[m
[31m-              <div onClick={() => goToOrders()} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-blue-100 rounded-lg">[m
[31m-                    <ShoppingCart className="h-6 w-6 text-blue-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Total Orders</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">{orders.length}</p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={() => goToOrders('pending')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-yellow-100 rounded-lg">[m
[31m-                    <Clock className="h-6 w-6 text-yellow-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Pending</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">[m
[31m-                      {orders.filter(o => o.status === 'pending').length}[m
[31m-                    </p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={() => goToOrders('processing')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-blue-100 rounded-lg">[m
[31m-                    <Truck className="h-6 w-6 text-blue-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Processing</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">[m
[31m-                      {orders.filter(o => o.status === 'processing').length}[m
[31m-                    </p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={() => goToOrders('delivered')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-green-100 rounded-lg">[m
[31m-                    <CheckCircle className="h-6 w-6 text-green-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Delivered</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">[m
[31m-                      {orders.filter(o => o.status === 'delivered').length}[m
[31m-                    </p>[m
[31m-                  </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-              <div onClick={() => goToOrders('cancelled')} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-                <div className="flex items-center">[m
[31m-                  <div className="p-2 bg-red-100 rounded-lg">[m
[31m-                    <XCircle className="h-6 w-6 text-red-600" />[m
[31m-                  </div>[m
[31m-                  <div className="ml-4">[m
[31m-                    <p className="text-sm font-medium text-gray-600">Cancelled</p>[m
[31m-                    <p className="text-2xl font-bold text-gray-900">[m
[31m-                      {orders.filter(o => o.status === 'cancelled').length}[m
[31m-                    </p>[m
[32m+[m[32m                  {/* Inline SVG Revenue Chart */}[m[41m[m
[32m+[m[32m                  <div className="bg-white p-6 rounded-lg shadow-sm border">[m[41m[m
[32m+[m[32m                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue (last {metricsDays} days)</h3>[m[41m[m
[32m+[m[32m                    {metricsLoading ? ([m[41m[m
[32m+[m[32m                      <p className="text-gray-500">Loading metrics...</p>[m[41m[m
[32m+[m[32m                    ) : chartPoints.length ? ([m[41m[m
[32m+[m[32m                      <div className="overflow-x-auto">[m[41m[m
[32m+[m[32m                        <svg width={640} height={180} className="min-w-[640px]">[m[41m[m
[32m+[m[32m                          {/* Axes */}[m[41m[m
[32m+[m[32m                          <line x1="20" y1="160" x2="620" y2="160" stroke="#e5e7eb" />[m[41m[m
[32m+[m[32m                          <line x1="20" y1="20" x2="20" y2="160" stroke="#e5e7eb" />[m[41m[m
[32m+[m[32m                          {/* Path */}[m[41m[m
[32m+[m[32m                          <polyline[m[41m[m
[32m+[m[32m                            fill="none"[m[41m[m
[32m+[m[32m                            stroke="#3b82f6"[m[41m[m
[32m+[m[32m                            strokeWidth="2"[m[41m[m
[32m+[m[32m                            points={chartPoints.map(p => `${p.x},${p.y}`).join(' ')}[m[41m[m
[32m+[m[32m                          />[m[41m[m
[32m+[m[32m                          {/* Points */}[m[41m[m
[32m+[m[32m                          {chartPoints.map((p, i) => ([m[41m[m
[32m+[m[32m                            <circle key={i} cx={p.x} cy={p.y} r={3} fill="#2563eb" />[m[41m[m
[32m+[m[32m                          ))}[m[41m[m
[32m+[m[32m                        </svg>[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                    ) : ([m[41m[m
[32m+[m[32m                      <p className="text-gray-500">No data</p>[m[41m[m
[32m+[m[32m                    )}[m[41m[m
                   </div>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-            </div>[m
[31m-[m
[31m-            {/* Revenue Summary */}[m
[31m-            <div onClick={() => goToOrders()} className="bg-white p-6 rounded-lg shadow-sm border cursor-pointer hover:border-blue-300 hover:shadow transition-colors">[m
[31m-              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h3>[m
[31m-              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">[m
[31m-                <div className="text-center">[m
[31m-                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>[m
[31m-                  <p className="text-3xl font-bold text-green-600">[m
[31m-                    ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}[m
[31m-                  </p>[m
[31m-                </div>[m
[31m-                <div className="text-center">[m
[31m-                  <p className="text-sm font-medium text-gray-600">Average Order Value</p>[m
[31m-                  <p className="text-3xl font-bold text-blue-600">[m
[31m-                    ${orders.length > 0 ? (orders.reduce((sum, order) => sum + order.total, 0) / orders.length).toFixed(2) : '0.00'}[m
[31m-                  </p>[m
[31m-                </div>[m
[31m-                <div className="text-center">[m
[31m-                  <p className="text-sm font-medium text-gray-600">Orders This Month</p>[m
[31m-                  <p className="text-3xl font-bold text-purple-600">[m
[31m-                    {orders.filter(order => {[m
[31m-                      const orderDate = new Date(order.createdAt);[m
[31m-                      const now = new Date();[m
[31m-                      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();[m
[31m-                    }).length}[m
[31m-                  </p>[m
[31m-                </div>[m
[31m-              </div>[m
[31m-            </div>[m
[31m-          </div>[m
[31m-        )}[m
 [m
[31m-        {/* Performance Tab */}[m
[31m-        {(activeTab as any) === 'performance' && ([m
[31m-          <div className="space-y-8">[m
[31m-            {/* Image Optimization */}[m
[31m-            <div className="bg-white rounded-lg shadow-sm border border-blue-100">[m
[31m-              <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-50/40 to-indigo-50/30">[m
[31m-                <h2 className="text-xl font-semibold text-blue-900">Image Optimization</h2>[m
[31m-                <p className="text-blue-700/80 mt-1 text-sm">Using Next/Image with optional CDN loader.</p>[m
[31m-              </div>[m
[31m-              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">[m
[31m-                <div className="space-y-2">[m
[31m-                  <div className="flex items-center justify-between p-3 border border-blue-100 rounded-lg bg-blue-50/20">[m
[31m-                    <span className="text-blue-900">CDN Origin</span>[m
[31m-                    <code className="text-blue-800">{process.env.NEXT_PUBLIC_IMAGE_CDN || 'Not set'}</code>[m
[32m+[m[32m                  {/* Top Products */}[m[41m[m
[32m+[m[32m                  <div className="bg-white p-6 rounded-lg shadow-sm border">[m[41m[m
[32m+[m[32m                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products (by revenue)</h3>[m[41m[m
[32m+[m[32m                    {metrics?.topProducts?.length ? ([m[41m[m
[32m+[m[32m                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">[m[41m[m
[32m+[m[32m                        {metrics.topProducts.map((p) => ([m[41m[m
[32m+[m[32m                          <div key={p.productId} className="flex items-center gap-4 border rounded-lg p-3">[m[41m[m
[32m+[m[32m                            <img src={p.image || '/vercel.svg'} alt={p.name || 'Product'} className="w-14 h-14 rounded object-cover border" />[m[41m[m
[32m+[m[32m                            <div className="flex-1">[m[41m[m
[32m+[m[32m                              <div className="font-medium text-gray-900 truncate">{p.name || p.productId}</div>[m[41m[m
[32m+[m[32m                              <div className="text-sm text-gray-600">${p.revenue.toFixed(2)} · {p.units} units</div>[m[41m[m
[32m+[m[32m                            </div>[m[41m[m
[32m+[m[32m                          </div>[m[41m[m
[32m+[m[32m                        ))}[m[41m[m
[32m+[m[32m                      </div>[m[41m[m
[32m+[m[32m                    ) : ([m[41m[m
[32m+[m[32m                      <p className="text-gray-500">No top products yet.</p>[m[41m[m
[32m+[m[32m                    )}[m[41m[m
                   </div>[m
[31m-                  <p className="text-gray-700">Set <code className="px-1 py-0.5 bg-blue-50 border border-blue-100 rounded">NEXT_PUBLIC_IMAGE_CDN</code> to proxy images via your CDN.</p>[m
[31m-                </div>[m
[31m-                <div className="space-y-2">[m
[31m-                  <a className="inline-block px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100" href="/categories/men" target="_blank">Open Category (optimized hero)</a>[m
[31m-                  <a className="ml-3 inline-block px-4 py-2 border border-blue-200 b