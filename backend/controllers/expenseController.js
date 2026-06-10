import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials are present
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Helper: Handle file upload to Cloudinary/Local
const handleFileUpload = async (file, req) => {
  let fileUrl = '';
  let receiptName = file.originalname;

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        folder: 'studentsphere/receipts',
      });
      fileUrl = result.secure_url;
      
      // Cleanup local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error('Cloudinary receipt upload error:', err);
      // Fallback to local disk path URL
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/receipts/${file.filename}`;
    }
  } else {
    fileUrl = `${req.protocol}://${req.get('host')}/uploads/receipts/${file.filename}`;
  }

  return { fileUrl, receiptName };
};

// Helper: Cleanup stored receipt file
const cleanupFile = async (fileUrl) => {
  if (!fileUrl) return;

  if (process.env.CLOUDINARY_CLOUD_NAME && fileUrl.includes('cloudinary')) {
    // Cloudinary cleanup
    try {
      // Extract public_id from Cloudinary URL
      // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567/studentsphere/receipts/filename.jpg
      const parts = fileUrl.split('/');
      const filenameWithExtension = parts[parts.length - 1];
      const filename = filenameWithExtension.split('.')[0];
      const folderPartIndex = parts.indexOf('studentsphere');
      if (folderPartIndex !== -1) {
        const publicId = parts.slice(folderPartIndex).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error('Cloudinary destroy receipt error:', err);
    }
  } else {
    // Local file cleanup
    try {
      const filename = path.basename(fileUrl);
      const localPath = path.join('./uploads/receipts', filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err) {
      console.error('Local file cleanup error:', err);
    }
  }
};

// @desc    Get user's expenses
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { category, search, startDate, endDate } = req.query;

    const query = { userId };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { title, amount, category, subcategory, date, paymentMethod, description } = req.body;

    if (!title || !amount || !category || !paymentMethod) {
      res.status(400);
      throw new Error('Title, amount, category, and payment method are required.');
    }

    let receiptUrl = '';
    let receiptName = '';

    if (req.file) {
      const uploadRes = await handleFileUpload(req.file, req);
      receiptUrl = uploadRes.fileUrl;
      receiptName = uploadRes.receiptName;
    }

    const expense = await Expense.create({
      userId,
      title,
      amount: parseFloat(amount),
      category,
      subcategory,
      date: date ? new Date(date) : new Date(),
      paymentMethod,
      description,
      receiptUrl,
      receiptName,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { title, amount, category, subcategory, date, paymentMethod, description } = req.body;

    let expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      res.status(404);
      throw new Error('Expense not found.');
    }

    let receiptUrl = expense.receiptUrl;
    let receiptName = expense.receiptName;

    // Check if new file uploaded or if receipt was removed
    if (req.file) {
      // Clean up old file first
      await cleanupFile(expense.receiptUrl);
      
      const uploadRes = await handleFileUpload(req.file, req);
      receiptUrl = uploadRes.fileUrl;
      receiptName = uploadRes.receiptName;
    } else if (req.body.removeReceipt === 'true' || req.body.removeReceipt === true) {
      await cleanupFile(expense.receiptUrl);
      receiptUrl = '';
      receiptName = '';
    }

    expense.title = title || expense.title;
    expense.amount = amount ? parseFloat(amount) : expense.amount;
    expense.category = category || expense.category;
    expense.subcategory = subcategory !== undefined ? subcategory : expense.subcategory;
    expense.date = date ? new Date(date) : expense.date;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.description = description !== undefined ? description : expense.description;
    expense.receiptUrl = receiptUrl;
    expense.receiptName = receiptName;

    const updatedExpense = await expense.save();
    res.status(200).json({ success: true, data: updatedExpense });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const expense = await Expense.findOne({ _id: id, userId });
    if (!expense) {
      res.status(404);
      throw new Error('Expense not found.');
    }

    // Cleanup files
    await cleanupFile(expense.receiptUrl);

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user budgets
// @route   GET /api/expenses/budgets
// @access  Private
export const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { month } = req.query; // 'YYYY-MM'

    const query = { userId };
    if (month) {
      query.month = month;
    }

    const budgets = await Budget.find(query).sort({ month: -1, category: 1 });
    res.status(200).json({ success: true, data: budgets });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or Update Budget
// @route   POST /api/expenses/budgets
// @access  Private
export const upsertBudget = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { limit, category, month } = req.body;

    if (!limit || !category || !month) {
      res.status(400);
      throw new Error('Limit, category, and month (YYYY-MM) are required.');
    }

    // Find and update, or create
    const budget = await Budget.findOneAndUpdate(
      { userId, category, month },
      { limit: parseFloat(limit) },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete Budget
// @route   DELETE /api/expenses/budgets/:id
// @access  Private
export const deleteBudget = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) {
      res.status(404);
      throw new Error('Budget not found.');
    }

    res.status(200).json({ success: true, message: 'Budget deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytical insights for expenses and budgets
// @route   GET /api/expenses/analytics
// @access  Private
export const getExpenseAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();
    
    // Parse current month in YYYY-MM
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get month filter from query, default to current month
    const targetMonth = req.query.month || currentMonthStr;

    // Fetch all expenses and budgets for the target month
    // Month boundaries
    const [year, month] = targetMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const expensesForMonth = await Expense.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    });

    const budgetsForMonth = await Budget.find({
      userId,
      month: targetMonth,
    });

    // 1. Calculate category-wise spent totals
    const categorySpent = {
      Food: 0,
      Travel: 0,
      Shopping: 0,
      Education: 0,
      Entertainment: 0,
      Utilities: 0,
      Other: 0,
    };

    expensesForMonth.forEach(exp => {
      if (categorySpent[exp.category] !== undefined) {
        categorySpent[exp.category] += exp.amount;
      } else {
        categorySpent.Other += exp.amount;
      }
    });

    const totalSpentThisMonth = Object.values(categorySpent).reduce((a, b) => a + b, 0);

    // 2. Budget utilization breakdown
    const totalBudgetObj = budgetsForMonth.find(b => b.category === 'All');
    const totalBudgetLimit = totalBudgetObj ? totalBudgetObj.limit : 0;

    const categoryBudgets = {};
    budgetsForMonth.forEach(b => {
      if (b.category !== 'All') {
        categoryBudgets[b.category] = b.limit;
      }
    });

    const budgetUtilization = Object.keys(categorySpent).map(cat => {
      const spent = categorySpent[cat];
      const limit = categoryBudgets[cat] || 0;
      const percent = limit > 0 ? parseFloat(((spent / limit) * 100).toFixed(1)) : 0;
      return {
        category: cat,
        spent,
        limit,
        percent,
      };
    });

    // 3. Monthly Spending Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const lastSixMonthsExpenses = await Expense.find({
      userId,
      date: { $gte: sixMonthsAgo },
    });

    // Group by month
    const monthlyTrendMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mName = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyTrendMap[mStr] = { monthStr: mStr, monthName: mName, spent: 0 };
    }

    lastSixMonthsExpenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const mStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrendMap[mStr]) {
        monthlyTrendMap[mStr].spent += exp.amount;
      }
    });

    const monthlyTrend = Object.values(monthlyTrendMap);

    // 4. Payment method distribution
    const paymentMethods = {
      Cash: 0,
      Card: 0,
      UPI: 0,
      'Net Banking': 0,
    };
    expensesForMonth.forEach(exp => {
      if (paymentMethods[exp.paymentMethod] !== undefined) {
        paymentMethods[exp.paymentMethod] += exp.amount;
      }
    });

    const paymentDistribution = Object.keys(paymentMethods).map(method => ({
      name: method,
      value: paymentMethods[method],
    })).filter(item => item.value > 0);

    // 5. Predefined Categories data array for frontend charts
    const categoryPieData = Object.keys(categorySpent)
      .map(cat => ({ name: cat, value: categorySpent[cat] }))
      .filter(item => item.value > 0);

    res.status(200).json({
      success: true,
      data: {
        targetMonth,
        totalSpentThisMonth,
        totalBudgetLimit,
        categorySpent,
        budgetUtilization,
        monthlyTrend,
        paymentDistribution,
        categoryPieData,
      },
    });
  } catch (error) {
    next(error);
  }
};
