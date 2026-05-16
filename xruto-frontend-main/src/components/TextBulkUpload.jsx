import React, { useState } from 'react';
import { FileText, AlertCircle, CheckCircle, X, Loader, Plus, ChevronDown } from 'lucide-react';

const TextBulkUpload = ({ onOrdersUploaded }) => {
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewOrders, setPreviewOrders] = useState([]);

  const sampleText = `Order 1:
Customer: John Smith
Email: john.smith0@email.com
Phone: 01925100000
Address: 13 Ash Grove, Latchford, Warrington WA4 1EF, UK
Postcode: WA4 1EF
City: Latchford
Latitude: 53.3807489
Longitude: -2.5751915
Value: £45.99
Weight: 2.5kg

Order 2:
Customer: Sarah Wilson
Email: sarah.wilson1@email.com
Phone: 01925100001
Address: 13 Myrtle Grove, Latchford, Warrington WA4 1EE, UK
Postcode: WA4 1EE
City: Latchford
Latitude: 53.3811877
Longitude: -2.5748538
Value: £67.80
Weight: 3.2kg

Order 3:
Customer: Mike Johnson
Email: mike.johnson2@email.com
Phone: 01925100002
Address: 32 Park Ave, Warrington WA4 1DZ, UK
Postcode: WA4 1DZ
City: Warrington
Latitude: 53.3806511
Longitude: -2.5763532
Value: £52.30
Weight: 2.8kg`;

  const parseTextOrders = (text) => {
    const orders = [];
    const orderBlocks = text.split(/Order\s+\d+:/i).filter((block) => block.trim().length > 0);

    orderBlocks.forEach((block) => {
      const lines = block
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const order = {
        delivery_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      };

      lines.forEach((line) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;

        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();

        switch (key) {
          case 'customer':
            order.customer_name = value;
            break;
          case 'email':
            order.customer_email = value;
            break;
          case 'phone':
            order.customer_phone = value;
            break;
          case 'address':
            order.delivery_address = value;
            break;
          case 'postcode':
            order.postcode = value;
            break;
          case 'city':
            order.city = value;
            break;
          case 'latitude':
            order.latitude = parseFloat(value) || null;
            break;
          case 'longitude':
            order.longitude = parseFloat(value) || null;
            break;
          case 'value': {
            const cleanValue = value.replace(/[£$,]/g, '');
            order.order_value = parseFloat(cleanValue) || 0;
            break;
          }
          case 'weight': {
            const cleanWeight = value.replace(/[a-zA-Z]/g, '');
            order.weight = parseFloat(cleanWeight) || 0;
            break;
          }
          default:
            break;
        }
      });

      if (order.customer_name && order.delivery_address) {
        orders.push(order);
      }
    });

    return orders;
  };

  const handlePreview = () => {
    if (!textInput.trim()) {
      setError('Please enter order text');
      return;
    }

    try {
      const parsed = parseTextOrders(textInput);

      if (parsed.length === 0) {
        setError('No valid orders found. Please check the format.');
        return;
      }

      setPreviewOrders(parsed);
      setError(null);
    } catch (e) {
      console.error('Parse error:', e);
      setError('Failed to parse orders. Please check the format.');
    }
  };

  const handleSubmit = async () => {
    if (previewOrders.length === 0) {
      setError('Please preview orders first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setUploadResult(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('xruto_token');
      const response = await fetch(`${API_BASE_URL}/orders/upload-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orders: previewOrders }),
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult({
          success: true,
          message: data.message,
          extractedCount: previewOrders.length,
          insertedCount: data.insertedCount || previewOrders.length,
          orders: data.orders || previewOrders,
        });

        if (onOrdersUploaded && data.orders) {
          onOrdersUploaded(data.orders);
        }

        setTextInput('');
        setPreviewOrders([]);
      } else {
        setError(data.message || 'Failed to upload orders');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload orders. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setUploadResult(null);
    setError(null);
    setPreviewOrders([]);
  };

  const insertSample = () => {
    setTextInput(sampleText);
    setError(null);
    setUploadResult(null);
    setPreviewOrders([]);
  };

  const [focusOnce, setFocusOnce] = useState(false);
  const inputBarCls =
    'w-full min-h-[220px] max-h-[min(60vh,680px)] rounded-2xl border border-xr-line bg-xr-surface px-4 py-3 font-mono text-[13px] leading-relaxed text-xr-text placeholder-gray-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-0 focus:border-[#F59E0B]/40 resize-y';

  return (
    <div className="glass-card min-w-0 overflow-hidden rounded-2xl">
      <div className="border-b border-xr-line px-4 py-3 sm:px-5 sm:py-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#F59E0B]/80">Text import</p>
        <h3 className="text-sm font-semibold text-xr-text sm:text-base">Bulk text upload</h3>
        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
          Paste from Word, Excel, or any plain text. Faster than reformatting PDFs.
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs font-medium text-xr-muted" htmlFor="order-text-bulk">
            Order text
          </label>
          <button
            type="button"
            onClick={insertSample}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#1a2a45] bg-xr-surface px-2.5 py-1.5 text-xs font-medium text-orange-400/90 transition hover:border-orange-500/30 hover:bg-orange-500/10"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Insert sample
          </button>
        </div>

        <textarea
          id="order-text-bulk"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onFocus={() => { setFocusOnce(true); setTimeout(() => setFocusOnce(false), 900); }}
          placeholder="Paste orders here. Each block should start with Order 1: … and use lines like Customer: … Address: …"
          className={`${inputBarCls} ${focusOnce ? 'animate-glow-once' : ''}`}
          disabled={isProcessing}
        />

        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center justify-end">
            <span className="text-[11px] text-gray-500 tabular-nums sm:text-xs">{textInput.length} characters</span>
          </div>
          <button
            type="button"
            onClick={handlePreview}
            disabled={isProcessing || !textInput.trim()}
            className="h-12 w-full rounded-xl bg-[#F59E0B] px-4 text-sm font-bold text-black shadow-panel transition duration-150 hover:scale-[1.01] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Preview orders
          </button>
        </div>
      </div>

      {previewOrders.length > 0 && (
        <div className="mx-4 mb-4 space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 sm:mx-5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-xr-info">Preview: {previewOrders.length} order{previewOrders.length !== 1 ? 's' : ''}</h4>
            <span className="shrink-0 rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-xr-info">Ready to upload</span>
          </div>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-xr-line bg-xr-surface p-2 text-xs text-xr-secondary scrollbar-thin">
            {previewOrders.slice(0, 8).map((order, index) => (
              <div key={index} className="border-b border-xr-line py-1.5 last:border-0 last:pb-0">
                <span className="font-medium text-xr-text">{order.customer_name}</span>
                <span className="text-gray-500"> — </span>
                <span className="text-xr-muted line-clamp-1">{order.delivery_address}</span>
                {order.postcode && <span className="ml-1 text-gray-500">({order.postcode})</span>}
                {order.order_value != null && (
                  <span className="ml-1 text-orange-400/90">· £{order.order_value}</span>
                )}
              </div>
            ))}
            {previewOrders.length > 8 && (
              <p className="pt-1 text-[11px] text-gray-500">…and {previewOrders.length - 8} more</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition enabled:hover:from-emerald-500 enabled:hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader className="h-4 w-4 shrink-0 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 shrink-0" />
                Upload {previewOrders.length} order{previewOrders.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-4 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 sm:mx-5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-xr-danger">Error</p>
            <p className="text-xs text-xr-danger">{error}</p>
          </div>
          <button type="button" onClick={clearResults} className="shrink-0 text-red-400/80 hover:text-xr-danger" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadResult?.success && (
        <div className="mx-4 mb-4 flex gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 sm:mx-5">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1 text-xs text-xr-success">
            <p className="font-medium text-xr-success">{uploadResult.message}</p>
            <p className="mt-1 text-xr-success">
              Processed {uploadResult.extractedCount} · Added {uploadResult.insertedCount}
            </p>
          </div>
          <button type="button" onClick={clearResults} className="shrink-0 text-emerald-400/80 hover:text-xr-success" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <details className="group border-t border-xr-line bg-xr-surface/50">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-xs font-medium text-xr-muted transition hover:text-xr-secondary sm:px-5">
          <span className="inline-flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            Format guide
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180" />
        </summary>
        <div className="space-y-2 px-4 pb-4 text-xs text-gray-500 sm:px-5">
          <p>Start each order with <code className="rounded bg-xr-elevated px-1 text-xr-secondary">Order 1:</code> (any number). Use <code className="rounded bg-xr-elevated px-1">Field: value</code> on separate lines.</p>
          <p>Required: <span className="text-xr-muted">Customer</span>, <span className="text-xr-muted">Address</span>. Optional: Email, Phone, Postcode, City, coordinates, value, weight.</p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-[#1a2a45] bg-xr-surface p-2.5 font-mono text-[11px] leading-relaxed text-xr-muted">
            {`Order 1:
Customer: John Smith
Address: 123 Main St, Warrington WA1 2AB
Value: £45.99
Weight: 2.5kg`}
          </pre>
        </div>
      </details>
    </div>
  );
};

export default TextBulkUpload;
