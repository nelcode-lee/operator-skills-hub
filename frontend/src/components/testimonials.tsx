import { Star, Quote } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
  {
    id: 1,
    name: "Phil",
    date: "March 2021",
    rating: 5,
    comment: "Training establishment is superb, 5 stars, simulators are amazing!!",
    image: "/images/testimonials/phil.jpg",
    role: "Plant Operative",
    company: "Balfour Beatty"
  },
  {
    id: 2,
    name: "Mo",
    date: "June 2021",
    rating: 5,
    comment: "SEATS course very well delivered and the trainer really knew his stuff!",
    image: "/images/testimonials/mo.jpg",
    role: "Safety Coordinator",
    company: "Kier Group"
  },
  {
    id: 3,
    name: "Chris",
    date: "February 2021",
    rating: 5,
    comment: "Excellent training, highly recommend this place for GPS.",
    image: "/images/testimonials/chris.jpg",
    role: "GPS Specialist",
    company: "Morgan Sindall"
  },
  {
    id: 4,
    name: "Howard",
    date: "June 2021",
    rating: 5,
    comment: "Trainer put me at ease and delivered the course brilliantly.",
    image: "/images/testimonials/howard.jpg",
    role: "Crane Operator",
    company: "Willmott Dixon"
  },
  {
    id: 5,
    name: "GC",
    date: "August 2021",
    rating: 5,
    comment: "Trainer is the best I've ever had in the UK because of his personal and professional skills.",
    image: "/images/testimonials/gc.jpg",
    role: "Site Manager",
    company: "Laing O'Rourke"
  },
  {
    id: 6,
    name: "SD",
    date: "June 2021",
    rating: 5,
    comment: "Facilities are brilliant, trainers really put you through your paces and in a great environment.",
    image: "/images/testimonials/sd.jpg",
    role: "Utility Detection Specialist",
    company: "Skanska"
  }
]

export function Testimonials() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Student Comments
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Hear what our students have to say about their training experience at the Operator Skills Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 mr-4">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Quote className="w-6 h-6 text-teal-700 mr-2" />
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <h4 className="font-semibold text-slate-800">{testimonial.name}</h4>
                  <p className="text-sm text-teal-700 font-medium">{testimonial.role}</p>
                  <p className="text-xs text-slate-500">{testimonial.company}</p>
                </div>
              </div>
              
              <blockquote className="text-slate-700 mb-4 italic">
                "{testimonial.comment}"
              </blockquote>
              
              <div className="text-right">
                <p className="text-sm text-slate-500">{testimonial.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
