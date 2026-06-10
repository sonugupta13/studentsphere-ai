import React from 'react';

export const ResumeTemplates = ({ data, template = 'Modern', zoom = 1.0 }) => {
  if (!data) return <div className="text-slate-400 dark:text-slate-500 text-center py-10">No resume data found</div>;

  const {
    personalInfo = {},
    education = [],
    skills = [],
    projects = [],
    experience = [],
    certifications = [],
    achievements = []
  } = data;

  // Render Skills by category helper
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'Technical';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  // Print-specific media styles to guarantee beautiful, editable vector PDF output
  const printStyles = `
    @media print {
      body {
        background: white !important;
        color: black !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .resume-print-container {
        width: 100% !important;
        margin: 0 !important;
        padding: 1.5cm !important;
        box-shadow: none !important;
        border: none !important;
        transform: none !important;
        background: white !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
      .section-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;

  // Render Template: Modern
  const renderModern = () => (
    <div className="text-slate-800 font-sans flex flex-col gap-6 text-[14px] leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-indigo-600 pb-4 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-900 tracking-tight">{personalInfo.fullName || 'Name Placeholder'}</h1>
          <p className="text-lg font-medium text-indigo-600 mt-1">{personalInfo.professionalTitle || 'Professional Title'}</p>
        </div>
        <div className="flex flex-col text-right text-xs text-slate-600 gap-1 mt-1">
          {personalInfo.email && <div>✉ {personalInfo.email}</div>}
          {personalInfo.phone && <div>☎ {personalInfo.phone}</div>}
          {personalInfo.location && <div>📍 {personalInfo.location}</div>}
          {personalInfo.linkedin && (
            <div>
              🔗 <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{personalInfo.linkedin.replace(/https?:\/\/(www\.)?/, '')}</a>
            </div>
          )}
          {personalInfo.github && (
            <div>
              github.com/ <a href={personalInfo.github} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{personalInfo.github.replace(/https?:\/\/(www\.)?github\.com\//, '')}</a>
            </div>
          )}
          {personalInfo.portfolio && (
            <div>
              🌐 <a href={personalInfo.portfolio} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{personalInfo.portfolio.replace(/https?:\/\/(www\.)?/, '')}</a>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="section-block border-l-4 border-indigo-600 pl-4 py-1 italic bg-indigo-50/50 rounded-r-md">
          {personalInfo.summary}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left main columns (Experience, Projects, Education) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Work Experience */}
          {experience.length > 0 && (
            <div className="section-block flex flex-col gap-3">
              <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1">Experience</h2>
              <div className="flex flex-col gap-4">
                {experience.map((exp, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900">{exp.jobTitle}</h3>
                      <span className="text-xs text-slate-500 font-semibold">{exp.startDate} - {exp.endDate || 'Present'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-indigo-600 font-medium">
                      <span>{exp.companyName} • {exp.employmentType}</span>
                      <span>{exp.location}</span>
                    </div>
                    {exp.responsibilities && (
                      <p className="text-xs text-slate-700 mt-1 whitespace-pre-line">{exp.responsibilities}</p>
                    )}
                    {exp.achievements && (
                      <div className="text-xs text-slate-700 mt-1 pl-4 list-disc">
                        <span className="font-semibold text-slate-800">Key Achievement: </span>
                        {exp.achievements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <div className="section-block flex flex-col gap-3">
              <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1">Projects</h2>
              <div className="flex flex-col gap-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900">{proj.projectName}</h3>
                      <span className="text-xs text-slate-500 font-semibold">{proj.startDate} - {proj.endDate}</span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line">{proj.description}</p>
                    {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {proj.technologiesUsed.map((tech, tIdx) => (
                          <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{tech}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 mt-1 text-[11px]">
                      {proj.githubLink && (
                        <a href={proj.githubLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">GitHub</a>
                      )}
                      {proj.liveDemoLink && (
                        <a href={proj.liveDemoLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Live Demo</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="section-block flex flex-col gap-3">
              <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1">Education</h2>
              <div className="flex flex-col gap-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900">{edu.degree} {edu.branch ? `in ${edu.branch}` : ''}</h3>
                      <span className="text-xs text-slate-500 font-semibold">{edu.startDate} - {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{edu.institutionName} {edu.university ? `(${edu.university})` : ''}</span>
                      {edu.cgpa && <span className="font-bold text-indigo-600">GPA/Marks: {edu.cgpa}</span>}
                    </div>
                    {edu.description && (
                      <p className="text-xs text-slate-600 mt-1">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right side columns (Skills, Certifications, Achievements) */}
        <div className="flex flex-col gap-6">
          {/* Skills with rating stars */}
          {skills.length > 0 && (
            <div className="section-block flex flex-col gap-3">
              <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1">Skills</h2>
              <div className="flex flex-col gap-3">
                {Object.keys(skillsByCategory).map((cat, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat}</h3>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {skillsByCategory[cat].map((s, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800">{s.skillName}</span>
                          <div className="flex gap-0.5 text-indigo-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={star <= s.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="section-block flex flex-col gap-3">
              <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1">Certifications</h2>
              <div className="flex flex-col gap-2">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="text-xs flex flex-col gap-0.5">
                    <div className="font-bold text-slate-900">{cert.name}</div>
                    <div className="text-slate-600">{cert.organization}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{cert.issueDate} {cert.expiryDate ? `- ${cert.expiryDate}` : ''}</div>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-[10px] truncate max-w-full">View Credential</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="section-block flex flex-col gap-3">
              <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wide border-b border-indigo-200 pb-1">Achievements</h2>
              <ul className="text-xs list-disc pl-4 flex flex-col gap-1.5 text-slate-700">
                {achievements.filter(Boolean).map((ach, idx) => (
                  <li key={idx}>{ach}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Template: Professional
  const renderProfessional = () => (
    <div className="text-slate-900 font-serif flex flex-col gap-5 text-[13.5px] leading-relaxed">
      {/* Header Centered */}
      <div className="text-center flex flex-col gap-1.5 border-b border-slate-300 pb-4">
        <h1 className="text-3xl font-bold tracking-wide text-slate-800">{personalInfo.fullName || 'Name Placeholder'}</h1>
        <p className="text-sm font-medium uppercase tracking-widest text-slate-600">{personalInfo.professionalTitle || 'Professional Title'}</p>
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo.location && <span>• {personalInfo.location}</span>}
          {personalInfo.linkedin && (
            <span>
              • <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-slate-800 hover:underline">LinkedIn</a>
            </span>
          )}
          {personalInfo.github && (
            <span>
              • <a href={personalInfo.github} target="_blank" rel="noreferrer" className="text-slate-800 hover:underline">GitHub</a>
            </span>
          )}
          {personalInfo.portfolio && (
            <span>
              • <a href={personalInfo.portfolio} target="_blank" rel="noreferrer" className="text-slate-800 hover:underline">Portfolio</a>
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="section-block text-justify text-xs text-slate-800">
          {personalInfo.summary}
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="section-block flex flex-col gap-2">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5">Professional Experience</h2>
          <div className="flex flex-col gap-4">
            {experience.map((exp, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-start font-bold">
                  <span>{exp.jobTitle} - <span className="font-semibold italic text-slate-700">{exp.companyName}</span></span>
                  <span className="text-xs font-semibold">{exp.startDate} – {exp.endDate || 'Present'}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 italic mt-0.5">
                  <span>{exp.location}</span>
                  <span>{exp.employmentType}</span>
                </div>
                {exp.responsibilities && (
                  <p className="text-xs text-slate-800 mt-1.5 whitespace-pre-line text-justify leading-relaxed">{exp.responsibilities}</p>
                )}
                {exp.achievements && (
                  <p className="text-xs text-slate-800 mt-1 pl-3 border-l border-slate-300 italic">
                    <strong className="text-slate-700">Achievement: </strong>{exp.achievements}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="section-block flex flex-col gap-2">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5">Projects</h2>
          <div className="flex flex-col gap-4">
            {projects.map((proj, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-start font-bold">
                  <span>{proj.projectName}</span>
                  <span className="text-xs font-semibold">{proj.startDate} – {proj.endDate}</span>
                </div>
                <p className="text-xs text-slate-800 mt-1 whitespace-pre-line text-justify">{proj.description}</p>
                {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                  <div className="text-[11px] text-slate-600 mt-1">
                    <strong>Technologies:</strong> {proj.technologiesUsed.join(', ')}
                  </div>
                )}
                <div className="flex gap-3 mt-1 text-[11px]">
                  {proj.githubLink && (
                    <a href={proj.githubLink} target="_blank" rel="noreferrer" className="text-slate-700 underline">Code Link</a>
                  )}
                  {proj.liveDemoLink && (
                    <a href={proj.liveDemoLink} target="_blank" rel="noreferrer" className="text-slate-700 underline">Demo Link</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="section-block flex flex-col gap-2">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5">Education</h2>
          <div className="flex flex-col gap-3">
            {education.map((edu, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between items-start font-bold">
                  <span>{edu.degree} {edu.branch ? `in ${edu.branch}` : ''}</span>
                  <span className="text-xs font-semibold">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-700 mt-0.5">
                  <span>{edu.institutionName} {edu.university ? `| ${edu.university}` : ''}</span>
                  {edu.cgpa && <span className="font-bold">GPA: {edu.cgpa}</span>}
                </div>
                {edu.description && (
                  <p className="text-xs text-slate-600 mt-1 italic">{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Grouped */}
      {skills.length > 0 && (
        <div className="section-block flex flex-col gap-2">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-slate-800 border-b border-slate-400 pb-0.5">Skills Profile</h2>
          <div className="flex flex-col gap-1.5 text-xs">
            {Object.keys(skillsByCategory).map((cat, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2">
                <span className="col-span-2 font-bold text-slate-700">{cat}:</span>
                <span className="col-span-4 text-slate-800">
                  {skillsByCategory[cat].map(s => s.skillName).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications and Achievements */}
      {(certifications.length > 0 || achievements.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 section-block">
          {certifications.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-0.5">Certifications</h3>
              <div className="flex flex-col gap-1.5 mt-1">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="text-xs">
                    <span className="font-bold text-slate-800">{cert.name}</span> – <span className="text-slate-600">{cert.organization}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {achievements.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-800 uppercase tracking-wide text-xs border-b border-slate-300 pb-0.5">Achievements</h3>
              <ul className="text-xs list-disc pl-4 flex flex-col gap-1 mt-1 text-slate-700">
                {achievements.filter(Boolean).map((ach, idx) => (
                  <li key={idx}>{ach}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render Template: ATS Friendly (Strictly Single Column, Standard Sans Fonts, Plain Lines)
  const renderATSFriendly = () => (
    <div className="text-black font-sans flex flex-col gap-4 text-[13px] leading-relaxed">
      {/* Header Left-aligned */}
      <div className="flex flex-col border-b border-black pb-2">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black">{personalInfo.fullName || 'Name Placeholder'}</h1>
        <p className="text-sm font-semibold italic text-slate-800 mt-0.5">{personalInfo.professionalTitle || 'Professional Title'}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-black mt-1">
          {personalInfo.email && <span>Email: {personalInfo.email}</span>}
          {personalInfo.phone && <span>| Phone: {personalInfo.phone}</span>}
          {personalInfo.location && <span>| Location: {personalInfo.location}</span>}
          {personalInfo.linkedin && (
            <span>| LinkedIn: <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="text-black underline">{personalInfo.linkedin}</a></span>
          )}
          {personalInfo.github && (
            <span>| GitHub: <a href={personalInfo.github} target="_blank" rel="noreferrer" className="text-black underline">{personalInfo.github}</a></span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="section-block text-xs">
          {personalInfo.summary}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="section-block flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5">Education</h2>
          <div className="flex flex-col gap-2">
            {education.map((edu, idx) => (
              <div key={idx} className="flex flex-col text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{edu.degree} {edu.branch ? `in ${edu.branch}` : ''} - {edu.institutionName}</span>
                  <span>{edu.startDate} - {edu.endDate}</span>
                </div>
                <div className="flex justify-between text-slate-700 italic">
                  <span>{edu.university || ''}</span>
                  {edu.cgpa && <span className="font-semibold not-italic">CGPA/Percentage: {edu.cgpa}</span>}
                </div>
                {edu.description && <p className="mt-0.5 text-slate-700">{edu.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="section-block flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5">Professional Experience</h2>
          <div className="flex flex-col gap-3">
            {experience.map((exp, idx) => (
              <div key={idx} className="flex flex-col text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{exp.jobTitle} | {exp.companyName} ({exp.employmentType})</span>
                  <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
                </div>
                <div className="text-[11px] text-slate-600 italic">{exp.location}</div>
                {exp.responsibilities && (
                  <p className="mt-1 whitespace-pre-line text-slate-800 leading-normal">{exp.responsibilities}</p>
                )}
                {exp.achievements && (
                  <div className="mt-0.5 pl-3 list-disc text-slate-800">
                    <strong>Major Outcome:</strong> {exp.achievements}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="section-block flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5">Technical Projects</h2>
          <div className="flex flex-col gap-3">
            {projects.map((proj, idx) => (
              <div key={idx} className="flex flex-col text-xs">
                <div className="flex justify-between font-semibold">
                  <span>{proj.projectName}</span>
                  <span>{proj.startDate} - {proj.endDate}</span>
                </div>
                <p className="mt-1 text-slate-800 whitespace-pre-line">{proj.description}</p>
                {proj.technologiesUsed && proj.technologiesUsed.length > 0 && (
                  <div className="mt-1 text-slate-600 font-semibold text-[11px]">
                    Technologies Used: {proj.technologiesUsed.join(', ')}
                  </div>
                )}
                <div className="flex gap-2 mt-0.5 text-[11px]">
                  {proj.githubLink && <span>Source: {proj.githubLink}</span>}
                  {proj.liveDemoLink && <span>| Demo: {proj.liveDemoLink}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="section-block flex flex-col gap-1">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5">Skills</h2>
          <div className="flex flex-col gap-1 text-xs">
            {Object.keys(skillsByCategory).map((cat, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="font-bold min-w-[120px]">{cat}:</span>
                <span>{skillsByCategory[cat].map(s => s.skillName).join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications and Achievements */}
      {(certifications.length > 0 || achievements.length > 0) && (
        <div className="section-block flex flex-col gap-2">
          <h2 className="text-sm font-bold uppercase border-b border-black pb-0.5">Certifications & Achievements</h2>
          <div className="flex flex-col gap-1 text-xs">
            {certifications.map((cert, idx) => (
              <div key={idx}>
                • <strong>{cert.name}</strong> - {cert.organization} ({cert.issueDate})
              </div>
            ))}
            {achievements.filter(Boolean).map((ach, idx) => (
              <div key={idx}>
                • {ach}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden p-2 flex justify-center items-start">
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div
        className="resume-print-container bg-white w-full max-w-[21cm] min-h-[29.7cm] shadow-lg border border-slate-200 dark:border-slate-800 rounded-md p-8 md:p-12 transition-transform duration-200"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          marginBottom: zoom < 1.0 ? `calc(-29.7cm * ${1 - zoom})` : '0px',
        }}
      >
        {template === 'Professional'
          ? renderProfessional()
          : template === 'ATS Friendly'
            ? renderATSFriendly()
            : renderModern()}
      </div>
    </div>
  );
};
