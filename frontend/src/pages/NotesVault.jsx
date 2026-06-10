import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, Download, FileText, Search,
  Filter, PlusCircle, Trash2, Eye, X, BookOpen, Database, FolderPlus
} from 'lucide-react';

// Redux thunks
import { 
  fetchNotes, fetchNoteSubjects, uploadNote, deleteNote, clearNotesError
} from '../redux/slices/noteSlice';
import { fetchAttendance } from '../redux/slices/attendanceSlice';

import Toast from '../components/Toast';

export const NotesVault = () => {
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activePreviewNote, setActivePreviewNote] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Form states (Add Note)
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Redux Selectors
  const { notes, subjects: noteCategories, loading, error } = useSelector((state) => state.notes);
  const { subjects: attendanceSubjects } = useSelector((state) => state.attendance);

  // Load initial data
  useEffect(() => {
    dispatch(fetchNotes({ search, subject: subjectFilter }));
    dispatch(fetchNoteSubjects());
    dispatch(fetchAttendance());
  }, [dispatch, search, subjectFilter]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: 'error' });
      dispatch(clearNotesError());
    }
  }, [error, dispatch]);

  const handleShowToast = (message, type) => {
    setToast({ message, type });
  };

  const handleOpenUploadModal = () => {
    setTitle('');
    // Default subject choice to attendance courses if exists
    setSubject(attendanceSubjects[0]?.subjectName || noteCategories[0] || '');
    setDescription('');
    setFile(null);
    setIsCustomCategory(attendanceSubjects.length === 0 && noteCategories.length === 0);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        handleShowToast('Only PDF files are allowed', 'error');
        e.target.value = ''; // Clear input
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !subject || !file) {
      handleShowToast('Please fill in all fields and select a PDF file', 'error');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('file', file);

    dispatch(uploadNote(formData)).then((res) => {
      setSubmitting(false);
      if (!res.error) {
        handleShowToast('Notes uploaded successfully!', 'success');
        setIsModalOpen(false);
      }
    });
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Are you sure you want to delete this notes document?')) {
      dispatch(deleteNote(id)).then((res) => {
        if (!res.error) {
          handleShowToast('Note document deleted successfully', 'success');
        }
      });
    }
  };

  const handlePreview = (note) => {
    setActivePreviewNote(note);
    setIsPreviewOpen(true);
  };

  // Calculations
  const totalNotes = notes.length;
  const totalSize = notes.reduce((acc, n) => acc + (n.fileSize || 0), 0);
  const sizeFormatted = (totalSize / (1024 * 1024)).toFixed(2); // Convert to MB

  // Union of attendance subject categories and distinct note categories
  const categoriesList = Array.from(new Set([
    ...attendanceSubjects.map(s => s.subjectName),
    ...noteCategories
  ]));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-slate-800 dark:text-slate-100 pb-12">
      {/* Navbar header */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Notes Vault</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        
        {/* Title and actions banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">Library Vault</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Store, search, and download reference PDF notes grouped by academic courses.
            </p>
          </div>

          <button
            onClick={handleOpenUploadModal}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all shadow-sm gap-1.5"
          >
            <FolderPlus className="h-4.5 w-4.5" />
            <span>Upload Notes</span>
          </button>
        </div>

        {/* Stats aggregate cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-indigo-50 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total PDF Notes</p>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-0.5">{totalNotes} Documents</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Categories</p>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-0.5">{noteCategories.length} Subjects</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Space Consumed</p>
              <h3 className="text-2xl font-extrabold font-outfit text-slate-900 dark:text-white mt-0.5">{sizeFormatted} MB</h3>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by note title, keyword, subject..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="relative w-full sm:w-56 flex items-center gap-1">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="block w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-indigo-500"
            >
              <option value="">All Subject Categories</option>
              {noteCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              {loading ? 'Fetching notes from vault...' : 'No notes documents uploaded yet. Click "Upload Notes" to add.'}
            </div>
          ) : (
            notes.map((note) => {
              const uploadDate = new Date(note.createdAt).toLocaleDateString();
              const sizeMB = ((note.fileSize || 0) / (1024 * 1024)).toFixed(2);
              
              return (
                <div 
                  key={note._id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.01] transition-all"
                >
                  <div>
                    {/* Header: PDF icon and Subject Tag */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl">
                        <FileText className="h-6 w-6" />
                      </div>
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400">
                        {note.subject}
                      </span>
                    </div>

                    {/* Title & info */}
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-4 line-clamp-1">{note.title}</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Uploaded: {uploadDate} | Size: {sizeMB} MB</p>
                    
                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3.5 line-clamp-2 h-8 leading-relaxed">
                      {note.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
                    <button
                      onClick={() => handlePreview(note)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                      title="Preview PDF"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Read Note</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={note.fileUrl}
                        download={note.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
                        title="Download file"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteNote(note._id)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-500 hover:bg-rose-50 hover:border-rose-100 dark:hover:bg-rose-950/20 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ================================== UPLOAD MODAL ================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold font-outfit text-slate-900 dark:text-white">Upload PDF Notes</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Note Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  placeholder="e.g. Relational Algebra cheat sheet"
                />
              </div>

              {/* Subject Category dropdown/custom */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Subject Category *</label>
                  {categoriesList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        setSubject(isCustomCategory ? (categoriesList[0] || '') : '');
                      }}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {isCustomCategory ? 'Select Existing Category' : 'Enter Custom Category'}
                    </button>
                  )}
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                    placeholder="e.g. Distributed Computing"
                  />
                ) : (
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                  >
                    {categoriesList.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all resize-none"
                  placeholder="e.g. Contains joins, cartesian products, and projection rules..."
                />
              </div>

              {/* PDF file picker */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">PDF File * (Max 15MB)</label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-800 dark:file:text-indigo-400"
                  accept="application/pdf"
                />
                {file && (
                  <p className="text-[10px] text-emerald-500 font-bold mt-1">
                    Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 transition-all gap-2 items-center"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <PlusCircle className="h-4.5 w-4.5" />
                      <span>Upload Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================== PDF PREVIEW OVERLAY MODAL ================================== */}
      {isPreviewOpen && activePreviewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-5xl h-[85vh] shadow-2xl relative flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">{activePreviewNote.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Category: {activePreviewNote.subject} | Size: {((activePreviewNote.fileSize || 0) / (1024 * 1024)).toFixed(2)} MB</p>
              </div>

              <div className="flex gap-2.5">
                <a
                  href={activePreviewNote.fileUrl}
                  download={activePreviewNote.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center p-2 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  title="Download notes file"
                >
                  <Download className="h-4.5 w-4.5" />
                </a>

                <button
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setActivePreviewNote(null);
                  }}
                  className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Document IFrame body */}
            <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
              <iframe 
                src={activePreviewNote.fileUrl} 
                className="w-full h-full rounded-2xl" 
                title={activePreviewNote.title}
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default NotesVault;
