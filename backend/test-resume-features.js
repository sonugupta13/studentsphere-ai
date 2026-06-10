import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Resume from './models/Resume.js';
import ResumeAnalytics from './models/ResumeAnalytics.js';
import {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  duplicateResume,
  calculateATS,
  generateAISummary
} from './controllers/resumeController.js';

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
    console.log(`\nStarting Resume Builder Test Suite for User: ${user.fullName} (${user._id})`);

    const reqMock = {
      user,
    };

    // Clean up any existing resumes for this test user
    await ResumeAnalytics.deleteMany({});
    await Resume.deleteMany({ userId: user._id });

    // --- STEP 1: Create Resume Draft ---
    console.log('\n--- Step 1: Creating new resume draft ---');
    const resCreate = makeMockRes();
    const createReq = {
      ...reqMock,
      body: {
        resumeTitle: 'SDE Intern Resume',
        template: 'Modern',
      },
    };

    await createResume(createReq, resCreate, nextMock);
    const createdData = resCreate.jsonData.data;
    const resumeId = createdData.resume._id;
    console.log(`✔ Resume created. Title: "${createdData.resume.resumeTitle}"`);
    console.log(`  Initial Completion: ${createdData.resume.completionPercentage}%`);
    console.log(`  Initial ATS Score: ${createdData.resume.atsScore}%`);
    
    if (createdData.resume.completionPercentage !== 20) { // name, email pre-population
      throw new Error(`Unexpected initial completion percentage. Got: ${createdData.resume.completionPercentage}`);
    }

    // --- STEP 2: Update Profile and Sections ---
    console.log('\n--- Step 2: Updating resume details (Personal Info, Education, Experience, Skills) ---');
    const resUpdate = makeMockRes();
    const updateReq = {
      ...reqMock,
      params: { id: resumeId },
      body: {
        personalInfo: {
          fullName: 'Sanjay Gupta',
          professionalTitle: 'MERN Stack Developer',
          email: 'sanjay@example.com',
          phone: '+9199725658',
          location: 'Delhi, India',
          linkedin: 'https://linkedin.com/in/sanjaygupta',
          github: 'https://github.com/sanjaygupta',
          summary: 'Motivated full stack web developer specializing in MongoDB, Express, React, and Node.js.',
        },
        education: [
          {
            institutionName: 'Delhi Technological University',
            degree: 'Bachelor of Technology',
            branch: 'Computer Science',
            startDate: '2022',
            endDate: '2026',
            cgpa: '9.2',
            description: 'Focused on algorithms, databases, and software design.',
          }
        ],
        experience: [
          {
            companyName: 'TechCorp Solutions',
            jobTitle: 'Backend Development Intern',
            employmentType: 'Internship',
            location: 'Remote',
            startDate: 'May 2024',
            endDate: 'Jul 2024',
            responsibilities: 'Developed and optimized server side REST APIs. Worked extensively with MongoDB and Express to manage core databases.',
            achievements: 'Optimized page load speed by 25% using database indices.',
          }
        ],
        skills: [
          { skillName: 'React', category: 'Technical', rating: 5 },
          { skillName: 'Node.js', category: 'Technical', rating: 5 },
          { skillName: 'Git', category: 'Tools', rating: 4 },
          { skillName: 'Communication', category: 'Soft', rating: 5 },
        ],
        projects: [
          {
            projectName: 'StudentSphere Portal',
            description: 'Created a collaborative student scheduler portal using MERN stack with automated email and analytics gauges.',
            technologiesUsed: ['React', 'Node.js', 'Express', 'MongoDB'],
            githubLink: 'https://github.com/user/studentsphere',
            liveDemoLink: 'https://studentsphere-demo.com',
            startDate: 'Mar 2024',
            endDate: 'Apr 2024',
          }
        ]
      },
    };

    await updateResume(updateReq, resUpdate, nextMock);
    const updatedData = resUpdate.jsonData.data;
    console.log(`✔ Resume updated successfully.`);
    console.log(`  New Completion: ${updatedData.resume.completionPercentage}%`);
    console.log(`  New ATS Score: ${updatedData.resume.atsScore}%`);
    
    if (updatedData.resume.completionPercentage < 80) {
      throw new Error(`Completion percentage should have increased. Got: ${updatedData.resume.completionPercentage}`);
    }

    // --- STEP 3: Verify ATS Audit Breakdown ---
    console.log('\n--- Step 3: Verifying ATS audit breakdown ---');
    const resGetById = makeMockRes();
    const getByIdReq = {
      ...reqMock,
      params: { id: resumeId },
    };

    await getResumeById(getByIdReq, resGetById, nextMock);
    const fetchedData = resGetById.jsonData.data;
    const analytics = fetchedData.analytics;
    console.log(`✔ ATS Score breakdown retrieved:`);
    console.log(`  - Overall ATS Score: ${analytics.atsScore}%`);
    console.log(`  - Keywords Score: ${analytics.keywordScore}%`);
    console.log(`  - Formatting Score: ${analytics.formattingScore}%`);
    console.log(`  - Readability Score: ${analytics.readabilityScore}%`);
    console.log(`  - Total Improvement Suggestions: ${analytics.suggestions.length}`);
    
    analytics.suggestions.forEach((sug, idx) => console.log(`    [Suggestion #${idx + 1}]: ${sug}`));

    if (analytics.atsScore < 70) {
      throw new Error(`Expected higher ATS score for a fully structured draft. Got: ${analytics.atsScore}%`);
    }

    // --- STEP 4: Test Duplicating Draft ---
    console.log('\n--- Step 4: Testing resume duplicating functionality ---');
    const resDuplicate = makeMockRes();
    const duplicateReq = {
      ...reqMock,
      body: {
        resumeId: resumeId,
      },
    };

    await duplicateResume(duplicateReq, resDuplicate, nextMock);
    const duplicatedData = resDuplicate.jsonData.data;
    console.log(`✔ Resume duplicated.`);
    console.log(`  Original Title: "${fetchedData.resume.resumeTitle}"`);
    console.log(`  Duplicated Title: "${duplicatedData.resume.resumeTitle}"`);
    console.log(`  Duplicated ATS Score: ${duplicatedData.resume.atsScore}%`);

    if (duplicatedData.resume.resumeTitle !== `${fetchedData.resume.resumeTitle} (Copy)`) {
      throw new Error('Unexpected duplicated resume title.');
    }

    // Verify duplicated analytics exists
    const duplicatedAnalytics = await ResumeAnalytics.findOne({ resumeId: duplicatedData.resume._id });
    if (!duplicatedAnalytics) {
      throw new Error('Duplicated resume draft does not have matching analytics records.');
    }
    console.log(`✔ Duplicated resume analytics verified in database.`);

    // --- STEP 5: Test AI Summary generation ---
    console.log('\n--- Step 5: Testing AI Summary Writer Suggestions ---');
    const resAI = makeMockRes();
    const aiReq = {
      ...reqMock,
      body: {
        professionalTitle: 'MERN Stack Developer',
      },
    };

    await generateAISummary(aiReq, resAI, nextMock);
    const aiData = resAI.jsonData.data;
    console.log(`✔ AI generated summaries successfully:`);
    aiData.suggestions.forEach((sug, idx) => console.log(`  [Summary Option #${idx + 1}]: ${sug}`));
    
    if (aiData.suggestions.length === 0) {
      throw new Error('No suggestions generated by AI helper.');
    }

    // --- STEP 6: Cascading Deletion Check ---
    console.log('\n--- Step 6: Testing cascading deletions of analytics ---');
    const resDelete = makeMockRes();
    const deleteReq = {
      ...reqMock,
      params: { id: resumeId },
    };

    await deleteResume(deleteReq, resDelete, nextMock);
    console.log(`✔ Delete response: ${resDelete.jsonData.message}`);

    const originalResumeCount = await Resume.countDocuments({ _id: resumeId });
    const originalAnalyticsCount = await ResumeAnalytics.countDocuments({ resumeId: resumeId });
    console.log(`✔ Original resume count in DB: ${originalResumeCount} (Expected: 0)`);
    console.log(`✔ Original resume analytics count in DB: ${originalAnalyticsCount} (Expected: 0)`);

    if (originalResumeCount !== 0 || originalAnalyticsCount !== 0) {
      throw new Error('Cascading deletion of Resume draft or ResumeAnalytics failed.');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL RESUME BUILDER CRUD, ATS & DUPLICATION TESTS SUCCESSFUL!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Resume Builder Test Suite Failed:', error.message);
    process.exit(1);
  }
};

runSuite();
