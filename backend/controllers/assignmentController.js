import Assignment from '../models/Assignment.js';
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

// Helper: Automatically update overdue assignments in the database for the active user
const checkAndUpdateOverdue = async (userId) => {
  const now = new Date();
  
  // Find all assignments that are NOT completed, NOT overdue, and whose due date has passed
  const pendingAssignments = await Assignment.find({
    userId,
    status: { $nin: ['Completed', 'Overdue'] },
  });

  const overduePromises = pendingAssignments.map(async (asg) => {
    const due = new Date(asg.dueDate);
    if (asg.dueTime) {
      const [hours, minutes] = asg.dueTime.split(':');
      due.setHours(parseInt(hours, 10) || 0, parseInt(minutes, 10) || 0, 0, 0);
    }
    
    if (now > due) {
      asg.status = 'Overdue';
      await asg.save();
    }
  });

  await Promise.all(overduePromises);
};

// @desc    Get all assignments with search, filtering, and sorting
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Check and update overdue statuses first
    await checkAndUpdateOverdue(userId);

    const { search, subject, priority, status, dueDate, sort } = req.query;

    const query = { userId };

    // Search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Filters
    if (subject) {
      query.subject = subject;
    }
    if (priority) {
      query.priority = priority;
    }
    if (status) {
      query.status = status;
    }
    
    // Due Date filters
    if (dueDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      if (dueDate === 'today') {
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: now, $lte: endOfToday };
      } else if (dueDate === 'tomorrow') {
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        query.dueDate = { $gte: tomorrow, $lte: endOfTomorrow };
      } else if (dueDate === 'upcoming') {
        query.dueDate = { $gte: now };
        query.status = { $ne: 'Completed' };
      } else if (dueDate === 'overdue') {
        query.status = 'Overdue';
      }
    }

    // Sort setup
    let sortOptions = {};
    if (sort) {
      if (sort === 'Nearest Deadline') {
        sortOptions = { dueDate: 1, dueTime: 1 };
      } else if (sort === 'Recently Added') {
        sortOptions = { createdAt: -1 };
      } else if (sort === 'Alphabetical') {
        sortOptions = { title: 1 };
      } else if (sort === 'Highest Priority') {
        // Priority sorting (High -> Medium -> Low) is handled manually below if mongoose sort isn't enough,
        // but we can also use a custom sort order. We will sort by dueDate as secondary,
        // and manually order them or default sorting by priority values.
        sortOptions = { priority: 1, dueDate: 1 }; // High is H, Medium is M, Low is L (Alphabetical priority isn't exactly high-medium-low. We will custom sort in JavaScript).
      }
    } else {
      sortOptions = { dueDate: 1 }; // Default Nearest Deadline
    }

    let assignments = await Assignment.find(query).sort(sortOptions !== 'Highest Priority' ? sortOptions : {});

    // Custom sorting for priority if requested
    if (sort === 'Highest Priority') {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      assignments.sort((a, b) => {
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (diff !== 0) return diff;
        return new Date(a.dueDate) - new Date(b.dueDate); // secondary sorting by deadline
      });
    }

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
export const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments calendar data
// @route   GET /api/assignments/calendar
// @access  Private
export const getCalendarData = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await checkAndUpdateOverdue(userId);

    const assignments = await Assignment.find({ userId });
    
    // Group assignments by local date string
    const calendarEvents = {};
    assignments.forEach((asg) => {
      const dateStr = new Date(asg.dueDate).toISOString().split('T')[0];
      if (!calendarEvents[dateStr]) {
        calendarEvents[dateStr] = [];
      }
      calendarEvents[dateStr].push(asg);
    });

    res.status(200).json({ success: true, data: calendarEvents });
  } catch (error) {
    next(error);
  }
};

