import Image from 'next/image'

const partners = [
  {
    id: 1,
    name: "Flannery Plant Hire",
    logo: "/images/courses/FlanneryLogo.png",
    description: "45+ years of excellence in plant hire, ancillary equipment, and construction industry support services"
  },
  {
    id: 2,
    name: "Balfour Beatty",
    logo: "/images/courses/BalforBeatyLogo.png", 
    description: "Leading international infrastructure group with 26,000 employees driving innovative solutions"
  },
  {
    id: 3,
    name: "West Midlands Combined Authority",
    logo: "/images/courses/WestMids.png",
    description: "18 local councils and LEPs working together to benefit everyone in the region"
  }
]

export function Partners() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Partners
          </h2>
          <p className="text-xl text-slate-600 max-w-4xl mx-auto">
            The Operator Skills Hub is the powerful combination of three industry leaders: Balfour Beatty's infrastructure expertise, Flannery Plant Hire's 45+ years of plant hire excellence, and the West Midlands Combined Authority's regional development vision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {partners.map((partner) => (
            <div 
              key={partner.id} 
              className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
            >
              <div className="text-center">
                <div className="relative w-48 h-24 mx-auto mb-6 bg-white rounded-lg shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow duration-300">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    width={180}
                    height={80}
                    className="object-contain max-w-full max-h-full"
                    loading="lazy"
                    quality={90}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors duration-300">
                  {partner.name}
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed">
                  {partner.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
