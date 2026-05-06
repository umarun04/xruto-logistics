import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader } from 'lucide-react';

const PDFUpload = ({ onOrdersUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      handleFileUpload(pdfFile);
    } else {
      setError('Please drop a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('xruto_token');
      const response = await fetch(`${API_BASE_URL}/orders/upload-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult({
          success: true,
          message: data.message,
          filename: data.filename,
          extractedCount: data.extractedCount,
          insertedCount: data.insertedCount,
          orders: data.orders
        });

        // Notify parent component about new orders
        if (onOrdersUploaded && data.orders) {
          onOrdersUploaded(data.orders);
        }
      } else {
        setError(data.message || 'Failed to upload PDF');
        if (data.extractedOrders) {
          setUploadResult({
            success: false,
            message: data.message,
            extractedOrders: data.extractedOrders
          });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const clearResults = () => {
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateTestOrders = async () => {
    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('xruto_token');
      const fullUrl = `${API_BASE_URL}/orders/test-pdf-parsing`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setUploadResult({
          success: true,
          message: data.message,
          filename: 'test-orders.json',
          extractedCount: data.orders?.length || 0,
          insertedCount: data.orders?.length || 0,
          orders: data.orders
        });

        if (onOrdersUploaded && data.orders) {
          onOrdersUploaded(data.orders);
        }
      } else {
        setError(data.message || 'Failed to generate test orders');
      }
    } catch (error) {
      console.error('Test orders error:', error);
      setError('Failed to generate test orders. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-[#1a2a45] bg-gradient-to-b from-[#111b2e] to-[#0c1320] shadow-lg shadow-black/30">
      <div className="border-b border-white/5 px-4 py-3 sm:px-5 sm:py-3.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">File import</p>
        <h3 className="text-sm font-semibold text-white sm:text-base">PDF upload</h3>
        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">Drop a PDF; we extract customers, addresses, and line items (text-based PDFs work best).</p>
      </div>

      <div className="p-4 sm:p-5">
        <div
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
            isDragging
              ? 'border-orange-500/60 bg-orange-500/10'
              : 'border-[#1a2a45] bg-[#0a0e1a] hover:border-orange-500/30'
          } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader className="mb-3 h-10 w-10 animate-spin text-blue-400" />
              <p className="text-sm font-medium text-white">Processing PDF…</p>
              <p className="text-xs text-gray-500">This may take a few moments</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="mb-3 h-10 w-10 text-gray-500" />
              <p className="mb-1 text-sm font-medium text-gray-200">Drop PDF here or click to browse</p>
              <p className="text-xs text-gray-500">Up to 10&nbsp;MB</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col items-stretch gap-1 sm:items-center">
          <button
            type="button"
            onClick={generateTestOrders}
            disabled={isUploading}
            className="rounded-xl border border-[#1a2a45] bg-[#0a0e1a] px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Generate test orders
          </button>
          <p className="text-center text-[11px] text-gray-600">No PDF needed — for trying the rest of the flow</p>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-4 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 sm:mx-5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-red-200">Upload error</p>
            <p className="text-xs text-red-300/90">{error}</p>
          </div>
          <button type="button" onClick={clearResults} className="shrink-0 text-red-400/80 hover:text-red-300" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadResult && uploadResult.success && (
        <div className="mx-4 mb-4 flex gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 sm:mx-5">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="min-w-0 flex-1 text-xs text-emerald-200/90">
            <p className="font-medium text-emerald-100">Upload successful</p>
            <p className="mt-0.5">{uploadResult.message}</p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
              {uploadResult.filename && (
                <span className="text-emerald-200/80">File: {uploadResult.filename}</span>
              )}
              <span>Found: {uploadResult.extractedCount} · Added: {uploadResult.insertedCount}</span>
            </div>
            {uploadResult.orders && uploadResult.orders.length > 0 && (
              <details className="mt-3 cursor-pointer">
                <summary className="text-xs font-medium text-emerald-200 hover:text-white">
                  View orders ({uploadResult.orders.length})
                </summary>
                <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-white/5 bg-[#0a0e1a] p-2 text-xs text-gray-300 scrollbar-thin">
                  {uploadResult.orders.slice(0, 10).map((order, index) => (
                    <div key={index} className="border-b border-white/5 py-1 text-xs last:border-0">
                      <span className="font-medium text-white">{order.customer_name}</span>
                      <span className="text-gray-500"> — {order.delivery_address} ({order.postcode})</span>
                    </div>
                  ))}
                  {uploadResult.orders.length > 10 && (
                    <p className="pt-1 text-[11px] text-gray-500">…and {uploadResult.orders.length - 10} more</p>
                  )}
                </div>
              </details>
            )}
          </div>
          <button type="button" onClick={clearResults} className="shrink-0 self-start text-emerald-400/80 hover:text-emerald-300" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadResult && !uploadResult.success && uploadResult.extractedOrders && (
        <div className="mx-4 mb-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:mx-5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1 text-xs text-amber-200/90">
            <p className="font-medium text-amber-100">Partial success</p>
            <p className="mt-0.5">Extracted from PDF but not saved: {uploadResult.message}</p>
            <p className="mt-1 text-amber-200/80">Extracted: {uploadResult.extractedOrders.length} orders</p>
            <details className="mt-2 cursor-pointer">
              <summary className="text-xs font-medium text-amber-200">View extracted</summary>
              <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-white/5 bg-[#0a0e1a] p-2 text-gray-300 scrollbar-thin">
                {uploadResult.extractedOrders.slice(0, 10).map((order, index) => (
                  <div key={index} className="border-b border-white/5 py-1 text-xs last:border-0">
                    <span className="font-medium text-white">{order.customer_name}</span>
                    <span className="text-gray-500"> — {order.delivery_address}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <button type="button" onClick={clearResults} className="shrink-0 self-start text-amber-400/80 hover:text-amber-300" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="border-t border-white/5 bg-[#0a0e1a]/50 px-4 py-3 sm:px-5">
        <div className="flex gap-2">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <ul className="list-inside list-disc space-y-0.5 text-[11px] text-gray-500 sm:text-xs">
            <li>Use text-based PDFs (not scanned images) for best results</li>
            <li>Include names, full addresses, postcodes, and values where possible</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFUpload;