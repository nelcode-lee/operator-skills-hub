import Image from 'next/image'
import { Play, Camera, Wrench, HardHat, Award } from 'lucide-react'

export function VisualShowcase() {
  const equipmentImages = [
    {
      src: '/images/equipment/forward-tipping-dumper.png',
      alt: 'Forward Tipping Dumper in action on construction site',
      title: 'Forward Tipping Dumper Training',
      description: 'Professional forward tipping dumper operation and safety training with real-world scenarios'
    },
    {
      src: '/images/equipment/excavator-training.jpg',
      alt: 'Excavator training in progress',
      title: 'Plant Machinery Training',
      description: 'Hands-on training with modern excavators and construction equipment'
    },
    {
      src: '/images/equipment/crane-operation.jpg',
      alt: 'Crane operation training',
      title: 'Crane Operations',
      description: 'Professional crane operation and safety training programmes'
    },
    {
      src: '/images/equipment/safety-gear.jpg',
      alt: 'Safety equipment and PPE training',
      title: 'Safety & PPE',
      description: 'Comprehensive safety training and personal protective equipment'
    }
  ]


  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Equipment Showcase */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Training Equipment & Machinery
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Learn with industry-standard equipment and cutting-edge technology in our state-of-the-art training facilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {equipmentImages.map((item, index) => (
              <div key={index} className="group relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  )
}
