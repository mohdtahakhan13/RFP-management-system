import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ;

// Icons
const RfpIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const VendorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CompareIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [rfps, setRfps] = useState([]);
  const [stats, setStats] = useState({
    totalRfps: 0,
    activeRfps: 0,
    totalVendors: 0,
    proposalsReceived: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [rfpsRes, vendorsRes] = await Promise.all([
        axios.get(`${API_URL}/rfps`),
        axios.get(`${API_URL}/vendors`),
      ]);

      setRfps(rfpsRes.data.data || []);

      const activeRfps = (rfpsRes.data.data || []).filter(rfp =>
        ['draft', 'sent', 'in-progress'].includes(rfp.status)
      ).length;

      setStats({
        totalRfps: rfpsRes.data.data?.length || 0,
        activeRfps,
        totalVendors: vendorsRes.data.data?.length || 0,
        proposalsReceived: rfpsRes.data.data?.reduce((acc, rfp) =>
          acc + (rfp.proposals?.length || 0), 0
        ) || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="card p-6"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon />
        </div>
        <div>
          <p className="text-3xl font-bold text-zinc-900">{value}</p>
          <p className="text-sm text-zinc-500">{title}</p>
        </div>
      </div>
    </motion.div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'chip-default';
      case 'sent': return 'chip-info';
      case 'in-progress': return 'chip-warning';
      case 'completed': return 'chip-success';
      default: return 'chip-default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">AI-Powered RFP Management</h2>
        <p className="mt-1 text-zinc-500">Track your RFPs, vendors, and proposals in one place</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total RFPs"
          value={stats.totalRfps}
          icon={RfpIcon}
          color="bg-violet-100 text-violet-600"
        />
        <StatCard
          title="Active RFPs"
          value={stats.activeRfps}
          icon={TrendingIcon}
          color="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="Vendors"
          value={stats.totalVendors}
          icon={VendorIcon}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Proposals Received"
          value={stats.proposalsReceived}
          icon={CompareIcon}
          color="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/create-rfp')}
          className="btn-primary"
        >
          <PlusIcon />
          Create New RFP
        </button>
        <button
          onClick={() => navigate('/vendors')}
          className="btn-secondary"
        >
          Manage Vendors
        </button>
      </div>

      {/* Recent RFPs */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-4">Recent RFPs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rfps.slice(0, 6).map((rfp) => (
            <motion.div
              key={rfp._id}
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/rfp/${rfp._id}`)}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-zinc-900 mb-2 line-clamp-1">
                {rfp.title}
              </h4>
              <p className="text-sm text-zinc-500 mb-4 line-clamp-2">
                {rfp.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`chip ${getStatusColor(rfp.status)}`}>
                  {rfp.status}
                </span>
                <span className="chip chip-default">
                  {rfp.vendors?.length || 0} vendors
                </span>
                <span className="chip chip-default">
                  {rfp.proposals?.length || 0} proposals
                </span>
              </div>

              <div className="text-sm text-zinc-500">
                <p>Budget: {rfp.structuredData?.currency || 'USD'} {rfp.structuredData?.totalBudget?.toLocaleString() || 'N/A'}</p>
                {rfp.structuredData?.deliveryDays && (
                  <p>Delivery: {rfp.structuredData.deliveryDays} days</p>
                )}
              </div>

              {rfp.proposals?.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Proposal Status</span>
                    <span>{Math.round((rfp.proposals.filter(p => p.status === 'accepted').length / rfp.proposals.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${(rfp.proposals.filter(p => p.status === 'accepted').length / rfp.proposals.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {rfps.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RfpIcon />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No RFPs created yet</h3>
          <p className="text-zinc-500 mb-6">Start by creating your first RFP!</p>
          <button
            onClick={() => navigate('/create-rfp')}
            className="btn-primary"
          >
            <PlusIcon />
            Create First RFP
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;