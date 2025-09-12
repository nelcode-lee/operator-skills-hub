import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Courses } from '@/components/courses'
import { Accreditations } from '@/components/accreditations'
import { Testimonials } from '@/components/testimonials'
import { VisualShowcase } from '@/components/visual-showcase'
import { ProcessFlow } from '@/components/process-flow'
import Navigation from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPath="/" />
        <main>
          <Hero />
          <Features />
          <Courses />
          <VisualShowcase />
          <ProcessFlow />
          <Accreditations />
          <Testimonials />
        </main>
      <Footer />
    </div>
  )
}
