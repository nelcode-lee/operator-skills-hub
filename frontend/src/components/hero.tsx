'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play, PoundSterling, Shield, Leaf, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export function Hero() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 py-20 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        {/* YouTube Video Embed */}
        <iframe
          className="w-full h-full object-cover opacity-70"
          src="https://www.youtube.com/embed/CchXaaoS2fc?autoplay=1&mute=1&loop=1&playlist=CchXaaoS2fc&controls=0&showinfo=0&rel=0&modestbranding=1&start=0"
          title="Construction Training Background Video"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        ></iframe>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 to-blue-50/80"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold !text-slate-800 mb-6">
            Training the next generation of{' '}
            <span className="!text-teal-700">plant operatives</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold !text-teal-800 mb-4">
            We are the Operator Skills Hub
          </h2>
          <p className="text-xl !text-slate-700 mb-8 max-w-4xl mx-auto">
            <strong>Improving productivity by creating a safer, digitally-enabled and more diverse construction and infrastructure industry.</strong>
          </p>
          <p className="text-lg !text-slate-600 mb-8 max-w-4xl mx-auto">
            The Operator Skills Hub (OSH) is transforming the skills landscape through innovative training programmes, Skills Bootcamps, and qualifications. We inspire young people, career changers, and existing industry professionals to develop the skills needed for a safer, more productive, and digitally advanced workplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 !bg-yellow-500 hover:!bg-yellow-600 !text-slate-800 font-bold">
              FIND A COURSE
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 !border-teal-700 !text-teal-700 hover:!bg-teal-50"
              onClick={() => setIsVideoModalOpen(true)}
            >
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Stats - OSH specific */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PoundSterling className="w-8 h-8 text-teal-700" />
            </div>
            <h3 className="text-2xl font-bold !text-slate-800 mb-2">£650 billion</h3>
            <p className="!text-slate-600">The 2021 National Infrastructure and Construction Pipeline sets out nearly £650 billion of public and private investment over the next decade.</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 !text-green-700" />
            </div>
            <h3 className="text-2xl font-bold !text-slate-800 mb-2">Zero Harm</h3>
            <p className="!text-slate-600">Our digitally enhanced tools will help create a safer construction and infrastructure industry and achieve our goal of Zero Harm.</p>
          </div>
          <div className="text-center">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="w-8 h-8 !text-emerald-700" />
            </div>
            <h3 className="text-2xl font-bold !text-slate-800 mb-2">Net Zero by 2040</h3>
            <p className="!text-slate-600">It is our ambition to go Beyond Net Zero Carbon by 2040</p>
          </div>
        </div>
      </div>

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
    </section>
  )
}

