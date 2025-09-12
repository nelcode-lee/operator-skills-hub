import { Award, Shield, CheckCircle, Star } from 'lucide-react'
import Image from 'next/image'

const accreditations = [
  {
    name: "CPCS",
    description: "Construction Plant Competence Scheme",
    icon: Award
  },
  {
    name: "NPORS",
    description: "National Plant Operators Registration Scheme",
    icon: Shield
  },
  {
    name: "CITB",
    description: "Construction Industry Training Board",
    icon: CheckCircle,
    image: "/images/courses/CITB.jpeg"
  },
  {
    name: "NOCN",
    description: "National Open College Network",
    icon: Star
  },
  {
    name: "EUSR",
    description: "Energy & Utility Skills Register",
    icon: Award
  },
  {
    name: "SHEA",
    description: "Safety, Health & Environment Awareness",
    icon: Shield
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {accreditations.map((accreditation, index) => (
            <div key={index} className="text-center group">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 transition-colors overflow-hidden">
                {accreditation.image ? (
                  <Image
                    src={accreditation.image}
                    alt={accreditation.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <accreditation.icon className="w-8 h-8 text-teal-700" />
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
