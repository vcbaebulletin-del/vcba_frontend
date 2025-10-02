import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users, BookOpen, Calendar, Award } from 'lucide-react';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import LazyImage from '../components/common/LazyImage';
import { API_BASE_URL } from '../config/constants';

interface WelcomePageData {
  background: {
    id: number;
    background_image: string;
    is_active: boolean;
    created_at: string;
    created_by_name: string;
  };
  cards: WelcomeCard[];
}

interface WelcomeCard {
  id: number;
  title: string;
  description: string;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: studentUser } = useStudentAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  // Dynamic content state
  const [welcomeData, setWelcomeData] = useState<WelcomePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load welcome page data
  const loadWelcomePageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/data`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setWelcomeData(data.data);
      } else {
        setError('Failed to load welcome page data');
        console.error('Failed to load welcome page data:', data.message);
      }
    } catch (err) {
      setError('Failed to load welcome page data');
      console.error('Error loading welcome page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsLoaded(true);
    loadWelcomePageData();

    const handleScroll = () => {
      setScrollY(window.scrollY);
      setHeaderScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStudentLogin = () => {
    // Check if student is already logged in
    if (studentUser) {
      // Redirect to NewsFeed instead of the old dashboard
      navigate('/student/newsfeed');
    } else {
      // Not logged in, go to login page
      navigate('/login');
    }
  };

  // Default fallback features (used when no dynamic data is available)
  const defaultFeatures = [
    {
      icon: <BookOpen size={24} />,
      title: "Academic Excellence",
      description: "Access to quality education and comprehensive learning resources"
    },
    {
      icon: <Users size={24} />,
      title: "Vibrant Community",
      description: "Join a diverse community of students, faculty, and staff"
    },
    {
      icon: <Calendar size={24} />,
      title: "Campus Events",
      description: "Stay updated with the latest announcements and campus activities"
    },
    {
      icon: <Award size={24} />,
      title: "Achievement Recognition",
      description: "Celebrate academic and extracurricular accomplishments"
    }
  ];

  // Use dynamic cards if available, otherwise use default features
  const features = welcomeData?.cards?.length ?
    welcomeData.cards.map(card => ({
      icon: <BookOpen size={24} />, // Default icon for now
      title: card.title,
      description: card.description,
      image: card.image
    })) :
    defaultFeatures.map(feature => ({ ...feature, image: undefined }));

  // Get background image (dynamic or fallback)
  const backgroundImage = welcomeData?.background?.background_image || '/villamor-image/villamor-collge-BG-landscape.jpg';

  // Show loading state
  if (loading) {
    return (
      <div className="welcome-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading welcome page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-page">
      <header className={`page-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="container header-container">
          <div className="header-logo-container">
            <img
              src="/logo/vcba1.png"
              alt="Villamor College of Business and Arts"
              className="header-logo"
            />
            <span className="header-logo-text">Villamor College of Business and Arts, Inc.</span>
          </div>
          <button onClick={handleStudentLogin} className="header-cta-button">
            SIGN IN
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <LazyImage
            src={backgroundImage}
            alt="Villamor College Campus"
            className="hero-image"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
            width={1920}
            height={1080}
            quality={85}
            format="webp"
          />
        </div>
        
        <div className="hero-content">
          <div className="container">
            <div className="hero-inner">

              {/* I will not use this logo for now I comment it */}
              {/* Logo Section */}
              {/* <div className={`logo-section ${isLoaded ? 'animate-fade-in' : ''}`}>
                <img 
                  src="/logo/vcba1.png" 
                  alt="Villamor College of Business and Arts" 
                  className="college-logo"
                />
              </div> */}

              {/* Main Content */}
              <div className={`main-content ${isLoaded ? 'animate-fade-in' : ''}`}>
                <h1 className="hero-title">
                  Welcome to
                  <span className="title-highlight">Villamor College</span>
                  of Business and Arts, Inc.
                </h1>
                
                <p className="hero-subtitle">
                  Your gateway to academic excellence and personal growth. 
                  Stay connected with the latest announcements, events, and opportunities 
                  that shape your educational journey.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-arrow"></div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* Institutional Information Section */}
      <section className="institutional-section">
        <div className="container">
          <div className="institutional-content">
            <h2>About Villamor College of Business and Arts, Inc.</h2>
            <div className="institutional-text">
              <p>
                Villamor College of Business and Arts, Inc. (VCBA) is a private educational institution in General Santos City.
                Established in 2012, VCBA is committed to developing its students into highly-skilled individuals who will
                bring pride to the country and contribute to its overall development.
              </p>
              <p>
                At present, VCBA offers degree programs in Business, Information Technology, Communication, and Criminology.
                Its Senior High School department provides the Academic and Technical-Vocational-Livelihood (TVL) tracks,
                particularly the ABM, GAS, HUMSS, HE, and IA strands. Also available are tech-voc courses in Bookkeeping
                and Refrigeration and Aircon Servicing, both leading to a National Certificate (NC) upon completion and assessment.
              </p>
              <p>
                Villamor College of Business and Arts, Inc. and its programs are duly recognized by the Commission on Higher
                Education (CHED), the Department of Education (DepEd), and the Technical Education and Skills Development
                Authority (TESDA).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className="mission-vision-section">
        <div className="container">
          <div className="mission-vision-content">
            <h2>Our Mission & Vision</h2>
            <div className="mission-vision-image">
              <img
                src="/vcba_images/mission_vision.jpg"
                alt="VCBA Mission and Vision"
                className="mission-vision-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-header">
            <h2>Why Choose Villamor College?</h2>
            <p>Discover what makes our institution a leader in business and arts education</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={welcomeData?.cards?.[index]?.id || index}
                className={`feature-card ${isLoaded ? 'animate-fade-in' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {feature.image ? (
                  <div className="feature-image">
                    <LazyImage
                      src={feature.image}
                      alt={feature.title}
                      width={400}
                      height={400}
                      quality={85}
                      format="webp"
                    />
                  </div>
                ) : (
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                )}
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="final-cta-section">
        <div className="container">
          <div className="final-cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of students who trust Villamor College for their educational journey</p>
            <button 
              onClick={handleStudentLogin}
              className="secondary-cta-button"
            >
              SIGN IN
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .welcome-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 1rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #22c55e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-container p {
          color: #6b7280;
          font-size: 1rem;
        }

        .page-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          padding: 1.5rem 0;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .page-header.scrolled {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 1rem 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-logo-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
          transition: all 0.3s ease;
        }

        .page-header.scrolled .header-logo-text {
          color: white;
        }

        .header-logo {
          height: 50px;
          transition: all 0.3s ease;
        }

        .page-header.scrolled .header-logo {
          height: 40px;
        }

        .header-cta-button {
          background: transparent;
          border: 2px solid white;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }

        .header-cta-button:hover {
          background: white;
          color: #1f2937;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }

        .hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(34, 197, 94, 0.9) 0%,
            rgba(21, 128, 61, 0.8) 50%,
            rgba(20, 83, 45, 0.9) 100%
          );
          z-index: 2;
        }

        .hero-content {
          position: relative;
          z-index: 3;
          width: 100%;
          padding: 2rem 0;
        }

        /* Scroll Indicator */
        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.875rem;
          z-index: 4;
          animation: bounce 2s infinite;
        }

        .scroll-arrow {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          position: relative;
        }

        .scroll-arrow::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          width: 8px;
          height: 8px;
          border-right: 2px solid rgba(255, 255, 255, 0.8);
          border-bottom: 2px solid rgba(255, 255, 255, 0.8);
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .hero-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 3rem;
        }

        /* Logo Section */
        .logo-section {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out;
        }

        .logo-section.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .college-logo {
          height: 120px;
          width: auto;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        /* Main Content */
        .main-content {
          max-width: 800px;
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s ease-out 0.2s;
        }

        .main-content.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .title-highlight {
          display: block;
          color: #fbbf24;
          font-size: 4rem;
          margin: 0.5rem 0;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 3rem;
          line-height: 1.6;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        /* CTA Section */
        .cta-section {
          display: none;
        }

        .cta-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1f2937;
          font-size: 1.125rem;
          font-weight: 600;
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(251, 191, 36, 0.6);
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .cta-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.95rem;
          text-align: center;
          max-width: 400px;
        }

        /* Institutional Section */
        .institutional-section {
          padding: 5rem 0;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          position: relative;
        }

        .institutional-content {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .institutional-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .institutional-text {
          text-align: left;
          line-height: 1.8;
          color: #4b5563;
          font-size: 1.1rem;
        }

        .institutional-text p {
          margin-bottom: 1.5rem;
        }

        /* Mission Vision Section */
        .mission-vision-section {
          padding: 4rem 0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          position: relative;
        }

        .mission-vision-content {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .mission-vision-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mission-vision-image {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
        }

        .mission-vision-img {
          max-width: 100%;
          height: auto;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .mission-vision-img:hover {
          transform: scale(1.02);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        /* Features Section */
        .features-section {
          padding: 6rem 0;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%);
          position: relative;
          overflow: hidden;
        }

        .features-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .features-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .features-header h2 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .features-header p {
          font-size: 1.125rem;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: flex;
          flex-direction: row;
          gap: 2rem;
          margin-top: 3rem;
          max-width: 1600px;
          margin-left: auto;
          margin-right: auto;
          overflow-x: auto;
          padding: 0 1rem;
          scroll-snap-type: x mandatory;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 2.5rem;
          border-radius: 24px;
          text-align: center;
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.12),
            0 1px 0 rgba(255, 255, 255, 0.6) inset;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          transform: translateY(30px);
          position: relative;
          overflow: hidden;
          min-height: 600px;
          min-width: 400px;
          max-width: 450px;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          scroll-snap-align: center;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card.animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.15),
            0 1px 0 rgba(255, 255, 255, 0.6) inset;
          border-color: rgba(34, 197, 94, 0.3);
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: white;
        }

        .feature-image {
          width: 100%;
          aspect-ratio: 1;
          margin: 0 auto 1.5rem;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
          flex-shrink: 0;
        }

        .feature-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .feature-card:hover .feature-image img {
          transform: scale(1.05);
        }

        .feature-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
          line-height: 1.4;
          flex-shrink: 0;
        }

        .feature-description {
          color: #6b7280;
          line-height: 1.7;
          font-size: 1rem;
          flex-grow: 1;
          display: flex;
          align-items: center;
        }

        /* Final CTA Section */
        .final-cta-section {
          padding: 4rem 0;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        }

        .final-cta-content {
          text-align: center;
          color: white;
        }

        .final-cta-content h2 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: white;
        }

        .final-cta-content p {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .secondary-cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          color: #22c55e;
          font-size: 1.125rem;
          font-weight: 600;
          padding: 1rem 2rem;
          border: 2px solid #22c55e;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-cta-button:hover {
          background: #22c55e;
          color: white;
          transform: translateY(-2px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .hero-title {
            font-size: 3rem;
          }

          .title-highlight {
            font-size: 3.5rem;
          }

          .features-grid {
            flex-direction: row;
            gap: 1.5rem;
            overflow-x: auto;
            padding: 0 1rem;
          }

          .feature-card {
            min-width: 350px;
            max-width: 400px;
            min-height: 550px;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }

          .institutional-section {
            padding: 3rem 0;
          }

          .institutional-content h2 {
            font-size: 2rem;
          }

          .institutional-text {
            font-size: 1rem;
          }

          .mission-vision-section {
            padding: 3rem 0;
          }

          .mission-vision-content h2 {
            font-size: 2rem;
          }

          .header-logo-text {
            font-size: 0.9rem;
          }

          .page-header {
            padding: 1rem 0;
          }

          .header-logo {
            height: 40px;
          }

          .header-cta-button {
            font-size: 0.8rem;
            padding: 0.5rem 1rem;
          }

          .hero-inner {
            gap: 2rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .title-highlight {
            font-size: 3rem;
          }

          .hero-subtitle {
            font-size: 1.125rem;
            margin-bottom: 2rem;
          }

          .college-logo {
            height: 80px;
          }

          .features-grid {
            flex-direction: column;
            gap: 2rem;
            overflow-x: visible;
            padding: 0;
          }

          .feature-card {
            min-height: 450px;
            min-width: auto;
            max-width: none;
            padding: 2rem;
            scroll-snap-align: none;
          }

          .features-header h2 {
            font-size: 2rem;
          }

          .final-cta-content h2 {
            font-size: 1.875rem;
          }

          .features-section {
            padding: 4rem 0;
          }

          .final-cta-section {
            padding: 3rem 0;
          }
        }

        @media (max-width: 480px) {
          .header-logo-text {
            font-size: 0.7rem;
          }
          .hero-section {
            min-height: 100vh;
            padding: 1rem 0;
          }

          .hero-inner {
            gap: 1.5rem;
          }

          .hero-title {
            font-size: 2rem;
            line-height: 1.2;
          }

          .title-highlight {
            font-size: 2.5rem;
            margin: 0.25rem 0;
          }

          .hero-subtitle {
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }

          .cta-button {
            font-size: 1rem;
            padding: 0.875rem 1.5rem;
            width: 100%;
            max-width: 280px;
          }

          .college-logo {
            height: 60px;
          }

          .feature-card {
            padding: 1.5rem;
          }

          .features-header {
            margin-bottom: 2rem;
          }

          .features-header h2 {
            font-size: 1.75rem;
          }

          .final-cta-content h2 {
            font-size: 1.5rem;
          }

          .secondary-cta-button {
            width: 100%;
            max-width: 280px;
            justify-content: center;
          }
        }

        @media (max-width: 360px) {
          .hero-title {
            font-size: 1.75rem;
          }

          .title-highlight {
            font-size: 2.25rem;
          }

          .hero-subtitle {
            font-size: 0.95rem;
          }

          .college-logo {
            height: 50px;
          }

          .cta-button {
            font-size: 0.95rem;
            padding: 0.75rem 1.25rem;
          }
        }

        /* Enhanced animations and interactions */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .college-logo {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(251, 191, 36, 0.6); }
        }

        .cta-button {
          animation: pulse 2s ease-in-out infinite;
        }

        .cta-button:hover {
          animation: none;
        }

        /* Improved accessibility */
        @media (prefers-reduced-motion: reduce) {
          .college-logo,
          .cta-button,
          .feature-card,
          .main-content,
          .logo-section {
            animation: none !important;
            transition: none !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .hero-overlay {
            background: rgba(0, 0, 0, 0.8);
          }

          .cta-button {
            border: 2px solid #000;
          }

          .feature-card {
            border: 2px solid #000;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;