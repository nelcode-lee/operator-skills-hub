import { 
  Wrench, 
  GraduationCap, 
  MapPin, 
  Shield, 
  Satellite,
  Award,
  Users,
  BookOpen,
  Target
} from 'lucide-react'

const features = [
  {
    icon: Wrench,
    title: "Plant Training & Testing",
    description: "A full range of plant training and technical tests for excavator, roller, dumpers, dozer, telehandler and wheeled loading shovels. Level 2 NVQs in plant operations also available."
  },
  {
    icon: GraduationCap,
    title: "Plant Operative Apprenticeships",
    description: "A new apprenticeship standard aimed at new entrants looking to start a career as a plant operative. Duration of 12-16 months with robust end-point assessment."
  },
  {
    icon: MapPin,
    title: "Utility Detection Training",
    description: "Range of utility detection, mapping and safe digging practice training at our world-class detection facility, fully accredited to EUSR, SHEA and DWI."
  },
  {
    icon: Shield,
    title: "NRSWA Training",
    description: "The NRSWA course for operatives and supervisors ensures all works on roads and infrastructure in the UK meets the highest standard and current regulations."
  },
  {
    icon: Satellite,
    title: "GPS Machine Control Training",
    description: "GPS training using simulation and practical exercises. Upskilling excavator, dozer, roller, and grader drivers on GPS machine control and guidance technology."
  },
  {
    icon: Award,
    title: "Site Safety Plus Courses",
    description: "Full range of CITB accredited Site Safety Plus courses enabling workers in the construction sector to develop their skills from operatives to senior managers."
  },
  {
    icon: BookOpen,
    title: "NOCN Accredited Courses",
    description: "Range of bespoke courses such as Site Right to provide learners with certification showing they are safe and competent to work on construction sites."
  },
  {
    icon: Target,
    title: "Health & Safety Short Courses",
    description: "Designed to keep people safe on site, these courses are relevant to anyone working in construction and cover topics including the people plant interface."
  },
  {
    icon: Users,
    title: "Skills Bootcamps",
    description: "Innovative training programmes designed to attract and recruit the best talent and upskill existing employees for modern, digitally enabled infrastructure environments."
  }
]

export function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Why Choose Operator Skills Hub
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            The Operator Skills Hub provides innovative, future focussed training solutions for plant operators 
            in the UK construction and infrastructure sector.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