// @desc    Get assignments analytics
// @route   GET /api/assignments/analytics
// @access  Private
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await checkAndUpdateOverdue(userId);

    const assignments = await Assignment.find({ userId });

    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === 'Completed').length;
    const pending = assignments.filter((a) => a.status === 'Not Started' || a.status === 'In Progress' || a.status === 'Under Review').length;
    const overdue = assignments.filter((a) => a.status === 'Overdue').length;
    const highPriority = assignments.filter((a) => a.priority === 'High' && a.status !== 'Completed').length;

    // Status counts for Doughnut chart
    const statusDistribution = {
      'Not Started': assignments.filter((a) => a.status === 'Not Started').length,
      'In Progress': assignments.filter((a) => a.status === 'In Progress').length,
      'Under Review': assignments.filter((a) => a.status === 'Under Review').length,
      'Completed': completed,
      'Overdue': overdue,
    };

    // Subject-wise distribution for Bar chart
    const subjectMap = {};
    assignments.forEach((a) => {
      subjectMap[a.subject] = (subjectMap[a.subject] || 0) + 1;
    });
    const subjectDistribution = Object.keys(subjectMap).map((sub) => ({
      subject: sub,
      count: subjectMap[sub],
    }));

    // Weekly completion trends for Line chart
    // We aggregate completions in the last 4 weeks
    const weeklyTrends = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - (i * 7) - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const completedInWeek = assignments.filter((a) => {
        if (a.status !== 'Completed') return false;
        const compDate = new Date(a.updatedAt);
        return compDate >= startOfWeek && compDate <= endOfWeek;
      }).length;

      const weekLabel = `Wk -${i}`;
      weeklyTrends.push({
        week: i === 0 ? 'This Week' : weekLabel,
        completed: completedInWeek,
      });
    }

    // Productivity calculations
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // On-Time Submission Rate: Completed assignments whose updatedAt is before or equal to their dueDate
    const onTimeSubmissions = assignments.filter((a) => {
      if (a.status !== 'Completed') return false;
      const due = new Date(a.dueDate);
      if (a.dueTime) {
        const [hours, minutes] = a.dueTime.split(':');
        due.setHours(parseInt(hours, 10) || 23, parseInt(minutes, 10) || 59, 59, 999);
      }
      const completeDate = new Date(a.updatedAt);
      return completeDate <= due;
    }).length;

    const onTimeRate = completed > 0 ? Math.round((onTimeSubmissions / completed) * 100) : 100;

    // Average Completion Time (estimated hours vs actual status)
    const totalEstHours = assignments.reduce((acc, a) => acc + (a.estimatedHours || 0), 0);
    const avgCompletionTime = total > 0 ? Math.round(totalEstHours / total) : 0;

    // Aggregate overall productivity score (weighted average of completion rate and on-time rate)
    const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

    // Upcoming deadlines list
    const upcomingDeadlines = assignments
      .filter((a) => a.status !== 'Completed' && a.status !== 'Overdue')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        total,
        completed,
        pending,
        overdue,
        highPriority,
        productivityScore,
        completionRate,
        onTimeRate,
        avgCompletionTime,
        statusDistribution,
        subjectDistribution,
        weeklyTrends,
        upcomingDeadlines,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private
