import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { fetchFeaturedReviews } from '../redux/slices/reviewSlice';

export const TestimonialsCarousel = () => {
  const dispatch = useDispatch();
  const { featuredReviews, loading } = useSelector((state) => state.reviews);

  useEffect(() => {
    dispatch(fetchFeaturedReviews());
  }, [dispatch]);

  // Duplicating reviews list for infinite scroll effect
  const carouselReviews = [...featuredReviews, ...featuredReviews];

  // Inline CSS for the marquee animation
  const marqueeStyles = `
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .carousel-container {
      overflow: hidden;
      width: 100%;
      position: relative;
    }
    .carousel-track {
      display: flex;
      width: max-content;
      animation: marquee 35s linear infinite;
    }
    .carousel-track:hover {
      animation-play-state: paused;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px border rgba(255, 255, 255, 0.25);
    }
    .dark .glass-card {
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px border rgba(255, 255, 255, 0.05);
    }
  `;

  if (loading && featuredReviews.length === 0) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (featuredReviews.length === 0) {
    return null; // Don't show if there are no featured reviews
  }

  return (
    <div className="space-y-10">
      <style dangerouslySetInnerHTML={{ __html: marqueeStyles }} />
      
      {/* Title block */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-3xl font-extrabold font-outfit text-slate-900 dark:text-white">
          What Students Say ❤️
        </h2>
        <p className="text-sm text-slate-550 dark:text-slate-450 leading-normal font-medium">
          Genuine feedback from verified students active in our ecosystem.
        </p>
      </div>

      {/* Marquee Track */}
      <div className="carousel-container relative py-4">
        {/* Shadow gradients overlays to fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950 z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent dark:to-transparent dark:from-slate-950 z-10 pointer-events-none" />

        <div className="carousel-track gap-6 px-4">
          {carouselReviews.map((review, idx) => (
            <div
              key={`${review._id}-${idx}`}
              className="glass-card w-80 sm:w-96 p-6 rounded-3xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between border border-slate-200/50 dark:border-slate-800/50 flex-shrink-0 cursor-pointer"
            >
              <div>
                {/* Stars */}
                <div className="flex gap-0.5 text-amber-500 mb-3.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= review.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-800'}`}
                    />
                  ))}
                </div>

                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  "{review.title}"
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed font-medium">
                  {review.description}
                </p>
              </div>

              {/* Author metadata */}
              <div className="flex items-center gap-3.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <img
                  src={review.userId?.avatar || `https://ui-avatars.com/api/?name=Student&background=random`}
                  alt={review.isAnonymous ? 'Anonymous' : review.userId?.fullName || 'Student'}
                  className="h-10 w-10 rounded-full border border-slate-150 dark:border-slate-800 object-cover"
                />
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    {review.isAnonymous ? 'Anonymous Student' : review.userId?.fullName || 'Student'}
                  </h5>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Verified Student
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <Link
          to="/reviews"
          className="inline-flex items-center gap-2 px-6 py-3 border border-indigo-100 hover:border-indigo-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl text-sm font-bold text-indigo-650 dark:text-indigo-400 transition-all"
        >
          <span>View All Reviews</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    </div>
  );
};

export default TestimonialsCarousel;
