import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import User from './models/User.js';
import Expense from './models/Expense.js';
import Budget from './models/Budget.js';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getBudgets,
  upsertBudget,
  deleteBudget,
  getExpenseAnalytics,
} from './controllers/expenseController.js';

dotenv.config();

// Helper to create mocked Express response object
const makeMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

// Error helper
const nextMock = (err) => {
  if (err) {
    console.error('Express Error Handler caught:', err);
    throw err;
  }
};

const runSuite = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentsphere');
    console.log('Connected.');

    const email = 'skg9199725658@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`Test User ${email} not found. Ensure DB is seeded.`);
      process.exit(1);
    }
    console.log(`\nStarting Test Suite for User: ${user.fullName} (${user._id})`);

    const reqMock = {
      user,
      protocol: 'http',
      get(name) {
        if (name === 'host') return 'localhost:5000';
        return '';
      }
    };

    // Clean up any old test data for this user to ensure test stability
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await Expense.deleteMany({ userId: user._id });
    await Budget.deleteMany({ userId: user._id });

    // Make sure upload receipts directory exists
    const receiptsDir = './uploads/receipts';
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // Write dummy receipts files
    fs.writeFileSync('./uploads/receipts/test-food-receipt.jpg', 'fake image content');

    // --- STEP 1: Set Budgets ---
    console.log('\n--- Step 1: Setting Budget Goals ---');
    const resBudget1 = makeMockRes();
    await upsertBudget({
      ...reqMock,
      body: {
        limit: 500,
        category: 'All',
        month: currentMonthStr,
      }
    }, resBudget1, nextMock);

    if (resBudget1.statusCode !== 200 || !resBudget1.jsonData.success) {
      throw new Error(`Failed to set overall budget, status: ${resBudget1.statusCode}`);
    }
    console.log(`✔ Overall budget of $500 set for month ${currentMonthStr}.`);

    const resBudget2 = makeMockRes();
    await upsertBudget({
      ...reqMock,
      body: {
        limit: 150,
        category: 'Food',
        month: currentMonthStr,
      }
    }, resBudget2, nextMock);
    console.log('✔ Category budget for Food set to $150.');

    // --- STEP 2: Log Expense with Uploaded Receipt ---
    console.log('\n--- Step 2: Logging Expense with Receipt (Food) ---');
    const resExpense1 = makeMockRes();
    const createReq1 = {
      ...reqMock,
      file: {
        fieldname: 'receipt',
        originalname: 'dinner_bill.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        destination: './uploads/receipts',
        filename: 'test-food-receipt.jpg',
        path: './uploads/receipts/test-food-receipt.jpg',
        size: 10240, // 10KB
      },
      body: {
        title: 'Dinner at Pizzeria',
        amount: 45.50,
        category: 'Food',
        subcategory: 'Dinner',
        date: new Date().toISOString(),
        paymentMethod: 'UPI',
        description: 'Team outing pizza treat',
      },
    };
    await createExpense(createReq1, resExpense1, nextMock);

    if (resExpense1.statusCode !== 201 || !resExpense1.jsonData.success) {
      throw new Error(`Failed to log expense 1, status: ${resExpense1.statusCode}`);
    }
    const expense1 = resExpense1.jsonData.data;
    console.log(`✔ Expense 1 logged successfully. ID: ${expense1._id}, Receipt: ${expense1.receiptUrl}`);

    // --- STEP 3: Log Second Expense (Travel, No Receipt) ---
    console.log('\n--- Step 3: Logging Second Expense (Travel, No Receipt) ---');
    const resExpense2 = makeMockRes();
    const createReq2 = {
      ...reqMock,
      body: {
        title: 'Uber to Campus',
        amount: 12.00,
        category: 'Travel',
        subcategory: 'Cab',
        date: new Date().toISOString(),
        paymentMethod: 'Card',
        description: 'Morning lectures commute',
      },
    };
    await createExpense(createReq2, resExpense2, nextMock);
    
    if (resExpense2.statusCode !== 201 || !resExpense2.jsonData.success) {
      throw new Error(`Failed to log expense 2, status: ${resExpense2.statusCode}`);
    }
    const expense2 = resExpense2.jsonData.data;
    console.log(`✔ Expense 2 logged successfully. ID: ${expense2._id}`);

    // --- STEP 4: Query Analytics & Budget Utilization ---
    console.log('\n--- Step 4: Querying Analytics & Budget Utilization ---');
    const resAnalytics = makeMockRes();
    await getExpenseAnalytics({
      ...reqMock,
      query: { month: currentMonthStr }
    }, resAnalytics, nextMock);

    const stats = resAnalytics.jsonData.data;
    console.log(`✔ Analytics retrieved.`);
    console.log(`  Total spent this month: $${stats.totalSpentThisMonth} (Expected: $57.50)`);
    console.log(`  Overall budget limit: $${stats.totalBudgetLimit} (Expected: $500.00)`);
    console.log(`  Remaining budget: $${(stats.totalBudgetLimit - stats.totalSpentThisMonth).toFixed(2)} (Expected: $442.50)`);

    if (stats.totalSpentThisMonth !== 57.50) {
      throw new Error(`Analytics spent calculation mismatch. Found: ${stats.totalSpentThisMonth}`);
    }

    // Verify category utilization
    const foodUtil = stats.budgetUtilization.find(u => u.category === 'Food');
    if (!foodUtil || foodUtil.spent !== 45.50 || foodUtil.limit !== 150) {
      throw new Error('Food category budget utilization breakdown error.');
    }
    console.log(`✔ Food category utilization verified: $${foodUtil.spent} / $${foodUtil.limit} (${foodUtil.percent}%)`);

    // --- STEP 5: Update Expense ---
    console.log('\n--- Step 5: Updating Expense ---');
    const resUpdate = makeMockRes();
    const updateReq = {
      ...reqMock,
      params: { id: expense1._id },
      body: {
        title: 'Dinner at Pizzeria (Updated)',
        amount: 50.00, // Increase price
        category: 'Food',
        subcategory: 'Dinner',
        paymentMethod: 'Cash',
      }
    };
    await updateExpense(updateReq, resUpdate, nextMock);
    
    if (resUpdate.statusCode !== 200 || !resUpdate.jsonData.success) {
      throw new Error(`Failed to update expense, status: ${resUpdate.statusCode}`);
    }
    console.log(`✔ Expense updated successfully. New Amount: $${resUpdate.jsonData.data.amount}`);

    // Verify analytics updated
    const resAnalyticsUpdated = makeMockRes();
    await getExpenseAnalytics({
      ...reqMock,
      query: { month: currentMonthStr }
    }, resAnalyticsUpdated, nextMock);
    
    const updatedStats = resAnalyticsUpdated.jsonData.data;
    console.log(`✔ Updated total spent this month: $${updatedStats.totalSpentThisMonth} (Expected: $62.00)`);
    if (updatedStats.totalSpentThisMonth !== 62.00) {
      throw new Error(`Spent updates did not propagate to analytics. Found: ${updatedStats.totalSpentThisMonth}`);
    }

    // --- STEP 6: Delete Expenses & Verify Cleanups ---
    console.log('\n--- Step 6: Deleting Expenses & Cleaning Files ---');
    
    const resDelete1 = makeMockRes();
    await deleteExpense({
      ...reqMock,
      params: { id: expense1._id }
    }, resDelete1, nextMock);
    console.log('✔ Expense 1 deleted.');

    const resDelete2 = makeMockRes();
    await deleteExpense({
      ...reqMock,
      params: { id: expense2._id }
    }, resDelete2, nextMock);
    console.log('✔ Expense 2 deleted.');

    // Verify receipt was deleted from disk
    const receiptFileExists = fs.existsSync('./uploads/receipts/test-food-receipt.jpg');
    console.log(`  Receipt file exists on disk: ${receiptFileExists}`);
    if (receiptFileExists) {
      throw new Error('Local receipt file was not cleaned up after expense deletion!');
    }
    console.log('✔ Storage cleanup confirmed.');

    console.log('\n======================================================');
    console.log('🎉 ALL EXPENSE TRACKER CRUD & APIS TESTED SUCCESSFUL!');
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
