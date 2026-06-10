import Resume from '../models/Resume.js';
import ResumeAnalytics from '../models/ResumeAnalytics.js';

// Helper: Calculate completion percentage
const calculateCompletion = (resume) => {
  let score = 0;
  const personalInfo = resume.personalInfo || {};
  if (personalInfo.fullName) score += 10;
  if (personalInfo.professionalTitle) score += 10;
  if (personalInfo.email) score += 10;
  if (personalInfo.phone) score += 10;
  if (personalInfo.summary) score += 10;
  
  if (resume.education && resume.education.length > 0) score += 15;
  if (resume.skills && resume.skills.length > 0) score += 15;
  if (resume.projects && resume.projects.length > 0) score += 10;
  if (resume.experience && resume.experience.length > 0) score += 10;
  
  return Math.min(100, score);
};

// Helper: Analyze Resume for ATS score
const analyzeResumeATS = (resume) => {
  let keywordScore = 0;
  let formattingScore = 0;
  let readabilityScore = 0;
  const suggestions = [];

  // 1. Keyword Score
  const keywords = [
    'react', 'node', 'javascript', 'python', 'java', 'sql', 'mongodb', 'git', 'docker', 'aws', 
    'html', 'css', 'redux', 'express', 'rest api', 'agile', 'scrum', 'developed', 'designed', 
    'optimized', 'implemented', 'led', 'managed', 'typescript', 'tailwind', 'bootstrap'
  ];
  let foundKeywords = 0;
  
  // Aggregate all text for keyword scan
  let allText = '';
  if (resume.personalInfo) {
    allText += ' ' + (resume.personalInfo.summary || '');
    allText += ' ' + (resume.personalInfo.professionalTitle || '');
  }
  
  if (resume.skills) {
    resume.skills.forEach(s => {
      allText += ' ' + (s.skillName || '') + ' ' + (s.category || '');
    });
  }
  
  if (resume.projects) {
    resume.projects.forEach(p => {
      allText += ' ' + (p.projectName || '') + ' ' + (p.description || '') + ' ' + (p.technologiesUsed || []).join(' ');
    });
  }
  
  if (resume.experience) {
    resume.experience.forEach(e => {
      allText += ' ' + (e.jobTitle || '') + ' ' + (e.responsibilities || '') + ' ' + (e.achievements || '');
    });
  }

  const cleanText = allText.toLowerCase();
  keywords.forEach(kw => {
    if (cleanText.includes(kw)) {
      foundKeywords++;
    }
  });

  keywordScore = Math.min(100, Math.round((foundKeywords / 8) * 100));
  if (keywordScore < 50) {
    suggestions.push('Add more industry-standard technical keywords like frameworks, tools, or libraries (e.g. React, Node, SQL).');
  }

  // 2. Formatting Score
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s-]{10,}$/;

  const info = resume.personalInfo || {};
  if (info.email && emailRegex.test(info.email)) formattingScore += 20;
  else suggestions.push('Please include a valid email address.');

  if (info.phone && phoneRegex.test(info.phone)) formattingScore += 20;
  else suggestions.push('Include a valid phone number with area code.');

  if (info.location) formattingScore += 20;
  else suggestions.push('Add your city, state or country under location.');

  if (info.linkedin && info.linkedin.includes('linkedin.com')) formattingScore += 20;
  else suggestions.push('Link your professional LinkedIn profile.');

  if (info.github && info.github.includes('github.com')) formattingScore += 20;
  else suggestions.push('Add your GitHub profile link to showcase your repositories.');

  // 3. Readability Score
  let readScoreAccum = 0;
  const summaryWords = info.summary ? info.summary.split(/\s+/).filter(Boolean).length : 0;
  if (summaryWords >= 20 && summaryWords <= 80) {
    readScoreAccum += 30;
  } else if (summaryWords > 0) {
    readScoreAccum += 15;
    suggestions.push('Maintain professional summary length between 20 to 80 words for recruiters.');
  } else {
    suggestions.push('Write a short, engaging professional summary.');
  }

  if (resume.experience && resume.experience.length > 0) {
    let validExp = true;
    resume.experience.forEach(exp => {
      const respWords = exp.responsibilities ? exp.responsibilities.split(/\s+/).filter(Boolean).length : 0;
      if (respWords < 15) validExp = false;
    });
    if (validExp) readScoreAccum += 35;
    else {
      readScoreAccum += 15;
      suggestions.push('Elaborate your role responsibilities with detail (at least 15 words per entry).');
    }
  } else {
    suggestions.push('Add at least one relevant internship or job experience.');
  }

  if (resume.projects && resume.projects.length > 0) {
    let validProj = true;
    resume.projects.forEach(proj => {
      const descWords = proj.description ? proj.description.split(/\s+/).filter(Boolean).length : 0;
      if (descWords < 10) validProj = false;
    });
    if (validProj) readScoreAccum += 35;
    else {
      readScoreAccum += 15;
      suggestions.push('Describe the technology stack and impact in your project details.');
    }
  } else {
    suggestions.push('Include at least one development or research project.');
  }
  
  readabilityScore = Math.min(100, readScoreAccum);

  // Overall ATS score formula
  const atsScore = Math.round((keywordScore * 0.4) + (formattingScore * 0.3) + (readabilityScore * 0.3));

  return {
    atsScore,
    keywordScore,
    formattingScore,
    readabilityScore,
    suggestions
  };
};

