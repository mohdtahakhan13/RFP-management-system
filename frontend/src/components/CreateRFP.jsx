import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ;

// Icons
const AiIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const Spinner = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const CreateRFP = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [structuredData, setStructuredData] = useState(null);
  const [copied, setCopied] = useState(false);

  const exampleRFP = `I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.`;

  const handleParseWithAI = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description first');
      return;
    }

    setParsing(true);
    try {
      const response = await axios.post(`${API_URL}/ai/parse-rfp`, {
        description,
      });

      setStructuredData(response.data.data);
      toast.success('Successfully parsed with AI!');
    } catch (error) {
      toast.error('Failed to parse with AI');
      console.error('Error parsing with AI:', error);
    } finally {
      setParsing(false);
    }
  };

  const handleCreateRFP = async () => {
    if (!description.trim() || !structuredData) {
      toast.error('Please parse the description first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/rfps`, {
        title: title || `RFP - ${new Date().toLocaleDateString()}`,
        description,
      });

      toast.success('RFP created successfully!');
      navigate(`/rfp/${response.data.data._id}`);
    } catch (error) {
      toast.error('Failed to create RFP');
      console.error('Error creating RFP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExample = () => {
    setDescription(exampleRFP);
    setTitle('Office Equipment Procurement');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Create New RFP with AI</h2>
        <p className="mt-1 text-zinc-500">Describe what you need in natural language, and AI will structure it automatically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Describe Your Needs</h3>

          <div className="space-y-4">
            <div>
              <label className="label">RFP Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="e.g., Office Equipment Procurement"
              />
            </div>

            <div>
              <label className="label">Describe what you need to procure...</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea h-48"
                placeholder="Example: I need to buy 10 laptops with 16GB RAM, budget $25,000, delivery in 30 days..."
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleUseExample}
                className="btn-secondary text-sm py-2"
              >
                Use Example
              </button>
              <button
                onClick={copyToClipboard}
                className="btn-ghost p-2"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>

            <button
              onClick={handleParseWithAI}
              disabled={parsing || !description.trim()}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {parsing ? <Spinner /> : <AiIcon />}
              {parsing ? 'Parsing with AI...' : 'Parse with AI'}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">AI-Parsed Results</h3>

          {structuredData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Items */}
              <div className="border border-zinc-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-zinc-900 mb-3">Extracted Items</h4>
                <div className="space-y-2">
                  {structuredData.items?.map((item, index) => (
                    <div key={index} className="bg-zinc-50 rounded-lg p-3">
                      <p className="font-medium text-zinc-900">
                        {item.quantity}x {item.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {item.specifications}
                      </p>
                      {item.totalPrice && (
                        <p className="text-sm font-medium text-violet-600 mt-1">
                          ${item.totalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget & Delivery */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-200 rounded-lg p-4">
                  <p className="text-sm text-zinc-500">Total Budget</p>
                  <p className="text-xl font-bold text-zinc-900">
                    {structuredData.currency} {structuredData.totalBudget?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                <div className="border border-zinc-200 rounded-lg p-4">
                  <p className="text-sm text-zinc-500">Delivery</p>
                  <p className="text-xl font-bold text-zinc-900">
                    {structuredData.deliveryDays || 'N/A'} days
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="chip chip-default">
                  Payment: {structuredData.paymentTerms || 'Net 30'}
                </span>
                <span className="chip chip-default">
                  Warranty: {structuredData.warranty || '1 year'}
                </span>
              </div>

              <hr className="border-zinc-200" />

              <button
                onClick={handleCreateRFP}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner /> : <SendIcon />}
                {loading ? 'Creating RFP...' : 'Create RFP'}
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <AiIcon />
              </div>
              <p className="text-zinc-500">Your AI-parsed structured data will appear here.</p>
              <p className="text-sm text-zinc-400 mt-1">Enter your requirements and click "Parse with AI"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRFP;