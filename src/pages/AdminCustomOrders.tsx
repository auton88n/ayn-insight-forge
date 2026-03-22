import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, Send, FileText, Trash2, Eye, Edit2,
  DollarSign, Building2, Clock, CheckCircle, XCircle, Loader2,
  Download, PenTool, Search
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

interface ServiceItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface CustomOrder {
  id: string;
  company_name: string;
  company_email: string;
  contact_person: string;
  company_phone: string | null;
  company_address: string | null;
  order_title: string;
  order_description: string | null;
  services: ServiceItem[];
  subtotal: number;
  discount_percent: number;
  tax_percent: number;
  total_amount: number;
  currency: string;
  terms_and_conditions: string | null;
  privacy_notes: string | null;
  after_sale_services: string | null;
  delivery_timeline: string | null;
  admin_signature_url: string | null;
  client_signature_url: string | null;
  admin_signed_at: string | null;
  client_signed_at: string | null;
  stripe_payment_link: string | null;
  stripe_payment_id: string | null;
  contract_pdf_url: string | null;
  status: string;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const DEFAULT_TERMS = `1. Payment is due upon receipt of this agreement.
2. Services will commence within 5 business days of payment confirmation.
3. This agreement is valid for 30 days from the date of issue.
4. Any modifications to the scope of work must be agreed upon in writing.
5. AYN reserves the right to assign qualified team members to the project.
6. Client agrees to provide necessary access, information, and feedback in a timely manner.
7. Confidential information shared during the project will be protected per our Privacy Policy.
8. Either party may terminate this agreement with 15 days written notice.`;

const DEFAULT_PRIVACY = `Your data is protected under our Privacy Policy. All information shared during the course of this agreement will be treated as confidential and will not be disclosed to third parties without your explicit consent. Data will be processed in accordance with applicable data protection regulations.`;

const DEFAULT_AFTER_SALE = `• 30-day post-delivery support included
• Bug fixes and minor adjustments at no additional cost for 30 days
• Priority support channel via email
• Documentation and training materials provided
• Extended support packages available upon request`;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground', icon: Edit2 },
  sent: { label: 'Sent', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', icon: Eye },
  signed: { label: 'Signed', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400', icon: PenTool },
  paid: { label: 'Paid', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/15 text-destructive', icon: XCircle },
};

export default function AdminCustomOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showSignPad, setShowSignPad] = useState(false);
  const [signingOrderId, setSigningOrderId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Form state
  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    contact_person: '',
    company_phone: '',
    company_address: '',
    order_title: '',
    order_description: '',
    services: [{ name: '', description: '', price: 0, quantity: 1 }] as ServiceItem[],
    discount_percent: 0,
    tax_percent: 15,
    currency: 'SAR',
    terms_and_conditions: DEFAULT_TERMS,
    privacy_notes: DEFAULT_PRIVACY,
    after_sale_services: DEFAULT_AFTER_SALE,
    delivery_timeline: '',
    stripe_payment_link: '',
    notes: '',
  });

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders((data || []) as unknown as CustomOrder[]);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const calculateTotals = (services: ServiceItem[], discount: number, tax: number) => {
    const subtotal = services.reduce((sum, s) => sum + (s.price * (s.quantity || 1)), 0);
    const discountAmount = subtotal * (discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (tax / 100);
    const total = afterDiscount + taxAmount;
    return { subtotal, total: Math.round(total * 100) / 100 };
  };

  const handleSave = async () => {
    if (!form.company_name || !form.company_email || !form.contact_person || !form.order_title) {
      toast({ title: 'Missing Fields', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    if (form.services.length === 0 || !form.services[0].name) {
      toast({ title: 'Missing Services', description: 'Add at least one service', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { subtotal, total } = calculateTotals(form.services, form.discount_percent, form.tax_percent);
      const { data: { user } } = await supabase.auth.getUser();

      const orderData = {
        company_name: form.company_name,
        company_email: form.company_email,
        contact_person: form.contact_person,
        company_phone: form.company_phone || null,
        company_address: form.company_address || null,
        order_title: form.order_title,
        order_description: form.order_description || null,
        services: form.services as unknown as any,
        subtotal,
        discount_percent: form.discount_percent,
        tax_percent: form.tax_percent,
        total_amount: total,
        currency: form.currency,
        terms_and_conditions: form.terms_and_conditions || null,
        privacy_notes: form.privacy_notes || null,
        after_sale_services: form.after_sale_services || null,
        delivery_timeline: form.delivery_timeline || null,
        stripe_payment_link: form.stripe_payment_link || null,
        notes: form.notes || null,
        created_by: user?.id || null,
      };

      if (editingOrder) {
        const { error } = await supabase
          .from('custom_orders')
          .update(orderData)
          .eq('id', editingOrder.id);
        if (error) throw error;
        toast({ title: 'Order Updated' });
      } else {
        const { error } = await supabase
          .from('custom_orders')
          .insert(orderData);
        if (error) throw error;
        toast({ title: 'Order Created' });
      }

      setShowForm(false);
      setEditingOrder(null);
      resetForm();
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({
      company_name: '', company_email: '', contact_person: '',
      company_phone: '', company_address: '', order_title: '',
      order_description: '', services: [{ name: '', description: '', price: 0, quantity: 1 }],
      discount_percent: 0, tax_percent: 15, currency: 'SAR',
      terms_and_conditions: DEFAULT_TERMS, privacy_notes: DEFAULT_PRIVACY,
      after_sale_services: DEFAULT_AFTER_SALE, delivery_timeline: '',
      stripe_payment_link: '', notes: '',
    });
  };

  const handleEdit = (order: CustomOrder) => {
    setEditingOrder(order);
    setForm({
      company_name: order.company_name,
      company_email: order.company_email,
      contact_person: order.contact_person,
      company_phone: order.company_phone || '',
      company_address: order.company_address || '',
      order_title: order.order_title,
      order_description: order.order_description || '',
      services: order.services?.length ? order.services : [{ name: '', description: '', price: 0, quantity: 1 }],
      discount_percent: Number(order.discount_percent) || 0,
      tax_percent: Number(order.tax_percent) || 15,
      currency: order.currency || 'SAR',
      terms_and_conditions: order.terms_and_conditions || DEFAULT_TERMS,
      privacy_notes: order.privacy_notes || DEFAULT_PRIVACY,
      after_sale_services: order.after_sale_services || DEFAULT_AFTER_SALE,
      delivery_timeline: order.delivery_timeline || '',
      stripe_payment_link: order.stripe_payment_link || '',
      notes: order.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try {
      const { error } = await supabase.from('custom_orders').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Order Deleted' });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleGeneratePdf = async (orderId: string) => {
    setGeneratingPdf(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-contract-pdf', {
        body: { orderId }
      });
      if (error) throw error;
      if (!data?.html) throw new Error('No HTML returned');

      // Open HTML in new window for printing/PDF
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(data.html);
        w.document.close();
        setTimeout(() => w.print(), 500);
      }
      toast({ title: 'Contract Generated', description: 'Print or save as PDF from the new window' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleSendEmail = async (orderId: string) => {
    setSendingEmail(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('send-contract-email', {
        body: { orderId }
      });
      if (error) throw error;
      toast({ title: 'Email Sent', description: 'Contract and payment link sent to client' });
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSendingEmail(null);
    }
  };

  // Signature pad
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => { isDrawingRef.current = false; };

  const handleAdminSign = async () => {
    if (!canvasRef.current || !signingOrderId) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    
    try {
      // Upload signature to storage
      const blob = await fetch(dataUrl).then(r => r.blob());
      const path = `signatures/admin_${signingOrderId}_${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage.from('generated-files').upload(path, blob, { contentType: 'image/png' });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('generated-files').getPublicUrl(path);

      await supabase.from('custom_orders').update({
        admin_signature_url: urlData.publicUrl,
        admin_signed_at: new Date().toISOString(),
      }).eq('id', signingOrderId);

      toast({ title: 'Signed', description: 'Admin signature applied' });
      setShowSignPad(false);
      setSigningOrderId(null);
      fetchOrders();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const addService = () => {
    setForm(f => ({ ...f, services: [...f.services, { name: '', description: '', price: 0, quantity: 1 }] }));
  };

  const removeService = (idx: number) => {
    setForm(f => ({ ...f, services: f.services.filter((_, i) => i !== idx) }));
  };

  const updateService = (idx: number, field: keyof ServiceItem, value: string | number) => {
    setForm(f => ({
      ...f,
      services: f.services.map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = !searchQuery ||
      o.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contact_person.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number, currency = 'SAR') => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency }).format(amount);
  };

  const { subtotal: previewSubtotal, total: previewTotal } = calculateTotals(form.services, form.discount_percent, form.tax_percent);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Custom Orders</h1>
              <p className="text-xs text-muted-foreground">Create contracts, attach payment links, send to clients</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setEditingOrder(null); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Order
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found</p>
            <Button onClick={() => { resetForm(); setEditingOrder(null); setShowForm(true); }} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Create First Order
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
              const StatusIcon = sc.icon;
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{order.order_title}</h3>
                        <Badge className={cn('text-[10px] gap-1', sc.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {order.company_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatCurrency(Number(order.total_amount), order.currency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>{order.contact_person}</span>
                        <span>•</span>
                        <span>{order.company_email}</span>
                        {order.admin_signed_at && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400">✓ Admin signed</span>
                          </>
                        )}
                        {order.email_sent_at && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400">✉ Emailed {new Date(order.email_sent_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(order)} title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { setSigningOrderId(order.id); setShowSignPad(true); setTimeout(initCanvas, 100); }}
                        title="Sign"
                        disabled={!!order.admin_signed_at}
                      >
                        <PenTool className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => handleGeneratePdf(order.id)}
                        disabled={generatingPdf === order.id}
                        title="Generate PDF"
                      >
                        {generatingPdf === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => handleSendEmail(order.id)}
                        disabled={sendingEmail === order.id}
                        title="Send to client"
                      >
                        {sendingEmail === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(order.id)} title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Order Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{editingOrder ? 'Edit Order' : 'New Custom Order'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-6 pt-4">
            <div className="space-y-6">
              {/* Company Info */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Company Name *" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                  <Input placeholder="Contact Person *" value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                  <Input placeholder="Company Email *" type="email" value={form.company_email} onChange={e => setForm(f => ({ ...f, company_email: e.target.value }))} />
                  <Input placeholder="Phone" value={form.company_phone} onChange={e => setForm(f => ({ ...f, company_phone: e.target.value }))} />
                  <Input placeholder="Address" className="col-span-2" value={form.company_address} onChange={e => setForm(f => ({ ...f, company_address: e.target.value }))} />
                </div>
              </div>

              <Separator />

              {/* Order Details */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Order Details</h3>
                <div className="space-y-3">
                  <Input placeholder="Order Title *" value={form.order_title} onChange={e => setForm(f => ({ ...f, order_title: e.target.value }))} />
                  <textarea
                    placeholder="Order Description"
                    value={form.order_description}
                    onChange={e => setForm(f => ({ ...f, order_description: e.target.value }))}
                    className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                  />
                </div>
              </div>

              <Separator />

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">Services & Pricing</h3>
                  <Button size="sm" variant="outline" onClick={addService} className="gap-1 text-xs">
                    <Plus className="w-3 h-3" /> Add Service
                  </Button>
                </div>
                <div className="space-y-3">
                  {form.services.map((s, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input placeholder="Service Name" value={s.name} onChange={e => updateService(i, 'name', e.target.value)} className="flex-1" />
                      <Input placeholder="Description" value={s.description} onChange={e => updateService(i, 'description', e.target.value)} className="flex-1" />
                      <Input type="number" placeholder="Price" value={s.price || ''} onChange={e => updateService(i, 'price', Number(e.target.value))} className="w-28" />
                      <Input type="number" placeholder="Qty" value={s.quantity || ''} onChange={e => updateService(i, 'quantity', Number(e.target.value))} className="w-20" />
                      {form.services.length > 1 && (
                        <Button size="icon" variant="ghost" onClick={() => removeService(i)} className="text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Discount %</label>
                    <Input type="number" value={form.discount_percent || ''} onChange={e => setForm(f => ({ ...f, discount_percent: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tax/VAT %</label>
                    <Input type="number" value={form.tax_percent || ''} onChange={e => setForm(f => ({ ...f, tax_percent: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                    <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-right space-y-1">
                  <div className="text-sm text-muted-foreground">Subtotal: {formatCurrency(previewSubtotal, form.currency)}</div>
                  {form.discount_percent > 0 && (
                    <div className="text-sm text-destructive">Discount: -{formatCurrency(previewSubtotal * form.discount_percent / 100, form.currency)}</div>
                  )}
                  <div className="text-lg font-bold text-foreground">Total: {formatCurrency(previewTotal, form.currency)}</div>
                </div>
              </div>

              <Separator />

              {/* Stripe Payment Link */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Payment Link (Stripe)</h3>
                <Input
                  placeholder="https://buy.stripe.com/..."
                  value={form.stripe_payment_link}
                  onChange={e => setForm(f => ({ ...f, stripe_payment_link: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Paste the Stripe payment link for this order</p>
              </div>

              <Separator />

              {/* Terms */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Terms & Conditions</h3>
                <textarea
                  value={form.terms_and_conditions}
                  onChange={e => setForm(f => ({ ...f, terms_and_conditions: e.target.value }))}
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y font-mono"
                />
              </div>

              {/* Privacy */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Privacy & Data Protection</h3>
                <textarea
                  value={form.privacy_notes}
                  onChange={e => setForm(f => ({ ...f, privacy_notes: e.target.value }))}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                />
              </div>

              {/* After Sale */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">After-Sale Services</h3>
                <textarea
                  value={form.after_sale_services}
                  onChange={e => setForm(f => ({ ...f, after_sale_services: e.target.value }))}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                />
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Delivery Timeline</h3>
                <textarea
                  value={form.delivery_timeline}
                  onChange={e => setForm(f => ({ ...f, delivery_timeline: e.target.value }))}
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                  placeholder="e.g., Phase 1: 2 weeks, Phase 2: 4 weeks..."
                />
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Internal Notes</h3>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                  placeholder="Internal notes (not shown to client)"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingOrder(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editingOrder ? 'Update Order' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Pad Dialog */}
      <Dialog open={showSignPad} onOpenChange={setShowSignPad}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Signature</DialogTitle>
          </DialogHeader>
          <div className="border border-border rounded-lg bg-white overflow-hidden" style={{ touchAction: 'none' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="w-full cursor-crosshair"
              style={{ height: 200 }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">Draw your signature above</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { initCanvas(); }}>Clear</Button>
            <Button onClick={handleAdminSign} className="gap-2">
              <PenTool className="w-4 h-4" /> Apply Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