// @desc    Get all user resume drafts
// @route   GET /api/resumes
// @access  Private
export const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: resumes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific resume by ID
// @route   GET /api/resumes/:id
// @access  Private
export const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error('Resume draft not found.');
    }

    // Try finding analytics
    let analytics = await ResumeAnalytics.findOne({ resumeId: resume._id });
    if (!analytics) {
      const breakdown = analyzeResumeATS(resume);
      analytics = await ResumeAnalytics.create({
        resumeId: resume._id,
        ...breakdown,
      });
      resume.atsScore = breakdown.atsScore;
      await resume.save();
    }

    res.status(200).json({
      success: true,
      data: {
        resume,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new resume draft
// @route   POST /api/resumes
// @access  Private
export const createResume = async (req, res, next) => {
  const { resumeTitle, template } = req.body;

  try {
    const defaultInfo = {
      fullName: req.user.fullName || '',
      email: req.user.email || '',
      phone: '',
      location: '',
      professionalTitle: '',
      github: '',
      linkedin: '',
      portfolio: '',
      summary: '',
    };

    const resume = await Resume.create({
      userId: req.user._id,
      resumeTitle: resumeTitle || 'My Resume',
      template: template || 'Modern',
      personalInfo: defaultInfo,
      education: [],
      skills: [],
      projects: [],
      experience: [],
      certifications: [],
      achievements: [],
      completionPercentage: 10, // Base default filled name/email
      atsScore: 0,
    });

    const breakdown = analyzeResumeATS(resume);
    const analytics = await ResumeAnalytics.create({
      resumeId: resume._id,
      ...breakdown,
    });

    resume.atsScore = breakdown.atsScore;
    resume.completionPercentage = calculateCompletion(resume);
    await resume.save();

    res.status(201).json({
      success: true,
      data: {
        resume,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update resume details
// @route   PUT /api/resumes/:id
// @access  Private
export const updateResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error('Resume draft not found.');
    }

    const fieldsToUpdate = [
      'resumeTitle', 'template', 'personalInfo', 'education', 
      'skills', 'projects', 'experience', 'certifications', 'achievements'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        resume[field] = req.body[field];
      }
    });

    // Recalculate metrics
    resume.completionPercentage = calculateCompletion(resume);
    const breakdown = analyzeResumeATS(resume);
    resume.atsScore = breakdown.atsScore;

    await resume.save();

    // Update analytics
    let analytics = await ResumeAnalytics.findOne({ resumeId: resume._id });
    if (analytics) {
      analytics.atsScore = breakdown.atsScore;
      analytics.keywordScore = breakdown.keywordScore;
      analytics.formattingScore = breakdown.formattingScore;
      analytics.readabilityScore = breakdown.readabilityScore;
      analytics.suggestions = breakdown.suggestions;
      await analytics.save();
    } else {
      analytics = await ResumeAnalytics.create({
        resumeId: resume._id,
        ...breakdown,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        resume,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a resume draft
// @route   DELETE /api/resumes/:id
// @access  Private
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error('Resume draft not found.');
    }

    // Cascade delete analytics
    await ResumeAnalytics.deleteOne({ resumeId: resume._id });
    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume draft deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate a resume draft
// @route   POST /api/resumes/duplicate
// @access  Private
export const duplicateResume = async (req, res, next) => {
  const { resumeId } = req.body;

  try {
    const sourceResume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!sourceResume) {
      res.status(404);
      throw new Error('Source resume draft not found.');
    }

    // Clone source fields
    const duplicatedResume = await Resume.create({
      userId: req.user._id,
      resumeTitle: `${sourceResume.resumeTitle} (Copy)`,
      template: sourceResume.template,
      personalInfo: sourceResume.personalInfo,
      education: sourceResume.education,
      skills: sourceResume.skills,
      projects: sourceResume.projects,
      experience: sourceResume.experience,
      certifications: sourceResume.certifications,
      achievements: sourceResume.achievements,
      completionPercentage: sourceResume.completionPercentage,
      atsScore: sourceResume.atsScore,
    });

    // Copy analytics
    const sourceAnalytics = await ResumeAnalytics.findOne({ resumeId: sourceResume._id });
    const suggestions = sourceAnalytics ? sourceAnalytics.suggestions : [];
    
    const analytics = await ResumeAnalytics.create({
      resumeId: duplicatedResume._id,
      atsScore: sourceResume.atsScore,
      keywordScore: sourceAnalytics ? sourceAnalytics.keywordScore : 0,
      formattingScore: sourceAnalytics ? sourceAnalytics.formattingScore : 0,
      readabilityScore: sourceAnalytics ? sourceAnalytics.readabilityScore : 0,
      suggestions,
    });

    res.status(201).json({
      success: true,
      data: {
        resume: duplicatedResume,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate ATS score on the fly
// @route   POST /api/resumes/ats-score
// @access  Private
export const calculateATS = async (req, res, next) => {
  const { resumeId } = req.body;

  try {
    const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });
    if (!resume) {
      res.status(404);
      throw new Error('Resume not found.');
    }

    const breakdown = analyzeResumeATS(resume);

    // Save update
    resume.atsScore = breakdown.atsScore;
    await resume.save();

    const analytics = await ResumeAnalytics.findOneAndUpdate(
      { resumeId: resume._id },
      { $set: breakdown },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      data: {
        atsScore: breakdown.atsScore,
        analytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI professional summaries and improvements
// @route   POST /api/resumes/ai-summary
// @access  Private
export const generateAISummary = async (req, res, next) => {
  const { professionalTitle, keywords } = req.body;

  try {
    if (!professionalTitle) {
      res.status(400);
      throw new Error('Please provide a professional title for custom summary suggestions.');
    }

    const titleLower = professionalTitle.toLowerCase();
    let suggestions = [];

    if (titleLower.includes('front') || titleLower.includes('react') || titleLower.includes('web')) {
      suggestions = [
        'Detail-oriented Frontend Developer with 2+ years of experience building responsive, user-focused web applications with React, Redux, and Tailwind CSS. Proven track record of optimizing page speeds and collaborating effectively with designer teams.',
        'Aspiring Web Developer passionate about creating beautiful, accessible, and high-performance user interfaces. Skilled in JavaScript (ES6+), React.js, and responsive web layouts, with a focus on writing clean, scalable codebase.',
        'React Developer with deep expertise in state management, functional components, and third-party REST API integrations. Highly analytical problem-solver dedicated to code quality, automated testing, and modern frontend development standard.'
      ];
    } else if (titleLower.includes('back') || titleLower.includes('node') || titleLower.includes('python') || titleLower.includes('software')) {
      suggestions = [
        'Highly skilled Software Engineer specializing in backend architecture, microservices, and database optimization. Experienced in Node.js, Express, and MongoDB, with a focus on designing secure, scalable APIs and server components.',
        'Backend Developer with a strong foundation in database design, algorithms, and cloud integration. Efficient in Python, SQL, and Git, with hands-on experience building REST APIs and handling async task queues.',
        'Results-driven Software Engineer with extensive experience developing scalable web servers and system integrations. Skilled in testing, debugging, and deploying Node/Express services to AWS.'
      ];
    } else if (titleLower.includes('full') || titleLower.includes('stack') || titleLower.includes('mern')) {
      suggestions = [
        'Versatile MERN Stack Developer skilled in building end-to-end web systems from relational/non-relational database design to dynamic React frontends. Competent in handling state management, API routes, and cloud deployment.',
        'Full Stack Engineer with a passion for clean architecture and developer productivity. Expert in Javascript, React, Node, Express, MongoDB, and Git, with a track record of launching three production-ready web platforms.',
        'Dynamic Full Stack Developer experienced in developing high-availability applications. Skilled in React hooks, REST APIs, middleware auth, and performance tuning for databases.'
      ];
    } else if (titleLower.includes('data') || titleLower.includes('analyst') || titleLower.includes('scientist')) {
      suggestions = [
        'Data Scientist with strong expertise in statistical modeling, machine learning algorithms, and predictive modeling. Skilled in Python, R, SQL, and Pandas, with a focus on translating data trends into business insights.',
        'Analytical Data Analyst experienced in cleaning, aggregating, and visualizing complex datasets using Python, SQL, and Tableau. Dedicated to optimizing decision-making processes through metric reporting.',
        'Machine Learning Engineer with experience deploying deep learning models. Proficient in PyTorch, TensorFlow, and SQL databases, with a passion for designing smart intelligence systems.'
      ];
    } else {
      // Fallback general recommendations
      suggestions = [
        `Ambitious ${professionalTitle} eager to contribute strong technical skills and dedication to a forward-thinking engineering team. Fast learner skilled in collaborative coding, unit testing, and problem solving.`,
        `Detail-driven ${professionalTitle} with a passion for software design and customer satisfaction. Proactive collaborator focused on implementing clean, reusable components and meeting project milestones.`,
        `Results-oriented ${professionalTitle} with experience in design patterns, version control, and modular development. Committed to delivering high-quality solutions and continuous skills development.`
      ];
    }

    res.status(200).json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};
