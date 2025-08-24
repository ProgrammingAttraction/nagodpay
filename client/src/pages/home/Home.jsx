import React, { useState, useEffect, useRef } from 'react';
import { 
  FaCreditCard, FaExchangeAlt, FaMoneyBillWave, FaShieldAlt, FaGlobe, 
  FaMobileAlt, FaLock, FaUserShield, FaChartLine, FaComments, FaPhone, 
  FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaCheckCircle, FaStar,
  FaUsers, FaRocket, FaHandHoldingUsd, FaPiggyBank, FaCog, FaServer,
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram
} from 'react-icons/fa';
import { FiArrowRight, FiCheck, FiSend } from 'react-icons/fi';
import { MdPayment, MdSecurity, MdSupportAgent } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const homeRef = useRef(null);
  const servicesRef = useRef(null);
  const pricingRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Intersection Observer for scroll animations and active section
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all sections
    const sections = [homeRef, servicesRef, pricingRef, aboutRef, contactRef];
    sections.forEach(section => {
      if (section.current) {
        sectionObserver.observe(section.current);
      }
    });

    // Animation observer
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeIn');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      animationObserver.observe(el);
    });

    return () => {
      sectionObserver.disconnect();
      animationObserver.disconnect();
    };
  }, []);

  const scrollToSection = (sectionRef) => {
    window.scrollTo({
      top: sectionRef.current.offsetTop - 80,
      behavior: 'smooth'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form submission logic would go here
    console.log('Form submitted:', formData);
    setFormSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  const isActive = (section) => activeSection === section ? 'text-indigo-400' : 'hover:text-indigo-400';

  return (
    <div className="min-h-screen font-anek bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 md:px-12 sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 bg-opacity-95 backdrop-blur-md shadow-md border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
            <FaShieldAlt className="text-white text-xl" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
            NagodPay
          </span>
        </div>
        
        <div className="hidden md:flex space-x-8">
          <button 
            onClick={() => scrollToSection(homeRef)} 
            className={`transition-colors duration-300 ${isActive('home')}`}
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection(servicesRef)} 
            className={`transition-colors duration-300 ${isActive('services')}`}
          >
            Services
          </button>
          <button 
            onClick={() => scrollToSection(pricingRef)} 
            className={`transition-colors duration-300 ${isActive('pricing')}`}
          >
            Pricing
          </button>
          <button 
            onClick={() => scrollToSection(aboutRef)} 
            className={`transition-colors duration-300 ${isActive('about')}`}
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection(contactRef)} 
            className={`transition-colors duration-300 ${isActive('contact')}`}
          >
            Contact
          </button>
        </div>
        
        <div className="flex space-x-4">
          <NavLink to="/login" className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 transition-all duration-300 shadow-md">
            Login
          </NavLink>
          <NavLink to="/registration" className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md shadow-indigo-500/30">
            Sign Up
          </NavLink>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={homeRef} id="home" className={`px-6 py-16 md:py-24 md:px-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Secure <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 animate-pulse">Payment Solutions</span> for Everyone
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              NagodPay offers seamless P2P, P2C, and bank transfer solutions with top-notch security and lightning-fast processing.
            </p>
            <div className="flex flex-wrap gap-4">
              <NavLink to="/registration" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg font-medium flex items-center transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-indigo-500/30">
                Get Started <FiArrowRight className="ml-2" />
              </NavLink>
              <button onClick={() => scrollToSection(servicesRef)} className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-md">
                Learn More
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-soft-light filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-soft-light filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 bg-opacity-80 backdrop-blur-md rounded-2xl p-8 border border-gray-700 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-2 shadow-sm shadow-red-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2 shadow-sm shadow-yellow-400/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm shadow-green-400/50"></div>
                </div>
                <div className="text-sm text-gray-400">nagodpay.com/secure</div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-2">
                    <FaCreditCard className="text-indigo-400 mr-2" />
                    <span className="font-medium">P2P Transfers</span>
                  </div>
                  <p className="text-sm text-gray-400">Send money to anyone, anywhere instantly</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-2">
                    <FaExchangeAlt className="text-indigo-400 mr-2" />
                    <span className="font-medium">P2C Payments</span>
                  </div>
                  <p className="text-sm text-gray-400">Pay businesses and services securely</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center mb-2">
                    <FaMoneyBillWave className="text-indigo-400 mr-2" />
                    <span className="font-medium">Bank Transfers</span>
                  </div>
                  <p className="text-sm text-gray-400">Connect directly to your bank accounts</p>
                </div>
              </div>
              
              <div className="mt-8 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-lg p-4 text-center border border-indigo-700/50">
                <div className="flex items-center justify-center">
                  <FaLock className="text-indigo-400 mr-2" />
                  <span className="text-sm">256-bit encryption | PCI DSS compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section ref={servicesRef} id="services" className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">Our Services</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">Comprehensive payment solutions tailored to your needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-2 animate-on-scroll opacity-0 translate-y-10"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex items-center justify-center mb-4 text-indigo-400 text-xl">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-400 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start text-sm text-gray-300">
                      <FiCheck className="text-indigo-400 mt-1 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/30 to-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">Why Choose NagodPay?</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">We provide cutting-edge payment solutions with security and convenience in mind</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-2 animate-on-scroll opacity-0 translate-y-10"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex items-center justify-center mb-4 text-indigo-400 text-xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} id="pricing" className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">No hidden fees. No contracts. No surprises.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-br rounded-xl p-8 border transition-all duration-500 animate-on-scroll opacity-0 ${
                  plan.featured 
                    ? 'from-indigo-900/70 to-purple-900/70 border-indigo-700 transform hover:-translate-y-3 scale-105' 
                    : 'from-gray-800/70 to-gray-900/70 border-gray-700 transform hover:-translate-y-2'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {plan.featured && (
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold uppercase px-4 py-1 rounded-full inline-block mb-6">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/{plan.interval}</span>
                </div>
                <p className="text-gray-300 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <FiCheck className="text-indigo-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 rounded-lg font-medium transition-all duration-300 ${
                  plan.featured 
                    ? 'bg-gradient-to-r from-white to-gray-100 text-gray-900 hover:from-gray-100 hover:to-gray-200 shadow-lg' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/30'
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/30 to-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">Supported Payment Methods</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">We support a wide range of payment options to suit your needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paymentMethods.map((method, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-500 animate-on-scroll opacity-0"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-900/40 to-purple-900/40 mb-6 mx-auto">
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{method.title}</h3>
                <ul className="space-y-3">
                  {method.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <FiCheck className="text-indigo-400 mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} id="about" className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">About NagodPay</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">Our mission is to make financial transactions simple, secure, and accessible to everyone</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-on-scroll opacity-0">
              <h3 className="text-2xl font-semibold mb-6">Our Story</h3>
              <p className="text-gray-300 mb-4">
                Founded in 2018, NagodPay was created with a simple vision: to revolutionize the way people handle 
                digital payments. We noticed that existing solutions were either too complex, too expensive, or lacked 
                the security features that modern users demand.
              </p>
              <p className="text-gray-300 mb-4">
                Today, we serve over 2 million customers worldwide, processing billions of dollars in transactions 
                annually. Our team of financial experts and engineers work tirelessly to ensure that our platform 
                remains at the forefront of payment technology.
              </p>
              <p className="text-gray-300">
                We believe that everyone should have access to fast, secure, and affordable financial services, 
                regardless of where they are or how much they earn. This belief drives everything we do.
              </p>
            </div>
            
            <div className="animate-on-scroll opacity-0">
              <div className="grid grid-cols-2 gap-6">
                {aboutStats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md rounded-xl p-6 text-center border border-gray-700 hover:border-indigo-500 transition-all duration-300"
                  >
                    <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md rounded-xl p-6 text-center border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-2 animate-on-scroll opacity-0"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/30 to-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">What Our Customers Say</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">Join thousands of satisfied users worldwide</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-gray-800/70 to-gray-900/70 backdrop-blur-md rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-all duration-300 transform hover:-translate-y-2 animate-on-scroll opacity-0 translate-y-10"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`text-yellow-400 ${i < testimonial.rating ? 'opacity-100' : 'opacity-30'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} id="contact" className="py-16 px-6 md:px-12 bg-gradient-to-br from-gray-900/50 to-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-on-scroll opacity-0">Get In Touch</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12 animate-on-scroll opacity-0">Have questions? We'd love to hear from you</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-on-scroll opacity-0">
              <h3 className="text-2xl font-semibold mb-6">Send us a message</h3>
              
              {formSubmitted ? (
                <div className="bg-gradient-to-r from-green-900/40 to-green-800/40 border border-green-700 rounded-xl p-8 text-center">
                  <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
                  <h4 className="text-xl font-semibold mb-2">Message Sent Successfully!</h4>
                  <p className="text-gray-300">We'll get back to you as soon as possible.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-300 mb-2">Your Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-gray-300 mb-2">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="5"
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center shadow-lg shadow-indigo-500/30"
                  >
                    Send Message <FiSend className="ml-2" />
                  </button>
                </form>
              )}
            </div>
            
            <div className="animate-on-scroll opacity-0">
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex items-center justify-center text-indigo-400 mr-4 flex-shrink-0">
                    <FaPhone className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Phone</h4>
                    <p className="text-gray-300">+1 (555) 123-4567</p>
                    <p className="text-gray-400 text-sm">Mon-Fri from 8am to 6pm</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex items-center justify-center text-indigo-400 mr-4 flex-shrink-0">
                    <FaEnvelope className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <p className="text-gray-300">support@nagodpay.com</p>
                    <p className="text-gray-400 text-sm">Send us a message anytime</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex items-center justify-center text-indigo-400 mr-4 flex-shrink-0">
                    <FaMapMarkerAlt className="text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Office</h4>
                    <p className="text-gray-300">123 Finance Street</p>
                    <p className="text-gray-300">San Francisco, CA 94103</p>
                    <p className="text-gray-400 text-sm">Visit us by appointment</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-800/50">
                <h4 className="font-semibold mb-2 flex items-center">
                  <MdSupportAgent className="text-indigo-400 mr-2" /> Support Hours
                </h4>
                <p className="text-gray-300">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="text-gray-300">Saturday: 10:00 AM - 4:00 PM</p>
                <p className="text-gray-300">Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-r from-indigo-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-on-scroll opacity-0">Ready to get started with NagodPay?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto animate-on-scroll opacity-0">Join thousands of satisfied users who trust NagodPay for their payment needs</p>
          <div className="flex flex-wrap justify-center gap-4 animate-on-scroll opacity-0">
            <NavLink to="/registration" className="px-6 py-3 bg-gradient-to-r from-white to-gray-100 text-gray-900 rounded-lg font-medium hover:from-gray-100 hover:to-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
              Create Account
            </NavLink>
            <button onClick={() => scrollToSection(contactRef)} className="px-6 py-3 bg-transparent border border-white text-white rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-all duration-300 transform hover:-translate-y-1">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-800 pt-12 pb-6 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="animate-on-scroll opacity-0">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
                  <FaShieldAlt className="text-white text-xl" />
                </div>
                <span className="text-xl font-bold">NagodPay</span>
              </div>
              <p className="text-gray-400 mb-4">Secure payment solutions for individuals and businesses.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 transform hover:-translate-y-1">
                  <FaFacebook className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 transform hover:-translate-y-1">
                  <FaTwitter className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 transform hover:-translate-y-1">
                  <FaLinkedin className="text-xl" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300 transform hover:-translate-y-1">
                  <FaInstagram className="text-xl" />
                </a>
              </div>
            </div>
            
            <div className="animate-on-scroll opacity-0" style={{ transitionDelay: '100ms' }}>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">P2P Transfers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">P2C Payments</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Bank Transfers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">International Payments</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Merchant Services</a></li>
              </ul>
            </div>
            
            <div className="animate-on-scroll opacity-0" style={{ transitionDelay: '200ms' }}>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Contact</a></li>
              </ul>
            </div>
            
            <div className="animate-on-scroll opacity-0" style={{ transitionDelay: '300ms' }}>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} NagodPay. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">Terms</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">Security</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors duration-300">Help Center</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const services = [
  {
    icon: <FaCreditCard />,
    title: "P2P Money Transfers",
    description: "Send money to friends and family instantly with just their email or phone number.",
    features: [
      "Instant transfers",
      "No recipient account needed",
      "Low fees",
      "24/7 availability"
    ]
  },
  {
    icon: <FaExchangeAlt />,
    title: "Business Payments",
    description: "Accept payments from customers worldwide with our secure merchant solutions.",
    features: [
      "Multiple payment methods",
      "Recurring billing",
      "Invoice management",
      "Advanced reporting"
    ]
  },
  {
    icon: <FaMoneyBillWave />,
    title: "Bank Transfers",
    description: "Connect your bank accounts for seamless transfers between banks and NagodPay.",
    features: [
      "Fast transfers",
      "Multiple currency support",
      "Scheduled transfers",
      "Secure encryption"
    ]
  },
  {
    icon: <FaGlobe />,
    title: "International Payments",
    description: "Send and receive money across borders with competitive exchange rates.",
    features: [
      "150+ countries",
      "Low exchange fees",
      "Tracking system",
      "Multi-currency wallets"
    ]
  },
  {
    icon: <FaShieldAlt />,
    title: "Security Services",
    description: "Advanced security features to protect your transactions and personal information.",
    features: [
      "Two-factor authentication",
      "Fraud detection",
      "Encrypted data",
      "Purchase protection"
    ]
  },
  {
    icon: <FaMobileAlt />,
    title: "Mobile Solutions",
    description: "Complete payment solutions optimized for mobile devices and apps.",
    features: [
      "Mobile wallet",
      "QR code payments",
      "Touch/Face ID",
      "Offline capabilities"
    ]
  }
];

const features = [
  {
    icon: <FaShieldAlt />,
    title: "Military-grade Security",
    description: "Your transactions are protected with bank-level encryption and multi-factor authentication."
  },
  {
    icon: <FaExchangeAlt />,
    title: "Instant Transfers",
    description: "Send and receive money in seconds, not days, with our advanced processing technology."
  },
  {
    icon: <FaGlobe />,
    title: "Global Reach",
    description: "Make payments to over 100 countries with competitive exchange rates and low fees."
  },
  {
    icon: <FaUserShield />,
    title: "User Protection",
    description: "24/7 fraud monitoring and purchase protection on all eligible transactions."
  },
  {
    icon: <FaChartLine />,
    title: "Low Fees",
    description: "Enjoy some of the lowest transaction fees in the industry with transparent pricing."
  },
  {
    icon: <FaMobileAlt />,
    title: "Mobile App",
    description: "Manage your payments on the go with our intuitive mobile application."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    price: "0",
    interval: "month",
    description: "Perfect for individuals and casual users",
    features: [
      "Up to $1,000 monthly transfers",
      "Basic P2P transfers",
      "Standard security",
      "Email support",
      "1.5% transaction fee"
    ],
    featured: false
  },
  {
    name: "Professional",
    price: "9.99",
    interval: "month",
    description: "Ideal for frequent users and small businesses",
    features: [
      "Up to $10,000 monthly transfers",
      "P2P and P2C transfers",
      "Advanced security features",
      "Priority support",
      "0.9% transaction fee",
      "Multi-currency support"
    ],
    featured: true
  },
  {
    name: "Enterprise",
    price: "29.99",
    interval: "month",
    description: "For businesses with high volume needs",
    features: [
      "Unlimited transfers",
      "All payment types",
      "Premium security suite",
      "24/7 dedicated support",
      "0.5% transaction fee",
      "Multi-currency support",
      "API access",
      "Custom solutions"
    ],
    featured: false
  }
];

const paymentMethods = [
  {
    icon: <FaCreditCard className="text-indigo-400 text-2xl" />,
    title: "P2P Transfers",
    features: [
      "Send money to friends & family",
      "Instant notification system",
      "No hidden fees",
      "24/7 availability"
    ]
  },
  {
    icon: <FaExchangeAlt className="text-indigo-400 text-2xl" />,
    title: "P2C Payments",
    features: [
      "Pay merchants securely",
      "One-click checkout",
      "Purchase protection",
      "Detailed transaction history"
    ]
  },
  {
    icon: <FaMoneyBillWave className="text-indigo-400 text-2xl" />,
    title: "Bank Transfers",
    features: [
      "Connect multiple bank accounts",
      "Schedule recurring payments",
      "International transfers",
      "Real-time tracking"
    ]
  }
];

const stats = [
  { value: "2M+", label: "Active Users" },
  { value: "100+", label: "Countries" },
  { value: "$10B+", label: "Processed" },
  { value: "24/7", label: "Support" }
];

const aboutStats = [
  { value: "2018", label: "Founded In" },
  { value: "150+", label: "Employees" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "Rating" }
];

const testimonials = [
  {
    text: "NagodPay has revolutionized how I handle my business transactions. The security features give me peace of mind.",
    name: "Sarah Johnson",
    role: "Small Business Owner",
    rating: 5
  },
  {
    text: "I've tried many payment platforms, but NagodPay's user interface and speed are unmatched. Highly recommended!",
    name: "Michael Chen",
    role: "Freelancer",
    rating: 5
  },
  {
    text: "The customer support team is exceptional. They resolved my issue within minutes of my contacting them.",
    name: "Emma Rodriguez",
    role: "Online Seller",
    rating: 4
  }
];

export default Home;