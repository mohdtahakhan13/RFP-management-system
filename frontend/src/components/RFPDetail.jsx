import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Icons
const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CompareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const PersonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BoxIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const tabs = ['Overview', 'Items', 'Vendors', 'Proposals', 'Timeline'];

const RFPDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [emailContent, setEmailContent] = useState({
    subject: '',
    body: '',
    vendorId: '',
  });

  useEffect(() => {
    fetchRFPDetails();
    fetchVendors();
  }, [id]);

  const fetchRFPDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/rfps/${id}`);
      setRfp(response.data.data);
      setSelectedVendors(response.data.data.vendors || []);
    } catch (error) {
      toast.error('Failed to fetch RFP details');
      console.error('Error fetching RFP:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get(`${API_URL}/vendors`);
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleSendRFP = async () => {
    if (selectedVendors.length === 0) {
      toast.error('Please select at least one vendor');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/rfps/${id}/send`, {
        vendorIds: selectedVendors,
      });

      toast.success(`RFP sent to ${response.data.message}`);
      setSendDialogOpen(false);
      fetchRFPDetails();
    } catch (error) {
      toast.error('Failed to send RFP');
      console.error('Error sending RFP:', error);
    }
  };

  const handleSimulateResponse = async () => {
    if (!emailContent.vendorId || !emailContent.subject || !emailContent.body) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const parseResponse = await axios.post(`${API_URL}/ai/parse-response`, {
        emailContent: {
          subject: emailContent.subject,
          body: emailContent.body,
        },
        rfpId: id,
      });

      const proposalData = {
        rfpId: id,
        vendorId: emailContent.vendorId,
        emailContent: {
          subject: emailContent.subject,
          body: emailContent.body,
          receivedAt: new Date(),
        },
        structuredData: parseResponse.data.data.proposalData,
        aiAnalysis: parseResponse.data.data.analysis,
        status: 'under-review',
      };

      const proposalRes = await axios.post(`${API_URL}/proposals`, proposalData);

      await axios.put(`${API_URL}/rfps/${id}`, {
        $push: { proposals: proposalRes.data.data._id }
      });

      toast.success('Vendor response received and parsed with AI!');
      setResponseDialogOpen(false);
      setEmailContent({ subject: '', body: '', vendorId: '' });
      fetchRFPDetails();
    } catch (error) {
      toast.error('Failed to process vendor response');
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'chip-warning';
      case 'sent': return 'chip-info';
      case 'in-progress': return 'chip-info';
      case 'completed': return 'chip-success';
      default: return 'chip-default';
    }
  };

  const calculateProgress = () => {
    if (!rfp) return 0;
    let progress = 0;
    if (rfp.status !== 'draft') progress += 25;
    if (rfp.sentVendors && rfp.sentVendors.length > 0) progress += 25;
    if (rfp.proposals && rfp.proposals.length > 0) progress += 25;
    if (rfp.status === 'completed') progress += 25;
    return progress;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!rfp) {
    return (
      <div className="card p-12 text-center">
        <p className="text-zinc-500">RFP not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <BackIcon />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{rfp.title}</h2>
            <p className="text-sm text-zinc-500">Created {format(parseISO(rfp.createdAt), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`chip ${getStatusColor(rfp.status)}`}>{rfp.status}</span>
          {rfp.proposals && rfp.proposals.length > 0 && (
            <button
              onClick={() => navigate(`/rfp/${id}/compare`)}
              className="btn-primary"
            >
              <CompareIcon />
              Compare Proposals
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-600">Progress</span>
          <span className="font-medium text-zinc-900">{calculateProgress()}%</span>
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {['Created', 'Sent to Vendors', 'Responses Received', 'Completed'].map((label, idx) => (
            <div key={label} className="text-center">
              <p className="text-xs text-zinc-500 mb-1">{label}</p>
              <CheckIcon className={`w-5 h-5 mx-auto ${(idx === 0 && rfp.status !== 'draft') ||
                  (idx === 1 && rfp.sentVendors?.length > 0) ||
                  (idx === 2 && rfp.proposals?.length > 0) ||
                  (idx === 3 && rfp.status === 'completed')
                  ? 'text-teal-500'
                  : 'text-zinc-300'
                }`} />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-zinc-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setTabValue(idx)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tabValue === idx
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {tabValue === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-3">Description</h3>
                  <p className="text-zinc-600">{rfp.description}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-3">Key Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-zinc-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                        <MoneyIcon />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Total Budget</p>
                        <p className="font-semibold text-zinc-900">
                          {rfp.structuredData?.currency || 'USD'} {rfp.structuredData?.totalBudget?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="border border-zinc-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                        <CalendarIcon />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Delivery Required</p>
                        <p className="font-semibold text-zinc-900">{rfp.structuredData?.deliveryDays || 'N/A'} days</p>
                      </div>
                    </div>
                    <div className="border border-zinc-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                        <ReceiptIcon />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Payment Terms</p>
                        <p className="font-semibold text-zinc-900">{rfp.structuredData?.paymentTerms || 'Net 30'}</p>
                      </div>
                    </div>
                    <div className="border border-zinc-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                        <ShieldIcon />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Warranty</p>
                        <p className="font-semibold text-zinc-900">{rfp.structuredData?.warranty || '1 year'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="card p-4 border border-zinc-200">
                  <h3 className="font-semibold text-zinc-900 mb-4">Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSendDialogOpen(true)}
                      disabled={rfp.status === 'completed'}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      <SendIcon />
                      Send to Vendors
                    </button>
                    <button
                      onClick={() => setResponseDialogOpen(true)}
                      disabled={rfp.status === 'draft'}
                      className="btn-secondary w-full disabled:opacity-50"
                    >
                      <UploadIcon />
                      Simulate Response
                    </button>
                  </div>
                </div>

                <div className="card p-4 border border-zinc-200">
                  <h3 className="font-semibold text-zinc-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PersonIcon className="text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-900">Vendors Selected</p>
                        <p className="text-xs text-zinc-500">{rfp.vendors?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <EmailIcon className="text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-900">Vendors Contacted</p>
                        <p className="text-xs text-zinc-500">{rfp.sentVendors?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-900">Proposals Received</p>
                        <p className="text-xs text-zinc-500">{rfp.proposals?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BoxIcon className="text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-900">Total Items</p>
                        <p className="text-xs text-zinc-500">{rfp.structuredData?.items?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Items Tab */}
          {tabValue === 1 && rfp.structuredData?.items && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rfp.structuredData.items.map((item, index) => (
                <motion.div key={index} whileHover={{ y: -4 }} className="border border-zinc-200 rounded-lg p-4">
                  <h4 className="font-semibold text-zinc-900 mb-2">{item.name}</h4>
                  <p className="text-sm text-zinc-500 mb-1">Quantity: {item.quantity}</p>
                  <p className="text-sm text-zinc-600 mb-3">{item.specifications}</p>
                  {item.totalPrice && (
                    <p className="text-lg font-bold text-violet-600">${item.totalPrice.toLocaleString()}</p>
                  )}
                  {item.unitPrice && (
                    <p className="text-xs text-zinc-500">${item.unitPrice} per unit</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Vendors Tab */}
          {tabValue === 2 && (
            <div>
              {rfp.sentVendors && rfp.sentVendors.length > 0 ? (
                <div className="space-y-3">
                  {rfp.sentVendors.map((sentVendor, index) => {
                    const vendor = vendors.find(v => v._id === sentVendor.vendorId);
                    if (!vendor) return null;
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-semibold">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">{vendor.name}</p>
                            <p className="text-sm text-zinc-500">{vendor.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`chip ${sentVendor.sentStatus === 'sent' ? 'chip-success' : 'chip-error'}`}>
                            {sentVendor.sentStatus}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {sentVendor.sentAt ? format(parseISO(sentVendor.sentAt), 'MMM dd, HH:mm') : 'Not sent'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <EmailIcon className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500">No vendors selected yet</p>
                  <p className="text-sm text-zinc-400">Click "Send to Vendors" to select vendors</p>
                </div>
              )}
            </div>
          )}

          {/* Proposals Tab */}
          {tabValue === 3 && (
            <div>
              {rfp.proposals && rfp.proposals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rfp.proposals.map((proposal, index) => (
                    <div key={index} className="border border-zinc-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-semibold">
                            {proposal.vendorId?.name?.charAt(0) || 'V'}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">{proposal.vendorId?.name || 'Unknown Vendor'}</p>
                            <p className="text-xs text-zinc-500">Received {format(parseISO(proposal.createdAt), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <span className={`chip ${proposal.status === 'accepted' ? 'chip-success' : 'chip-default'}`}>
                          {proposal.status}
                        </span>
                      </div>

                      {proposal.aiAnalysis && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-zinc-500">AI Score</span>
                            <span className={`font-bold ${proposal.aiAnalysis.totalScore >= 70 ? 'text-teal-600' : 'text-amber-600'}`}>
                              {proposal.aiAnalysis.totalScore}/100
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${proposal.aiAnalysis.totalScore >= 70 ? 'bg-teal-500' :
                                  proposal.aiAnalysis.totalScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                              style={{ width: `${proposal.aiAnalysis.totalScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-zinc-500">Total Price</p>
                          <p className="font-medium text-zinc-900">
                            {proposal.structuredData?.currency || 'USD'} {proposal.structuredData?.totalPrice?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-500">Delivery</p>
                          <p className="font-medium text-zinc-900">{proposal.structuredData?.deliveryDays || 'N/A'} days</p>
                        </div>
                      </div>

                      {proposal.aiAnalysis?.summary && (
                        <p className="mt-3 text-sm text-zinc-500 italic">"{proposal.aiAnalysis.summary}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <DocumentIcon className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-500">No proposals received yet</p>
                  <p className="text-sm text-zinc-400">Use "Simulate Vendor Response" to test AI parsing</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {tabValue === 4 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500">Timeline coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Send RFP Dialog */}
      <AnimatePresence>
        {sendDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setSendDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                  <h3 className="text-lg font-semibold text-zinc-900">Send RFP to Vendors</h3>
                  <button onClick={() => setSendDialogOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                    <CloseIcon />
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-zinc-600 mb-4">Select vendors to send this RFP to:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {vendors.map((vendor) => (
                      <label
                        key={vendor._id}
                        className="flex items-center gap-3 p-3 border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedVendors([...selectedVendors, vendor._id]);
                            } else {
                              setSelectedVendors(selectedVendors.filter(id => id !== vendor._id));
                            }
                          }}
                          className="w-4 h-4 text-violet-600 rounded border-zinc-300 focus:ring-violet-500"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {vendor.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{vendor.name}</p>
                            <p className="text-xs text-zinc-500">{vendor.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-4">
                    Selected vendors will receive an email with the RFP details.
                  </p>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
                  <button onClick={() => setSendDialogOpen(false)} className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleSendRFP}
                    disabled={selectedVendors.length === 0}
                    className="btn-primary disabled:opacity-50"
                  >
                    Send 
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Simulate Response Dialog */}
      <AnimatePresence>
        {responseDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setResponseDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                  <h3 className="text-lg font-semibold text-zinc-900">Simulate Vendor Response</h3>
                  <button onClick={() => setResponseDialogOpen(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                    <CloseIcon />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-zinc-500">
                    This simulates a vendor responding to the RFP. The email content will be parsed by AI.
                  </p>
                  <div>
                    <label className="label">Select Vendor</label>
                    <select
                      value={emailContent.vendorId}
                      onChange={(e) => setEmailContent({ ...emailContent, vendorId: e.target.value })}
                      className="input"
                    >
                      <option value="">Select a vendor...</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name} ({vendor.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Email Subject</label>
                    <input
                      type="text"
                      value={emailContent.subject}
                      onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                      className="input"
                      placeholder="e.g., Proposal for Laptop Procurement"
                    />
                  </div>
                  <div>
                    <label className="label">Email Body</label>
                    <textarea
                      value={emailContent.body}
                      onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                      className="textarea h-40"
                      placeholder="Enter the vendor's email response..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
                  <button onClick={() => setResponseDialogOpen(false)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSimulateResponse} className="btn-primary">
                    Parse with AI
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RFPDetail;