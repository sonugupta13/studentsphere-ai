import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, Target, DollarSign, Calendar, Tag, CreditCard,
  Search, SlidersHorizontal, ArrowUpDown, Edit2, Trash2, FileText,
  Eye, X, ArrowLeft, ArrowUpRight, ArrowDownRight, AlertTriangle,
  Upload, Trash, Download, FileUp, Check, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

import {
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  fetchBudgets,
  upsertBudget,
  deleteBudget,
  fetchExpenseAnalytics,
  clearExpenseErrors
} from '../redux/slices/expenseSlice';

// Categorized subcategory suggestions to assist student quick logging
const SUBCATEGORY_SUGGESTIONS = {
  Food: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Cafe', 'Groceries'],
  Travel: ['Bus', 'Train', 'Auto', 'Fuel', 'Cab', 'Metro'],
  Shopping: ['Clothes', 'Electronics', 'Accessories', 'Personal Items', 'Gifts'],
  Education: ['Books', 'Courses', 'Stationery', 'Exam Fees', 'Library'],
  Entertainment: ['Movies', 'Games', 'Outing', 'Subscriptions', 'Concerts'],
  Utilities: ['Rent', 'Hostels', 'Electricity', 'Internet', 'Mobile Recharge'],
  Other: ['Miscellaneous', 'Emergency', 'Medical', 'Gifts Given']
};

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Education', 'Entertainment', 'Utilities', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Card', 'UPI', 'Net Banking'];

// Premium styling colors matching categories for Recharts
const CATEGORY_COLORS = {
  Food: '#10b981',        // Emerald
  Travel: '#06b6d4',      // Cyan
  Shopping: '#ec4899',    // Pink
  Education: '#6366f1',   // Indigo
  Entertainment: '#f59e0b', // Amber
  Utilities: '#8b5cf6',   // Violet
  Other: '#64748b'        // Slate
};

