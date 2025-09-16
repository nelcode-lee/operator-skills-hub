import { Button } from '@/components/ui/button'
import { Clock, Users, Star, ArrowRight, Wrench, Shield, Satellite, MapPin } from 'lucide-react'
import Link from 'next/link'

const courses = [
  {
    id: 1,
    title: "Plant Training & Testing",
    duration: "1-5 Days",
    students: 2500,
    rating: 4.9,
    price: "From £200",
    image: "/images/equipment/forward-tipping-dumper.webp",
    video: "/videos/courses/plant-training.mp4",
    category: "Plant Training",
    description: "CPCS and NPORS plant training and technical tests for excavator, roller, dumpers, dozer, telehandler and wheeled loading shovels.",
    icon: Wrench
  },
  {
    id: 2,
    title: "Health & Safety Short Course",
    duration: "1 Day",
    students: 3200,
    rating: 4.8,
    price: "£150",
    image: "/images/courses/H&S.webp",
    video: "/videos/courses/plant-training.mp4",
    category: "Health & Safety",
    description: "Designed to keep people safe on site, covering topics including the people plant interface. Delivered on site or at the Hub.",
    icon: Shield
  },
  {
    id: 3,
    title: "GPS Training",
    duration: "2-3 Days",
    students: 1800,
    rating: 4.9,
    price: "£400",
    image: "/images/courses/gps training.jpeg",
    video: "/videos/courses/plant-training.mp4",
    category: "GPS Training",
    description: "GPS machine control and guidance training using simulation and practical exercises for excavator, dozer, roller, and grader drivers.",
    icon: Satellite
  },
  {
    id: 4,
    title: "Utility Detection Training",
    duration: "1-3 Days",
    students: 1200,
    rating: 4.7,
    price: "From £250",
    image: "/images/courses/streetworks.jpg",
    video: "/videos/courses/plant-training.mp4",
    category: "Utility Detection",
    description: "Range of utility detection, mapping and safe digging practice training at our world-class detection facility.",
    icon: MapPin
  }
]

export function Courses() {
  return (
    <section id="featured-courses" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Featured Courses
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Delivering high quality training, we're fully accredited to many standards including Compliance Plus, 
            Construction Plant Competence Scheme (CPCS) and the National Open College Network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-out cursor-pointer group">
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
                    View Course
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/courses">
            <Button variant="outline" size="lg" className="border-teal-700 text-teal-700 hover:bg-teal-50">
              View All Courses
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

