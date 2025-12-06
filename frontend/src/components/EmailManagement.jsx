import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

// Icons
const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const EmailIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const ProcessIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const EmailManagement = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [checkingInbox, setCheckingInbox] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [emails, setEmails] = useState([]);
    const [processingEmail, setProcessingEmail] = useState(null);
    const [rfps, setRfps] = useState([]);
    const [showSimulateModal, setShowSimulateModal] = useState(false);
    const [simulateForm, setSimulateForm] = useState({
        vendorEmail: '',
        vendorName: '',
        rfpId: '',
        body: ''
    });

    useEffect(() => {
        testConnection();
        getReceivedEmails();
        fetchRFPs();
    }, []);

    const fetchRFPs = async () => {
        try {
            const response = await axios.get(`${API_URL}/rfps`);
            setRfps(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const testConnection = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/emails/test`);
            setConnectionStatus(response.data.data);
            if (response.data.data.smtp.success && response.data.data.imap.success) {
                toast.success('Email connection successful!');
            } else if (response.data.data.smtp.success) {
                toast.success('SMTP connected! (IMAP may be slow)');
            } else {
                toast.error('Email connections failed');
            }
        } catch (error) {
            toast.error('Failed to test connection');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const checkInbox = async () => {
        setCheckingInbox(true);
        toast.loading('Checking inbox... This may take up to 60 seconds', { id: 'check-inbox' });
        try {
            const response = await axios.post(`${API_URL}/emails/check`, {}, { timeout: 90000 });
            setEmails(response.data.data || []);
            toast.success(`Found ${response.data.count || 0} RFP-related emails`, { id: 'check-inbox' });
        } catch (error) {
            toast.error('IMAP timed out. Use "Simulate Email" to test instead.', { id: 'check-inbox' });
            console.error(error);
        } finally {
            setCheckingInbox(false);
        }
    };

    const getReceivedEmails = async () => {
        try {
            const response = await axios.get(`${API_URL}/emails/received`);
            setEmails(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const processEmail = async (email) => {
        setProcessingEmail(email.messageId);
        try {
            await axios.post(`${API_URL}/emails/process/${encodeURIComponent(email.messageId)}`);
            toast.success('Proposal created from email!');
            // Refresh emails from database to show updated processed status
            await getReceivedEmails();
        } catch (error) {
            toast.error('Failed to process: ' + (error.response?.data?.error || error.message));
            console.error(error);
        } finally {
            setProcessingEmail(null);
        }
    };

    const handleSimulateEmail = async () => {
        if (!simulateForm.rfpId || !simulateForm.body) {
            toast.error('Please select an RFP and enter a proposal');
            return;
        }

        const selectedRfp = rfps.find(r => r._id === simulateForm.rfpId);

        try {
            const response = await axios.post(`${API_URL}/emails/simulate`, {
                vendorEmail: simulateForm.vendorEmail || 'vendor@example.com',
                vendorName: simulateForm.vendorName || 'Test Vendor',
                subject: `Re: RFP: ${selectedRfp?.title || 'Proposal'} [RFP-${simulateForm.rfpId}]`,
                body: simulateForm.body,
                rfpId: simulateForm.rfpId
            });

            toast.success('Email simulated! Now click "Process" to create the proposal.');
            setShowSimulateModal(false);
            setSimulateForm({ vendorEmail: '', vendorName: '', rfpId: '', body: '' });
            getReceivedEmails();
        } catch (error) {
            toast.error('Failed to simulate email');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <BackIcon />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">Email Management</h2>
                        <p className="text-zinc-500">Process vendor proposal emails</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowSimulateModal(true)}
                    className="btn-primary"
                >
                    <PlusIcon />
                    Simulate Email
                </button>
            </div>

            {/* Connection Status */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900">Connection Status</h3>
                    <button
                        onClick={testConnection}
                        disabled={loading}
                        className="btn-secondary"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent" />
                        ) : (
                            <RefreshIcon />
                        )}
                        Test
                    </button>
                </div>

                {connectionStatus && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${connectionStatus.smtp.success ? 'bg-teal-50 border-teal-200' : 'bg-rose-50 border-rose-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${connectionStatus.smtp.success ? 'bg-teal-500' : 'bg-rose-500'}`} />
                                <span className="font-medium text-zinc-900">SMTP (Sending)</span>
                            </div>
                            <p className="text-sm text-zinc-600">{connectionStatus.smtp.message}</p>
                        </div>
                        <div className={`p-4 rounded-lg border ${connectionStatus.imap.success ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${connectionStatus.imap.success ? 'bg-teal-500' : 'bg-amber-500'}`} />
                                <span className="font-medium text-zinc-900">IMAP (Receiving)</span>
                            </div>
                            <p className="text-sm text-zinc-600">{connectionStatus.imap.message}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Emails List */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-zinc-900">Received Emails</h3>
                        <p className="text-sm text-zinc-500">{emails.length} email(s) ready to process</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={getReceivedEmails} className="btn-secondary">
                            <RefreshIcon />
                            Refresh
                        </button>
                        <button
                            onClick={checkInbox}
                            disabled={checkingInbox}
                            className="btn-secondary"
                        >
                            {checkingInbox ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent" />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <EmailIcon />
                                    Check IMAP
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {emails.length > 0 ? (
                    <div className="space-y-3">
                        {emails.map((email, index) => (
                            <motion.div
                                key={email.messageId || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 border rounded-lg ${email.processed ? 'bg-zinc-50 border-zinc-200' : 'bg-white border-violet-200'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-zinc-900">{email.fromName}</span>
                                            <span className="text-sm text-zinc-500">&lt;{email.from}&gt;</span>
                                            {email.simulated && (
                                                <span className="chip chip-warning text-xs">Simulated</span>
                                            )}
                                            {email.processed && (
                                                <span className="chip chip-success text-xs">Processed</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-zinc-700 mb-1">{email.subject}</p>
                                        <p className="text-xs text-zinc-500">
                                            {email.date ? new Date(email.date).toLocaleString() : 'Just now'}
                                            {email.rfpId && <span className="ml-2 text-violet-600">• RFP: {email.rfpId}</span>}
                                        </p>
                                        {email.text && (
                                            <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{email.text.substring(0, 150)}...</p>
                                        )}
                                    </div>
                                    {!email.processed && (
                                        <button
                                            onClick={() => processEmail(email)}
                                            disabled={processingEmail === email.messageId}
                                            className="btn-primary ml-4"
                                        >
                                            {processingEmail === email.messageId ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            ) : (
                                                <ProcessIcon />
                                            )}
                                            Process
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 text-zinc-300 mx-auto mb-3">
                            <EmailIcon />
                        </div>
                        <p className="text-zinc-500">No emails to process</p>
                        <p className="text-sm text-zinc-400 mt-1">Click "Simulate Email" to test the workflow</p>
                    </div>
                )}
            </div>

            {/* Quick Test Guide */}
            <div className="card p-6 bg-violet-50 border-violet-200">
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">Quick Test Guide</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-700">
                    <li>Go to <strong>Dashboard</strong> → Click on an RFP → <strong>Send to Vendors</strong></li>
                    <li>Come back here → Click <strong>"Simulate Email"</strong> → Select the RFP → Enter a proposal</li>
                    <li>Click <strong>"Process"</strong> on the email to create a proposal with AI parsing</li>
                    <li>Go back to the RFP → Click <strong>"Compare Proposals"</strong> to see AI comparison</li>
                </ol>
            </div>

            {/* Simulate Email Modal */}
            <AnimatePresence>
                {showSimulateModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50"
                            onClick={() => setShowSimulateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                                    <h3 className="text-lg font-semibold text-zinc-900">Simulate Vendor Email</h3>
                                    <button onClick={() => setShowSimulateModal(false)} className="p-1 hover:bg-zinc-100 rounded-lg">
                                        <CloseIcon />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-zinc-500">
                                        Simulate receiving a vendor proposal email. This will be processed by AI.
                                    </p>

                                    <div>
                                        <label className="label">Select RFP *</label>
                                        <select
                                            value={simulateForm.rfpId}
                                            onChange={(e) => setSimulateForm({ ...simulateForm, rfpId: e.target.value })}
                                            className="input"
                                        >
                                            <option value="">Choose an RFP...</option>
                                            {rfps.map((rfp) => (
                                                <option key={rfp._id} value={rfp._id}>{rfp.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Vendor Name</label>
                                            <input
                                                type="text"
                                                value={simulateForm.vendorName}
                                                onChange={(e) => setSimulateForm({ ...simulateForm, vendorName: e.target.value })}
                                                className="input"
                                                placeholder="Test Vendor Corp"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Vendor Email</label>
                                            <input
                                                type="email"
                                                value={simulateForm.vendorEmail}
                                                onChange={(e) => setSimulateForm({ ...simulateForm, vendorEmail: e.target.value })}
                                                className="input"
                                                placeholder="vendor@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Proposal Content *</label>
                                        <textarea
                                            value={simulateForm.body}
                                            onChange={(e) => setSimulateForm({ ...simulateForm, body: e.target.value })}
                                            className="textarea h-40"
                                            placeholder={`Example proposal:

Total Price: $12,000
Delivery: 15 days
Payment Terms: Net 30
Warranty: 2 years

We offer 10 Dell laptops with 16GB RAM and 512GB SSD. 
Free shipping and installation included.`}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-200">
                                    <button onClick={() => setShowSimulateModal(false)} className="btn-secondary">Cancel</button>
                                    <button onClick={handleSimulateEmail} className="btn-primary">
                                        <EmailIcon />
                                        Simulate Email
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

export default EmailManagement;
