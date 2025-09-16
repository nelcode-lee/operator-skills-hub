import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Clock, Users, Star, ArrowRight, Wrench, Shield, Satellite, MapPin, GraduationCap, Award, BookOpen, Target, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const allCourses = [
  {
    id: 1,
    title: "Plant Training & Testing",
    duration: "1-5 Days",
    students: 2500,
    rating: 4.9,
    price: "From £200",
    image: "/images/equipment/forward-tipping-dumper.png",
    category: "Plant Training",
    description: "CPCS and NPORS plant training and technical tests for excavator, roller, dumpers, dozer, telehandler and wheeled loading shovels. Level 2 NVQs in plant operations also available.",
    icon: Wrench,
    features: [
      "CPCS and NPORS accredited training",
      "Level 2 NVQs in plant operations",
      "CPCS renewal tests",
      "CITB health, safety and environment tests"
    ]
  },
  {
    id: 2,
    title: "Plant Operative Apprenticeships",
    duration: "12-16 Months",
    students: 1800,
    rating: 4.8,
    price: "Apprenticeship",
    image: "/images/courses/Compliance-Plus.webp",
    category: "Apprenticeships",
    description: "A new apprenticeship standard aimed at new entrants looking to start a career as a plant operative. Duration of 12-16 months with robust end-point assessment.",
    icon: GraduationCap,
    features: [
      "Structured 12-16 month programme",
      "Robust end-point assessment",
      "Career progression pathway",
      "Industry-recognized qualification"
    ]
  },
  {
    id: 3,
    title: "Utility Detection Training",
    duration: "1-3 Days",
    students: 1200,
    rating: 4.7,
    price: "From £250",
    image: "/images/courses/bb_utility.webp",
    category: "Utility Detection",
    description: "Range of utility detection, mapping and safe digging practice training at our world-class detection facility, fully accredited to EUSR, SHEA and DWI.",
    icon: MapPin,
    features: [
      "EUSR, SHEA and DWI accredited",
      "World-class detection facility",
      "Mapping and safe digging practice",
      "Utility detection expertise"
    ]
  },
  {
    id: 4,
    title: "NRSWA Training",
    duration: "1-2 Days",
    students: 2100,
    rating: 4.6,
    price: "From £180",
    image: "/images/courses/streetworks.jpg",
    category: "NRSWA",
    description: "The NRSWA course for operatives and supervisors ensures all works on roads and infrastructure in the UK meets the highest standard and current regulations.",
    icon: Shield,
    features: [
      "Operatives and supervisors training",
      "Roads and infrastructure works",
      "Current regulations compliance",
      "Highest industry standards"
    ]
  },
  {
    id: 5,
    title: "GPS Machine Control Training",
    duration: "2-3 Days",
    students: 1800,
    rating: 4.9,
    price: "£400",
    image: "/images/courses/gps training.jpeg",
    category: "GPS Training",
    description: "GPS training using simulation and practical exercises. Upskilling excavator, dozer, roller, and grader drivers on GPS machine control and guidance technology.",
    icon: Satellite,
    features: [
      "Simulation and practical exercises",
      "Machine control technology",
      "Site engineers and management training",
      "GPS guidance systems"
    ]
  },
  {
    id: 6,
    title: "Site Safety Plus Courses",
    duration: "1-5 Days",
    students: 3200,
    rating: 4.8,
    price: "From £150",
    image: "/images/courses/site safety.jpeg",
    category: "Site Safety",
    description: "Full range of CITB accredited Site Safety Plus courses enabling workers in the construction sector to develop their skills from operatives to senior managers.",
    icon: Award,
    features: [
      "CITB accredited courses",
      "Operatives to senior managers",
      "Skills development pathway",
      "Industry progression"
    ]
  },
  {
    id: 7,
    title: "NOCN Accredited Courses",
    duration: "1-3 Days",
    students: 1500,
    rating: 4.7,
    price: "From £200",
    image: "/images/courses/nocn.jpeg",
    category: "NOCN",
    description: "Range of bespoke courses such as Site Right to provide learners with certification showing they are safe and competent to work on construction sites.",
    icon: BookOpen,
    features: [
      "NOCN accredited courses",
      "Site Right certification",
      "Level 1 simulator training",
      "Construction site competency"
    ]
  },
  {
    id: 8,
    title: "Health & Safety Short Courses",
    duration: "1 Day",
    students: 3200,
    rating: 4.8,
    price: "£150",
    image: "/images/courses/H&S.jpg",
    category: "Health & Safety",
    description: "Designed to keep people safe on site, covering topics including the people plant interface. Delivered on site or at the Hub.",
    icon: Target,
    features: [
      "People plant interface training",
      "On-site or Hub delivery",
      "Construction environment safety",
      "Comprehensive safety coverage"
    ]
  }
]

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Homepage
              </Button>
            </Link>
          </div>
          
      <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Courses & Training
            </h1>
            <p className="text-xl text-slate-600 max-w-4xl mx-auto mb-8">
              The Operator Skills Hub provides innovative, future focussed training solutions for plant operators 
              in the UK construction and infrastructure sector.
            </p>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Delivering high quality training, we're fully accredited to many standards including Compliance Plus, 
              Construction Plant Competence Scheme (CPCS) and the National Open College Network.
            </p>
          </div>
        </div>
      </section>

      {/* All Courses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              All Available Courses
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              All our courses are carefully planned and scheduled throughout the year to ensure you have access to training on a regular basis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {allCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer group border border-slate-200">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 group-hover:to-transparent transition-all duration-300"></div>
                  <div className="absolute top-4 left-4">
                    <span className="text-sm font-medium text-white bg-teal-700 px-2 py-1 rounded group-hover:bg-yellow-500 group-hover:text-slate-800 transition-all duration-300">
                      {course.category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white text-center">
                      <course.icon className="w-8 h-8 mx-auto mb-2 group-hover:text-yellow-300 transition-colors duration-300" />
                      <div className="text-sm font-semibold group-hover:text-yellow-300 transition-colors duration-300">{course.category}</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <ArrowRight className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-teal-700 bg-teal-100 px-2 py-1 rounded">
                      {course.category}
                    </span>
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="ml-1 text-sm font-medium text-slate-800">{course.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-slate-600 mb-4 text-sm">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {course.students.toLocaleString()} trained
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-slate-800">
                      {course.price}
                    </div>
                    <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white group-hover:bg-yellow-500 group-hover:text-slate-800 transition-all duration-300 transform group-hover:scale-105">
                      View Details
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="border-teal-700 text-teal-700 hover:bg-teal-50">
              Contact Us for More Information
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
      </div>
      </section>

      <Footer />
    </div>
  )
}