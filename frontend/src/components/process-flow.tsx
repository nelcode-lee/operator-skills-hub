import { ArrowRight, User, BookOpen, Award, Briefcase, CheckCircle } from 'lucide-react'
import Image from 'next/image'

export function ProcessFlow() {
  const steps = [
    {
      id: 1,
      title: "Enquiry & Assessment",
      description: "Contact us to discuss your training needs and career goals",
      icon: User,
      image: "/images/process/enquiry.jpg",
      details: [
        "Free career consultation",
        "Skills assessment",
        "Training pathway planning",
        "Funding options review"
      ]
    },
    {
      id: 2,
      title: "Course Selection",
      description: "Choose from our comprehensive range of training programmes",
      icon: BookOpen,
      image: "/images/process/selection.jpg",
      details: [
        "Plant training & testing",
        "Health & safety courses",
        "GPS & technology training",
        "Apprenticeship programmes"
      ]
    },
    {
      id: 3,
      title: "Training Delivery",
      description: "Learn with industry experts using state-of-the-art facilities",
      icon: Award,
      image: "/images/process/training.jpg",
      details: [
        "Hands-on practical training",
        "Simulator technology",
        "Real equipment experience",
        "Expert instruction"
      ]
    },
    {
      id: 4,
      title: "Assessment & Certification",
      description: "Complete assessments and receive industry-recognised qualifications",
      icon: CheckCircle,
      image: "/images/process/assessment.jpg",
      details: [
        "CPCS certification",
        "NPORS qualifications",
        "Industry accreditations",
        "Digital certificates"
      ]
    },
    {
      id: 5,
      title: "Career Progression",
      description: "Launch your career with ongoing support and development opportunities",
      icon: Briefcase,
      image: "/images/process/career.jpg",
      details: [
        "Job placement support",
        "Continuing professional development",
        "Industry networking",
        "Career advancement"
      ]
    }
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Your Training Journey
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            From initial enquiry to career success - discover how we guide you through every step of your training journey.
          </p>
        </div>

        {/* Desktop Process Flow */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 transform -translate-y-1/2"></div>
            
            <div className="flex justify-between items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center group">
                  {/* Step Circle */}
                  <div className="relative z-10 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-10 h-10 text-teal-700" />
                  </div>
                  
                  {/* Step Content */}
                  <div className="text-center max-w-xs">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">{step.description}</p>
                    
                    {/* Step Image */}
                    <div className="relative w-32 h-20 mx-auto mb-4 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Details List */}
                    <ul className="text-xs text-slate-500 space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center">
                          <div className="w-1 h-1 bg-teal-500 rounded-full mr-2"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Process Flow */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-4 group">
              {/* Step Number & Icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {step.id}
              </div>
              
              {/* Step Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{step.title}</h3>
                <p className="text-slate-600 mb-4">{step.description}</p>
                
                {/* Step Image */}
                <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Details List */}
                <ul className="text-sm text-slate-500 space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-2"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Arrow for mobile */}
              {index < steps.length - 1 && (
                <div className="flex-shrink-0 flex justify-center mt-6">
                  <ArrowRight className="w-6 h-6 text-teal-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-slate-600 mb-6">
              Join thousands of successful graduates who have transformed their careers through our training programmes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Start Your Application
              </button>
              <button className="border border-teal-700 text-teal-700 hover:bg-teal-50 px-8 py-3 rounded-lg font-semibold transition-colors">
                Download Brochure
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
