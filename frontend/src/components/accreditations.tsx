import { Award, Shield, CheckCircle, Star } from 'lucide-react'
import Image from 'next/image'

const accreditations = [
  {
    name: "CPCS",
    description: "Construction Plant Competence Scheme",
    icon: Award,
    image: "/images/courses/cpcs logo.png"
  },
  {
    name: "NPORS",
    description: "National Plant Operators Registration Scheme",
    icon: Shield,
    image: "/images/courses/NPOrs-logo.jpg"
  },
  {
    name: "CITB",
    description: "Construction Industry Training Board",
    icon: CheckCircle,
    image: "/images/courses/CITB_logo.svg.png"
  },
  {
    name: "NOCN",
    description: "National Open College Network",
    icon: Star,
    image: "/images/courses/nocn.png"
  },
  {
    name: "EUSR",
    description: "Energy & Utility Skills Register",
    icon: Award,
    image: "/images/courses/eusr.png"
  }
]

export function Accreditations() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Our Accreditations
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We are fully accredited to many standards ensuring the highest quality training 
            and certification for all our programmes.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {accreditations.map((accreditation, index) => (
            <div key={index} className="text-center group">
              <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300">
                {accreditation.image ? (
                  <Image
                    src={accreditation.image}
                    alt={accreditation.name}
                    width={80}
                    height={80}
                    className="object-contain"
                    loading="lazy"
                    quality={90}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                  />
                ) : (
                  <accreditation.icon className="w-12 h-12 text-teal-700" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                {accreditation.name}
              </h3>
              <p className="text-sm text-slate-600">
                {accreditation.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
