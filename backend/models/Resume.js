import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resumeTitle: {
      type: String,
      default: 'My Resume',
      trim: true,
    },
    template: {
      type: String,
      enum: ['Modern', 'Professional', 'ATS Friendly'],
      default: 'Modern',
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      professionalTitle: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      portfolio: { type: String, default: '' },
      summary: { type: String, default: '' },
    },
    education: [
      {
        institutionName: { type: String, default: '' },
        degree: { type: String, default: '' },
        branch: { type: String, default: '' },
        university: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        cgpa: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    skills: [
      {
        skillName: { type: String, default: '' },
        category: {
          type: String,
          enum: ['Technical', 'Soft', 'Tools'],
          default: 'Technical',
        },
        rating: { type: Number, min: 1, max: 5, default: 5 },
      },
    ],
    projects: [
      {
        projectName: { type: String, default: '' },
        description: { type: String, default: '' },
        technologiesUsed: [{ type: String }],
        githubLink: { type: String, default: '' },
        liveDemoLink: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
      },
    ],
    experience: [
      {
        companyName: { type: String, default: '' },
        jobTitle: { type: String, default: '' },
        employmentType: {
          type: String,
          enum: ['Internship', 'Full Time', 'Part Time', 'Freelance', 'Volunteer'],
          default: 'Internship',
        },
        location: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        responsibilities: { type: String, default: '' },
        achievements: { type: String, default: '' },
      },
    ],
    certifications: [
      {
        name: { type: String, default: '' },
        organization: { type: String, default: '' },
        issueDate: { type: String, default: '' },
        expiryDate: { type: String, default: '' },
        credentialId: { type: String, default: '' },
        credentialUrl: { type: String, default: '' },
      },
    ],
    achievements: [{ type: String }],
    atsScore: {
      type: Number,
      default: 0,
    },
    completionPercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
