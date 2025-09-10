import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create cart context for this component
const PremiumCartContext = createContext();

const PremiumCartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <PremiumCartContext.Provider value={{ cartItems, addToCart, getTotalItems }}>
      {children}
    </PremiumCartContext.Provider>
  );
};

const usePremiumCart = () => {
  const context = useContext(PremiumCartContext);
  if (!context) {
    throw new Error('usePremiumCart must be used within PremiumCartProvider');
  }
  return context;
};

const PremiumStorefront = () => {
  const { addToCart, getTotalItems } = usePremiumCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Auto-play video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API}/products`);
      const data = await response.json();
      setProducts(data.filter(p => p.status === 'active' && p.stock_quantity > 0));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Products', icon: '🏆' },
    { id: 'Sports Apparel', name: 'Sports Apparel', icon: '👕' },
    { id: 'Apparel', name: 'Apparel', icon: '🧥' },
    { id: 'accessories', name: 'Accessories', icon: '🧢' },
    { id: 'equipment', name: 'Equipment', icon: '⚽' }
  ];

  const heroSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d',
      title: 'STEP INTO',
      subtitle: 'GREATNESS',
      description: 'Premium Tampa Bay sports merchandise that embodies the spirit of champions.',
      cta: 'SHOP COLLECTION'
    },
    {
      id: 2, 
      image: 'https://images.unsplash.com/photo-1671759938110-786b3ff559ef',
      title: 'DEFINE YOUR',
      subtitle: 'LEGACY',
      description: 'Where performance meets passion. Gear up like a champion.',
      cta: 'EXPLORE NOW'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1721009714209-aec1e65ce196',
      title: 'CHAMPION',
      subtitle: 'MINDSET',
      description: 'Premium athletic wear designed for the moments that matter most.',
      cta: 'GET YOURS'
    }
  ];

  const guaranteeFeatures = [
    {
      icon: '🚚',
      title: 'Lightning Fast Delivery',
      description: 'Free shipping on orders over $50. Get your gear in record time.'
    },
    {
      icon: '💎',
      title: 'Premium Quality',
      description: 'Only the best products make it to our store. Championship standards.'
    },
    {
      icon: '🔒',
      title: 'Secure Payment',
      description: 'Your payment information is safe with military-grade security.'
    },
    {
      icon: '🛡️',
      title: 'Free Returns',
      description: 'Within 30 days for an exchange. No questions asked.'
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Mike Rodriguez',
      profession: 'Sports Fan',
      rating: 5,
      text: 'The quality is incredible! These jerseys feel like what the pros wear. Definitely my go-to for Tampa Bay gear.',
      avatar: '👨‍💼'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      profession: 'Athletic Trainer',
      rating: 5,
      text: 'Best athletic wear I\'ve found. The materials are top-notch and the fit is perfect. Highly recommend!',
      avatar: '👩‍⚕️'
    },
    {
      id: 3,
      name: 'Chris Martinez',
      profession: 'Coach',
      rating: 5,
      text: 'Our entire team orders from here. Fast shipping, great prices, and quality that lasts season after season.',
      avatar: '👨‍🏫'
    }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleAddToCart = (product) => {
    addToCart(product);
    // Add subtle animation or notification here
  };

  const getProductTypeIcon = (type) => {
    const icons = {
      affiliate: '🎯',
      print_on_demand: '🎨',
      physical: '📦',
      digital: '💿'
    };
    return icons[type] || '📋';
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      {/* Premium Header - Updated from Shopify themes */}
      <header className="relative z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo - Inspired by Debutify theme */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">TB</span>
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold tracking-tight">
                  TAMPABAY<span className="text-blue-400">MERCH</span>
                </h1>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Premium Sports Collection</p>
              </div>
            </div>

            {/* Navigation - Mega menu style from themes */}
            <nav className="hidden lg:flex items-center space-x-8">
              <a href="#products" className="text-white hover:text-blue-400 font-medium transition-colors">PRODUCTS</a>
              <a href="#collections" className="text-white hover:text-blue-400 font-medium transition-colors">COLLECTIONS</a>
              <a href="#fanzone" className="text-white hover:text-blue-400 font-medium transition-colors">FAN ZONE</a>
              <a href="#about" className="text-white hover:text-blue-400 font-medium transition-colors">ABOUT</a>
              <a href="#contact" className="text-white hover:text-blue-400 font-medium transition-colors">CONTACT</a>
            </nav>

            {/* Cart & Actions */}
            <div className="flex items-center space-x-4">
              <button className="relative p-3 text-white hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="relative p-3 text-white hover:text-blue-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cinematic Hero Slideshow - Combined from both themes */}
      <section className="relative h-screen overflow-hidden">
        {/* Slideshow Container */}
        <div className="relative w-full h-full">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Background Image */}
              <div 
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url('${slide.image}')`
                }}
              />
              
              {/* Slide Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-5xl mx-auto px-4">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <p className="text-blue-400 text-xl font-medium uppercase tracking-widest">
                        Latest Collection
                      </p>
                      <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight">
                        {slide.title}
                        <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                          {slide.subtitle}
                        </span>
                      </h1>
                      <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                      <button 
                        onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
                        className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                      >
                        <span className="relative z-10">{slide.cta}</span>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
                      </button>
                      
                      <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 hover:border-white/50 transition-all duration-300">
                        WATCH STORY
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slideshow Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-8 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8">
          <div className="flex flex-col items-center space-y-2 text-white/60">
            <span className="text-sm uppercase tracking-wider">Scroll</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section - From Debutify theme pattern */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {guaranteeFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scrolling Banner - From themes */}
      <section className="py-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="overflow-hidden">
          <div className="flex animate-scroll whitespace-nowrap">
            <span className="text-white font-bold text-lg mx-8">★ FREE SHIPPING ON ORDERS OVER $50</span>
            <span className="text-white font-bold text-lg mx-8">★ SUBSCRIBE AND GET 10% OFF YOUR FIRST PURCHASE</span>
            <span className="text-white font-bold text-lg mx-8">★ SAFE SHOPPING — PAY LATER WITH KLARNA</span>
            <span className="text-white font-bold text-lg mx-8">★ 30-DAY FREE RETURNS</span>
          </div>
        </div>
      </section>

      {/* Category Navigation - Enhanced */}
      <section className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid - Enhanced from themes */}
      <section id="products" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-lg font-medium uppercase tracking-wider mb-4">Best Selling</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              PREMIUM COLLECTION
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Here's some of our most popular products people are in love with. 
              Championship-quality gear for true fans.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-4">No Products Available</h3>
              <p className="text-gray-400">Check back soon for amazing new arrivals!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group relative">
                  {/* Product Card - Enhanced from Shopify themes */}
                  <div className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all duration-500 hover:transform hover:scale-105">
                    {/* Product Type Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        <span>{getProductTypeIcon(product.product_type)}</span>
                        <span className="uppercase">{product.product_type?.replace('_', ' ')}</span>
                      </span>
                    </div>

                    {/* Sale Badge - From Debutify theme */}
                    {product.cost < product.price && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          SALE
                        </span>
                      </div>
                    )}

                    {/* Product Image */}
                    <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center relative overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="text-6xl text-gray-500 group-hover:scale-110 transition-transform duration-700">
                          📦
                        </div>
                      )}
                      {/* Quick View Overlay - From themes */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                          Quick View
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      {/* Rating - From themes */}
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 1l3 6 6 1-4.5 4.5L16 19l-6-3-6 3 1.5-6.5L1 8l6-1 3-6z"/>
                          </svg>
                        ))}
                        <span className="text-gray-400 text-sm ml-2">(5.0)</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-2xl font-bold text-white">
                              ${product.price.toFixed(2)}
                            </div>
                            {product.cost < product.price && (
                              <div className="text-lg text-gray-400 line-through">
                                ${(product.price * 1.3).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.stock_quantity} in stock
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock_quantity === 0}
                          className="group/btn relative px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                        >
                          <span className="relative z-10">
                            {product.stock_quantity === 0 ? 'SOLD OUT' : 'ADD TO CART'}
                          </span>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 blur-xl" />
                        </button>
                      </div>

                      {/* Additional Product Details */}
                      {product.category && (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Category:</span>
                          <span className="text-blue-400">{product.category}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All Button - From themes */}
          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105">
              VIEW ALL PRODUCTS
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section - From themes */}
      <section className="py-20 bg-gradient-to-r from-gray-900/50 to-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-lg font-medium uppercase tracking-wider mb-4">Customer Say!</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              WHAT CHAMPIONS SAY
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Customers love our products and we always strive to please them all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 1l3 6 6 1-4.5 4.5L16 19l-6-3-6 3 1.5-6.5L1 8l6-1 3-6z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-gray-400 text-sm">{testimonial.profession}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fan Zone - Instagram style from themes */}
      <section id="fanzone" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-lg font-medium uppercase tracking-wider mb-4">Fan Zone</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              INSPIRE & BE INSPIRED
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              From one unique fashion to another. Join our community of champions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl overflow-hidden group cursor-pointer">
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-4xl">📸</div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105">
              FOLLOW @TAMPABAYMERCH
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced from themes */}
      <footer className="bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">TB</span>
                </div>
                <div>
                  <h3 className="text-white text-2xl font-bold">TAMPABAYMERCH</h3>
                  <p className="text-gray-400 text-sm">Premium Sports Collection</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Premium Tampa Bay sports merchandise that embodies the spirit of champions. 
                Where performance meets passion.
              </p>
              <div className="flex space-x-4">
                {['📘', '📷', '🐦', '📺'].map((icon, index) => (
                  <button key={index} className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors duration-300">
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-6">QUICK LINKS</h4>
              <ul className="space-y-3">
                {['Products', 'Collections', 'Fan Zone', 'About Us', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Care */}
            <div>
              <h4 className="text-white font-bold mb-6">CUSTOMER CARE</h4>
              <ul className="space-y-3">
                {['Shipping Info', 'Returns', 'Size Guide', 'Track Order', 'Support'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 TampaBay Merch. Engineered for champions, built for legends. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add animation CSS */}
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

const PremiumStorefrontWithProvider = () => {
  return (
    <PremiumCartProvider>
      <PremiumStorefront />
    </PremiumCartProvider>
  );
};

export default PremiumStorefrontWithProvider;