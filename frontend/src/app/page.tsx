import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { Partners } from '@/components/partners'
import { Courses } from '@/components/courses'
import { Accreditations } from '@/components/accreditations'
import { Testimonials } from '@/components/testimonials'
import { ProcessFlow } from '@/components/process-flow'
import Header from '@/components/header'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Partners />
        <Features />
        <Courses />
        <ProcessFlow />
        <Accreditations />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
