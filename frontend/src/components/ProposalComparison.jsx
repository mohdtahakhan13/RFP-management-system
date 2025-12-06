import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL ;

// Icons
const TrophyIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ProposalComparison = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [rfp, setRfp] = useState(null);

  useEffect(() => {
    fetchComparisonData();
  }, [id]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const [rfpRes, comparisonRes] = await Promise.all([
        axios.get(`${API_URL}/rfps/${id}`),
        axios.post(`${API_URL}/rfps/${id}/compare`, {}),
      ]);

      setRfp(rfpRes.data.data);
      setComparisonData(comparisonRes.data.data);
      setProposals(rfpRes.data.data.proposals || []);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-teal-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-teal-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'high': return <CheckIcon className="text-teal-500" />;
      case 'medium': return <WarningIcon className="text-amber-500" />;
      case 'low': return <ErrorIcon className="text-rose-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!comparisonData) {
    return (
      <div className="card p-12 text-center">
        <p className="text-zinc-500">No comparison data available</p>
      </div>
    );
  }

  // Prepare data for charts
  const barChartData = comparisonData.comparison.map(vendor => ({
    name: vendor.vendorName,
    'Total Score': vendor.totalScore,
    'Value for Money': vendor.valueForMoney,
  }));

  // Simple horizontal score bars data
  const scoreData = comparisonData.comparison.map(vendor => ({
    name: vendor.vendorName.length > 12 ? vendor.vendorName.substring(0, 12) + '...' : vendor.vendorName,
    fullName: vendor.vendorName,
    score: vendor.totalScore,
    priceRank: vendor.priceRank,
    deliveryRank: vendor.deliveryRank,
  }));

  const colors = ['#8b5cf6', '#14b8a6', '#f59e0b', '#f43f5e', '#3b82f6'];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate(`/rfp/${id}`)}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <BackIcon />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">AI-Powered Proposal Comparison</h2>
            <p className="text-zinc-500">{rfp?.title} • {proposals.length} proposals received</p>
          </div>
        </div>
      </motion.div>

      {/* Recommendation Banner */}
      {comparisonData.recommendation && (
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          className="card p-6 bg-gradient-to-r from-violet-50 to-teal-50 border-violet-200 transition-shadow duration-300 hover:shadow-lg"
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="p-3 bg-amber-100 rounded-xl text-amber-600"
              whileHover={{ rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <TrophyIcon />
            </motion.div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-zinc-900">AI Recommendation</h3>
              <p className="text-zinc-700">
                <strong>{comparisonData.recommendation.bestVendorName}</strong> is recommended with{' '}
                <strong>{comparisonData.recommendation.confidence}%</strong> confidence
              </p>
              <p className="text-sm text-zinc-500">{comparisonData.recommendation.reason}</p>
            </div>
            <span className="chip chip-success flex items-center gap-1.5 py-2 px-4">
              <CheckIcon className="w-4 h-4" />
              Best Choice
            </span>
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Comparison Bar Chart */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="card p-6 transition-shadow duration-300 hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Score Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#71717a', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e4e4e7',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="Total Score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Value for Money" fill="#14b8a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Simple Score Cards */}
        <motion.div
          variants={itemVariants}
          className="card p-6 transition-shadow duration-300 hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">Vendor Scores</h3>
          <div className="space-y-4">
            {comparisonData.comparison.map((vendor, index) => (
              <motion.div
                key={vendor.vendorId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="p-4 border border-zinc-200 rounded-lg cursor-pointer transition-all duration-200 hover:border-violet-300 hover:bg-violet-50/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="font-medium text-zinc-900">{vendor.vendorName}</span>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(vendor.totalScore)}`}>
                    {vendor.totalScore}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${getScoreBg(vendor.totalScore)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${vendor.totalScore}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-zinc-500">
                  <span>Price Rank: #{vendor.priceRank}</span>
                  <span>Delivery Rank: #{vendor.deliveryRank}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Detailed Comparison Table */}
      <motion.div
        variants={itemVariants}
        className="card overflow-hidden transition-shadow duration-300 hover:shadow-lg"
      >
        <div className="p-6 border-b border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Vendor</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-zinc-500">AI Score</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-zinc-500">Price Rank</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-zinc-500">Delivery Rank</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-zinc-500">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {comparisonData.comparison.map((vendor, index) => (
                <motion.tr
                  key={vendor.vendorId}
                  className="transition-colors duration-150 hover:bg-violet-50/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900">{vendor.vendorName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${getScoreBg(vendor.totalScore)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${vendor.totalScore}%` }}
                          transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                      <span className={`font-medium ${getScoreColor(vendor.totalScore)}`}>
                        {vendor.totalScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className={`chip ${vendor.priceRank === 1 ? 'chip-success' : 'chip-default'}`}
                    >
                      #{vendor.priceRank}
                    </motion.span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <motion.span
                      whileHover={{ scale: 1.1 }}
                      className={`chip ${vendor.deliveryRank === 1 ? 'chip-success' : 'chip-default'}`}
                    >
                      #{vendor.deliveryRank}
                    </motion.span>
                  </td>
                  <td className="px-6 py-4">
                    <motion.div
                      className="flex justify-center"
                      whileHover={{ scale: 1.2 }}
                    >
                      {getRecommendationIcon(vendor.recommendation)}
                    </motion.div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* AI Insights */}
      {comparisonData.insights && comparisonData.insights.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="card p-6 transition-shadow duration-300 hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold text-zinc-900 mb-4">AI Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparisonData.insights.map((insight, index) => (
              <motion.div
                key={index}
                className="border border-zinc-200 rounded-lg p-4 transition-all duration-200 hover:border-violet-300 hover:bg-violet-50/30"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    className="p-2 bg-violet-100 rounded-lg text-violet-600"
                    whileHover={{ rotate: 5 }}
                  >
                    <TrendingIcon />
                  </motion.div>
                  <p className="text-sm text-zinc-600">{insight}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProposalComparison;