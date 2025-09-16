import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: "Phil",
    date: "March 2025",
    rating: 5,
    comment: "The VR training modules were incredible - I felt like I was actually operating the machinery. The AI feedback system helped me improve my technique in real-time. Best training I've ever had!",
    image: "/images/testimonials/phil.jpg",
    role: "Plant Operative",
    company: "Balfour Beatty"
  },
  {
    id: 2,
    name: "Mo",
    date: "January 2025",
    rating: 5,
    comment: "The digital learning platform made everything so accessible. I could study at my own pace and the interactive assessments really helped me understand the safety protocols. Highly recommend!",
    image: "/images/testimonials/mo.jpg",
    role: "Safety Coordinator",
    company: "Kier Group"
  },
  {
    id: 3,
    name: "Chris",
    date: "February 2025",
    rating: 5,
    comment: "The GPS training simulation was spot-on. The realistic scenarios and instant feedback helped me master complex operations quickly. The instructors were knowledgeable and supportive throughout.",
    image: "/images/testimonials/chris.jpg",
    role: "GPS Specialist",
    company: "Morgan Sindall"
  },
  {
    id: 4,
    name: "Howard",
    date: "April 2025",
    rating: 5,
    comment: "I was nervous about the crane operation course, but the virtual reality training gave me confidence before I even touched real equipment. The step-by-step guidance was excellent.",
    image: "/images/testimonials/howard.jpg",
    role: "Crane Operator",
    company: "Willmott Dixon"
  },
  {
    id: 5,
    name: "GC",
    date: "May 2025",
    rating: 5,
    comment: "The combination of traditional teaching and cutting-edge technology was perfect. The instructors were professional and the digital resources made learning engaging. Worth every penny.",
    image: "/images/testimonials/gc.jpg",
    role: "Site Manager",
    company: "Laing O'Rourke"
  },
  {
    id: 6,
    name: "SD",
    date: "June 2025",
    rating: 5,
    comment: "The utility detection training was comprehensive and the facilities were top-notch. The blend of practical experience and digital learning tools prepared me perfectly for real-world scenarios.",
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
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-15 h-15 rounded-full object-cover"
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