export const ExpenseDashboard = () => {
  const dispatch = useDispatch();
  
  const { expenses, budgets, analytics, loading, analyticsLoading, error } = useSelector((state) => state.expenses);
  const { user } = useSelector((state) => state.auth);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal display states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const fileInputRef = useRef(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'Food',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI',
    description: '',
    receipt: null,
    receiptPreviewName: '',
    removeReceipt: false
  });

  const [budgetForm, setBudgetForm] = useState({
    limit: '',
    category: 'All',
    month: selectedMonth
  });

  // Fetch initial data based on month selected
  useEffect(() => {
    dispatch(fetchExpenses({ month: selectedMonth }));
    dispatch(fetchBudgets({ month: selectedMonth }));
    dispatch(fetchExpenseAnalytics({ month: selectedMonth }));
  }, [dispatch, selectedMonth]);

  // Sync budget form month with selected dashboard month
  useEffect(() => {
    setBudgetForm(prev => ({ ...prev, month: selectedMonth }));
  }, [selectedMonth]);

  // Clear errors on mount/unmount
  useEffect(() => {
    return () => {
      dispatch(clearExpenseErrors());
    };
  }, [dispatch]);

  // Handle CRUD Action: Add/Edit Expense
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.category) return;

    const formData = new FormData();
    formData.append('title', expenseForm.title);
    formData.append('amount', expenseForm.amount);
    formData.append('category', expenseForm.category);
    formData.append('subcategory', expenseForm.subcategory);
    formData.append('date', expenseForm.date);
    formData.append('paymentMethod', expenseForm.paymentMethod);
    formData.append('description', expenseForm.description);
    
    if (expenseForm.receipt) {
      formData.append('receipt', expenseForm.receipt);
    }
    
    if (editingExpense) {
      formData.append('removeReceipt', expenseForm.removeReceipt);
      await dispatch(updateExpense({ id: editingExpense._id, formData }));
    } else {
      await dispatch(addExpense(formData));
    }

    // Refresh lists
    dispatch(fetchExpenses({ month: selectedMonth }));
    setShowExpenseModal(false);
    resetExpenseForm();
  };

  // Handle Budget Submit
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.limit || !budgetForm.category || !budgetForm.month) return;

    await dispatch(upsertBudget({
      limit: parseFloat(budgetForm.limit),
      category: budgetForm.category,
      month: budgetForm.month
    }));

    dispatch(fetchBudgets({ month: selectedMonth }));
    setShowBudgetModal(false);
    setBudgetForm({ limit: '', category: 'All', month: selectedMonth });
  };

  // Trigger Edit Expense Modal
  const startEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      subcategory: expense.subcategory || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod,
      description: expense.description || '',
      receipt: null,
      receiptPreviewName: expense.receiptName || '',
      removeReceipt: false
    });
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await dispatch(deleteExpense(id));
      dispatch(fetchExpenses({ month: selectedMonth }));
    }
  };

  const resetExpenseForm = () => {
    setEditingExpense(null);
    setExpenseForm({
      title: '',
      amount: '',
      category: 'Food',
      subcategory: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      description: '',
      receipt: null,
      receiptPreviewName: '',
      removeReceipt: false
    });
  };

  // Receipt File Attachment Helper
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExpenseForm(prev => ({
        ...prev,
        receipt: file,
        receiptPreviewName: file.name,
        removeReceipt: false
      }));
    }
  };

  // Remove Attachment
  const handleRemoveFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setExpenseForm(prev => ({
      ...prev,
      receipt: null,
      receiptPreviewName: '',
      removeReceipt: true
    }));
  };

  // Filtered & Sorted Expenses List
  const getFilteredExpenses = () => {
    return expenses
      .filter(exp => {
        const matchesSearch = 
          exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (exp.subcategory && exp.subcategory.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = categoryFilter ? exp.category === categoryFilter : true;
        const matchesPayment = paymentFilter ? exp.paymentMethod === paymentFilter : true;
        
        return matchesSearch && matchesCategory && matchesPayment;
      })
      .sort((a, b) => {
        if (sortOption === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortOption === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortOption === 'amount-desc') return b.amount - a.amount;
        if (sortOption === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculated Stats
  const totalSpent = analytics?.totalSpentThisMonth || 0;
  const totalBudget = analytics?.totalBudgetLimit || 0;
  const remainingBudget = totalBudget - totalSpent;
  const utilizationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Pie chart dynamic content
  const pieData = analytics?.categoryPieData || [];

  // Recharts custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-xl shadow-xl text-xs font-bold font-sans">
          <p className="label">{`${payload[0].name}`}</p>
          <p className="intro text-indigo-400 mt-1">{`$${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16 transition-colors duration-200">
      {/* Navbar wrapper */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-85 transition-all">
              <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold text-sm text-slate-600 dark:text-slate-300">Back to Hub</span>
            </Link>
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Expense Tracker</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Student Budget & Expense Tracker
            </h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
              Set monthly savings targets, log transactions, and keep track of your cash flow.
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Month Selection */}
            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400 mr-2" />
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 outline-none font-bold border-none cursor-pointer focus:ring-0 w-36"
              />
            </div>
            
            <button
              onClick={() => {
                setBudgetForm({ limit: totalBudget || '', category: 'All', month: selectedMonth });
                setShowBudgetModal(true);
              }}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
            >
              <Target className="h-4 w-4 text-indigo-500" /> Set Monthly Budget
            </button>

            <button
              onClick={() => {
                resetExpenseForm();
                setShowExpenseModal(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md shadow-indigo-600/10"
            >
              <Plus className="h-4.5 w-4.5" /> Log Expense
            </button>
          </div>
        </div>

        {/* Alerts Banner */}
        {totalBudget > 0 && utilizationPercent >= 85 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl flex items-start gap-3 border shadow-sm ${
              utilizationPercent >= 100 
                ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' 
                : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                {utilizationPercent >= 100 
                  ? 'Budget Limit Exceeded!' 
                  : 'Budget Alert: Approaching Limit!'}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                {utilizationPercent >= 100 
                  ? `You have spent $${totalSpent.toFixed(2)} which exceeds your monthly target budget of $${totalBudget.toFixed(2)} by $${Math.abs(remainingBudget).toFixed(2)}.`
                  : `You have utilized ${utilizationPercent.toFixed(1)}% of your monthly budget. Remaining balance is only $${remainingBudget.toFixed(2)}.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Monthly Budget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Budget</div>
              <div className="text-2xl font-extrabold font-outfit mt-1">
                {totalBudget > 0 ? `$${totalBudget.toFixed(2)}` : 'Not Set'}
              </div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-[0.02]">
              <Target className="h-24 w-24 translate-x-4 translate-y-4" />
            </div>
          </div>

          {/* Total Spent */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100/50 dark:border-rose-900/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Spent</div>
              <div className="text-2xl font-extrabold font-outfit mt-1">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-[0.02]">
              <ArrowUpRight className="h-24 w-24 translate-x-4 translate-y-4" />
            </div>
          </div>

          {/* Remaining Balance */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm relative overflow-hidden">
            <div className={`p-4 rounded-2xl border ${
              remainingBudget >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/20' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/20'
            }`}>
              {remainingBudget >= 0 ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</div>
              <div className={`text-2xl font-extrabold font-outfit mt-1 ${
                remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {remainingBudget >= 0 ? `$${remainingBudget.toFixed(2)}` : `-$${Math.abs(remainingBudget).toFixed(2)}`}
              </div>
            </div>
          </div>

          {/* Utilization progress */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-center shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilization</span>
              <span className={`text-sm font-extrabold ${
                utilizationPercent >= 100 
                  ? 'text-rose-500' 
                  : utilizationPercent >= 80 
                    ? 'text-amber-500' 
                    : 'text-emerald-500'
              }`}>
                {utilizationPercent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  utilizationPercent >= 100 
                    ? 'bg-rose-500' 
                    : utilizationPercent >= 80 
                      ? 'bg-amber-500' 
                      : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, utilizationPercent)}%` }}
              ></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 font-semibold">
              {totalBudget > 0 
                ? `$${totalSpent.toFixed(0)} spent out of $${totalBudget.toFixed(0)} limit` 
                : 'Define a budget goal above to enable utilization tracking'}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Spending Trend (Last 6 Months) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-md font-bold mb-6 font-outfit text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 text-indigo-500 rotate-45" />
              Monthly Spending Trend
            </h3>
            <div className="h-64">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
              ) : analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="spent" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSpent)" dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Add transactions to view monthly spending trend.
                </div>
              )}
            </div>
          </div>

          {/* Category Split (Pie Chart) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-md font-bold mb-4 font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-500" />
                Category Distribution
              </h3>
            </div>
            
            <div className="h-48 w-full relative flex items-center justify-center">
              {analyticsLoading ? (
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm font-semibold text-center dark:text-slate-400">
                  No expenses recorded this month
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold text-slate-500">
              {CATEGORIES.map(cat => {
                const isPresent = pieData.some(entry => entry.name === cat);
                if (!isPresent && pieData.length > 0) return null;
                return (
                  <div key={cat} className="flex items-center gap-1.5 truncate">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }}></div>
                    <span className="truncate">{cat}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Middle row: Category Budget list & Payment distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Category Budget Progress */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-md font-bold font-outfit text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-indigo-500" />
                Category Budgets (Monthly Target)
              </h3>
              <button 
                onClick={() => {
                  setBudgetForm({ limit: '', category: 'Food', month: selectedMonth });
                  setShowBudgetModal(true);
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                + Manage Categories
              </button>
            </div>
            
            <div className="space-y-5">
              {analytics?.budgetUtilization && analytics.budgetUtilization.length > 0 ? (
                analytics.budgetUtilization.map(util => {
                  const spent = util.spent;
                  const limit = util.limit;
                  const percent = util.percent;

                  // Skip rendering categories with zero budget AND zero spent to keep it clean
                  if (limit === 0 && spent === 0) return null;

                  return (
                    <div key={util.category} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[util.category] }}></div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{util.category}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          <span className="font-bold text-slate-800 dark:text-slate-200">${spent.toFixed(2)}</span>
                          {limit > 0 ? ` / $${limit.toFixed(2)}` : ' (No Budget)'}
                        </div>
                      </div>

                      {limit > 0 ? (
                        <div className="relative">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                percent >= 100 
                                  ? 'bg-rose-500' 
                                  : percent >= 85 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            ></div>
                          </div>
                          {percent >= 85 && (
                            <span className={`absolute right-0 -top-6 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              percent >= 100 
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {percent >= 100 ? 'Limit Exceeded' : `${percent.toFixed(0)}% Used`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">No budget set. Add a budget limit to track utilization.</div>
                      )}
                    </div>
                  );
                }).filter(Boolean)
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">No category budgets defined yet. Click Manage Categories above to create one.</div>
              )}
              {/* If no categories are budgeted or spent, prompt them */}
              {analytics?.budgetUtilization && analytics.budgetUtilization.filter(u => u.limit > 0 || u.spent > 0).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">Set up specific category budgets to track category-wise limits.</div>
              )}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <h3 className="text-md font-bold mb-4 font-outfit text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-indigo-500" />
              Payment Channel
            </h3>
            
            <div className="space-y-4">
              {analyticsLoading ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                </div>
              ) : analytics?.paymentDistribution && analytics.paymentDistribution.length > 0 ? (
                analytics.paymentDistribution.map(item => {
                  const percentage = totalSpent > 0 ? (item.value / totalSpent) * 100 : 0;
                  return (
                    <div key={item.name} className="flex justify-between items-center p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{percentage.toFixed(0)}% of total</div>
                        </div>
                      </div>
                      <div className="font-extrabold text-sm">${item.value.toFixed(2)}</div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">Add expenses to view payment distribution.</div>
              )}
            </div>
          </div>
        </div>

        {/* Expenses List & Filter Area */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold font-outfit text-slate-900 dark:text-white">Transaction Logs</h3>
            
            {/* Search and filter inputs */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-sm w-full sm:w-60 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <Search className="h-4 w-4 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent outline-none w-full text-slate-800 dark:text-slate-100 border-none"
                />
              </div>

              {/* Category Filter */}
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Payment Filter */}
              <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">All Payments</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Sorting */}
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {loading && expenses.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No transactions found matching your filters.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-4">Title</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredExpenses.map(exp => (
                    <tr key={exp._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                      <td className="py-4 pl-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{exp.title}</span>
                          {exp.subcategory && (
                            <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {exp.subcategory}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold" style={{
                          backgroundColor: `${CATEGORY_COLORS[exp.category]}15`,
                          color: CATEGORY_COLORS[exp.category]
                        }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}></div>
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 font-semibold">{exp.paymentMethod}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 font-semibold">
                        {new Date(exp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 text-right font-extrabold text-slate-900 dark:text-white">
                        ${exp.amount.toFixed(2)}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          {exp.receiptUrl && (
                            <button
                              onClick={() => setSelectedReceipt({ url: exp.receiptUrl, name: exp.receiptName || 'Receipt Document' })}
                              className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-900/40 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg transition-all"
                              title="View Receipt"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => startEditExpense(exp)}
                            className="p-1.5 bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 dark:bg-slate-800 dark:hover:bg-amber-900/40 dark:text-slate-400 dark:hover:text-amber-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-900/40 dark:text-slate-400 dark:hover:text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>

      {/* MODAL: Add/Edit Expense */}
      <AnimatePresence>
        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-indigo-500" />
                  {editingExpense ? 'Modify Transaction Details' : 'Add New Transaction'}
                </h3>
                <button 
                  onClick={() => setShowExpenseModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Expense Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hostels Dinner"
                      value={expenseForm.title}
                      onChange={e => setExpenseForm({...expenseForm, title: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Amount ($)</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={expenseForm.amount}
                      onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select 
                      value={expenseForm.category}
                      onChange={e => setExpenseForm({...expenseForm, category: e.target.value, subcategory: ''})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Subcategory / Item</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Snacks, Train ticket"
                      value={expenseForm.subcategory}
                      onChange={e => setExpenseForm({...expenseForm, subcategory: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subcategory suggestion pills */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Select Suggestions</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBCATEGORY_SUGGESTIONS[expenseForm.category]?.map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setExpenseForm({ ...expenseForm, subcategory: sub })}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          expenseForm.subcategory === sub
                            ? 'bg-indigo-650 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={expenseForm.date}
                      onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Channel</label>
                    <select 
                      value={expenseForm.paymentMethod}
                      onChange={e => setExpenseForm({...expenseForm, paymentMethod: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description (Optional)</label>
                  <textarea 
                    placeholder="Short description about the transaction..."
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-20 resize-none"
                  ></textarea>
                </div>

                {/* Receipt Upload Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Receipt Attachment (Optional)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden" 
                      accept="image/*,.pdf"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="px-4 py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      Attach Image or PDF
                    </button>
                    {expenseForm.receiptPreviewName && (
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs">
                        <span className="font-semibold truncate max-w-[200px]">{expenseForm.receiptPreviewName}</span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 mt-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 transition-all flex justify-center items-center gap-2"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {editingExpense ? 'Save Changes' : 'Log Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Set Budget */}
      <AnimatePresence>
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-500" />
                  Set Budget Threshold
                </h3>
                <button 
                  onClick={() => setShowBudgetModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleBudgetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Target Month</label>
                  <input 
                    type="month"
                    required
                    value={budgetForm.month}
                    onChange={e => setBudgetForm({...budgetForm, month: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scope</label>
                  <select 
                    value={budgetForm.category}
                    onChange={e => setBudgetForm({...budgetForm, category: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="All">All Categories (Overall Budget)</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c} Category Budget</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Budget Limit ($)</label>
                  <input 
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 500"
                    value={budgetForm.limit}
                    onChange={e => setBudgetForm({...budgetForm, limit: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/10 transition-all flex justify-center items-center gap-2"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  Save Budget Limit
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: View Receipt Attachment */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold truncate pr-4">{selectedReceipt.name}</h3>
                <div className="flex gap-2">
                  <a 
                    href={selectedReceipt.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Download className="h-4.5 w-4.5" />
                    Open Original
                  </a>
                  <button 
                    onClick={() => setSelectedReceipt(null)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition-all"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center max-h-[60vh]">
                {selectedReceipt.url.toLowerCase().endsWith('.pdf') || selectedReceipt.url.includes('/receipts/receipt-') && selectedReceipt.url.toLowerCase().includes('.pdf') ? (
                  <iframe 
                    src={selectedReceipt.url} 
                    title="Receipt PDF" 
                    className="w-full h-[50vh] border-none"
                  ></iframe>
                ) : (
                  <img 
                    src={selectedReceipt.url} 
                    alt="Receipt preview" 
                    className="max-w-full max-h-[50vh] object-contain"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ExpenseDashboard;
