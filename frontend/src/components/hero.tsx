'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play, PoundSterling, Shield, Leaf, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Hero() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <>
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background - Static image on mobile, video on desktop */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Mobile: Static Image */}
        <div className="block sm:hidden w-full h-full">
          <img 
            src="/images/courses/flannery training 2 .webp"
            alt="Flannery Plant Hire Training"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        
        {/* Desktop: Video */}
        <div className="hidden sm:block w-full h-full">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/CchXaaoS2fc?autoplay=1&mute=1&loop=1&playlist=CchXaaoS2fc&controls=0&showinfo=0&rel=0&modestbranding=1&start=0" 
            title="Flannery Plant Hire - A Summary" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="w-full h-full object-cover"
            loading="eager"
          ></iframe>
        </div>
        
        {/* Enhanced overlay for better readability */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/30"></div>
      </div>
      
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main Headline - Larger and simplified */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 leading-tight" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.7)'}}>
              Welcome to the Operator Skills Hub
            </h1>
            
            {/* Tagline - Larger and more prominent */}
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white mb-8 md:mb-12 max-w-4xl mx-auto font-semibold px-4" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.7)'}}>
              Transforming ambition into expertise
            </p>
            
            {/* Call to Action Buttons - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center px-4">
              <Button 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 w-full sm:w-auto"
                onClick={() => {
                  document.getElementById('featured-courses')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                FIND A COURSE
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-black hover:bg-white hover:text-slate-900 font-bold rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-sm bg-white/90 w-full sm:w-auto"
                onClick={() => setIsVideoModalOpen(true)}
              >
                <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Down Arrow Indicator - Mobile optimized */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button
          onClick={() => {
            document.getElementById('featured-courses')?.scrollIntoView({ 
              behavior: 'smooth' 
            });
          }}
          className="group flex flex-col items-center text-white hover:text-teal-300 transition-all duration-300 animate-bounce"
          aria-label="Scroll to courses"
        >
          <span className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 opacity-80 group-hover:opacity-100">Explore Courses</span>
          <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform duration-300" />
        </button>
      </div>
    </section>

    {/* Description Section - Mobile optimized */}
    <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 text-base sm:text-lg text-slate-600 leading-relaxed">
            <p className="px-2">
              Step into tomorrow's training ground today. Experience the radical evolution of plant operator education through revolutionary digital platforms, intelligent AI-powered learning ecosystems, and breathtaking immersive simulation technology that will leave traditional training methods in the dust.
            </p>
            <p className="text-lg sm:text-xl font-bold text-slate-800 px-2">
              The result? Every operator doesn't just learn essential skills—they master them with unprecedented speed, uncompromising safety, and game-changing effectiveness that makes traditional training look positively prehistoric.
            </p>
            <p className="text-lg sm:text-xl text-slate-800 font-bold mt-6 sm:mt-8 px-2">
              Ready to witness the future of construction training?
            </p>
          </div>
        </div>
      </div>
    </section>


      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="relative w-full h-0 pb-[56.25%]">
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/QJwcrRi-m0k?autoplay=1"
                title="Operator Skills Hub Demo Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