export const createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      subject,
      description,
      dueDate,
      dueTime,
      priority,
      status,
      completionPercentage,
      estimatedHours,
      notes,
    } = req.body;

    if (!title || !subject || !dueDate) {
      res.status(400);
      throw new Error('Title, subject, and due date are required fields.');
    }

    const attachments = [];

    // Handle uploaded file
    if (req.file) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        // Cloudinary Upload
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'studentsphere/assignments',
          });
          attachments.push({
            name: req.file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
          });
          // Remove local temp file
          fs.unlinkSync(req.file.path);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          // Fallback to local storage if Cloudinary upload fails
          const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
          attachments.push({
            name: req.file.originalname,
            url: fileUrl,
          });
        }
      } else {
        // Local upload storage
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        attachments.push({
          name: req.file.originalname,
          url: fileUrl,
        });
      }
    }

    const assignment = await Assignment.create({
      userId: req.user._id,
      title,
      subject,
      description,
      dueDate,
      dueTime,
      priority,
      status: status || 'Not Started',
      completionPercentage: status === 'Completed' ? 100 : (completionPercentage || 0),
      estimatedHours: estimatedHours || 0,
      attachments,
      notes,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    // Cleanup files if error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Update assignment details
// @route   PUT /api/assignments/:id
// @access  Private
export const updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    const {
      title,
      subject,
      description,
      dueDate,
      dueTime,
      priority,
      status,
      completionPercentage,
      estimatedHours,
      notes,
      existingAttachments,
    } = req.body;

    assignment.title = title || assignment.title;
    assignment.subject = subject || assignment.subject;
    assignment.description = description !== undefined ? description : assignment.description;
    assignment.dueDate = dueDate || assignment.dueDate;
    assignment.dueTime = dueTime || assignment.dueTime;
    assignment.priority = priority || assignment.priority;
    
    // Status and progress percentage logic
    if (status) {
      assignment.status = status;
      if (status === 'Completed') {
        assignment.completionPercentage = 100;
      } else if (completionPercentage !== undefined) {
        assignment.completionPercentage = completionPercentage;
      }
    } else if (completionPercentage !== undefined) {
      assignment.completionPercentage = completionPercentage;
      if (parseInt(completionPercentage, 10) === 100) {
        assignment.status = 'Completed';
      }
    }

    assignment.estimatedHours = estimatedHours !== undefined ? estimatedHours : assignment.estimatedHours;
    assignment.notes = notes !== undefined ? notes : assignment.notes;

    // Handle existing attachments parsing (for retaining or deleting)
    if (existingAttachments) {
      const parsedExisting = JSON.parse(existingAttachments);
      
      // Determine which attachments were deleted
      const deletedAttachments = assignment.attachments.filter(
        (orig) => !parsedExisting.some((exist) => exist._id === orig._id.toString())
      );

      // Clean up deleted attachment assets from disk or Cloudinary
      for (const del of deletedAttachments) {
        if (del.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
          try {
            await cloudinary.uploader.destroy(del.publicId);
          } catch (err) {
            console.error('Failed to delete Cloudinary asset:', err);
          }
        } else {
          // Local deletion
          const filename = path.basename(del.url);
          const localPath = path.join('./uploads', filename);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }
      }

      assignment.attachments = parsedExisting;
    }

    // Handle newly uploaded attachment
    if (req.file) {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'auto',
            folder: 'studentsphere/assignments',
          });
          assignment.attachments.push({
            name: req.file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
          });
          fs.unlinkSync(req.file.path);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
          assignment.attachments.push({
            name: req.file.originalname,
            url: fileUrl,
          });
        }
      } else {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        assignment.attachments.push({
          name: req.file.originalname,
          url: fileUrl,
        });
      }
    }

    await assignment.save();
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private
export const deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    // Delete attachment files
    for (const file of assignment.attachments) {
      if (file.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          await cloudinary.uploader.destroy(file.publicId);
        } catch (err) {
          console.error('Failed to destroy Cloudinary file:', err);
        }
      } else {
        const filename = path.basename(file.url);
        const localPath = path.join('./uploads', filename);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    }

    await assignment.deleteOne();

    res.status(200).json({ success: true, message: 'Assignment and its files deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment status
// @route   PATCH /api/assignments/status/:id
// @access  Private
export const patchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400);
      throw new Error('Please provide status');
    }

    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    assignment.status = status;
    if (status === 'Completed') {
      assignment.completionPercentage = 100;
    } else if (status === 'Not Started') {
      assignment.completionPercentage = 0;
    }

    await assignment.save();
    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment priority
// @route   PATCH /api/assignments/priority/:id
// @access  Private
export const patchPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    if (!priority) {
      res.status(400);
      throw new Error('Please provide priority');
    }

    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    assignment.priority = priority;
    await assignment.save();

    res.status(200).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};
