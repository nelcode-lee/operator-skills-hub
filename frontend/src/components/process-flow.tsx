import { ArrowRight, User, BookOpen, Award, Briefcase, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export function ProcessFlow() {
  const steps = [
    {
      id: 1,
      title: "Enquiry & Assessment",
      description: "Contact us to discuss your training needs and career goals",
      icon: User,
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
            <div className="absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 rounded-full"></div>
            
            <div className="grid grid-cols-5 gap-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center group relative">
                  {/* Step Circle */}
                  <div className="relative z-10 w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-300 border-4 border-teal-100 group-hover:border-teal-300">
                    <step.icon className="w-12 h-12 text-teal-700" />
                  </div>
                  
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {step.id}
                  </div>
                  
                  {/* Step Content */}
                  <div className="text-center max-w-xs">
                    <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors duration-300">{step.title}</h3>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">{step.description}</p>
                    
                    {/* Details List */}
                    <div className="bg-slate-50 rounded-lg p-4 group-hover:bg-teal-50 transition-colors duration-300">
                      <ul className="text-xs text-slate-600 space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                            <span className="leading-relaxed">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Process Flow */}
        <div className="lg:hidden space-y-12">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-12 bg-gradient-to-b from-teal-300 to-teal-200"></div>
              )}
              
              <div className="flex items-start space-x-6 group">
                {/* Step Number & Icon */}
                <div className="flex-shrink-0 relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-teal-600 text-teal-600 rounded-full flex items-center justify-center text-xs font-bold">
                    {step.id}
                  </div>
                </div>
                
                {/* Step Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-teal-700 transition-colors duration-300">{step.title}</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">{step.description}</p>
                  
                  {/* Details List */}
                  <div className="bg-slate-50 rounded-lg p-4 group-hover:bg-teal-50 transition-colors duration-300">
                    <ul className="text-sm text-slate-600 space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mr-3 mt-1.5 flex-shrink-0"></div>
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
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
            <div className="flex justify-center">
              <Link href="https://www.operatorskillshub.com/careers-in-construction/get-started-in-construction/" target="_blank" rel="noopener noreferrer">
                <button className="bg-teal-700 hover:bg-teal-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Start Your Application
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
