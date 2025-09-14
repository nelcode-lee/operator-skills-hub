import Link from 'next/link'
import { HardHat, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Operator Skills Hub</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              The Operator Skills Hub (OSH) is transforming the skills landscape through innovative training programmes, 
              Skills Bootcamps, and qualifications for the construction and infrastructure industry.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <Mail className="w-4 h-4 mr-2" />
                <span>info@operatorskillshub.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Dunton Wharf, Lichfield Road, Birmingham, B76 9EN</span>
              </div>
            </div>
          </div>

          {/* About OSH */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About OSH</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/sustainability" className="text-gray-300 hover:text-white transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-300 hover:text-white transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link href="/partners" className="text-gray-300 hover:text-white transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-300 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Courses & Training */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Courses & Training</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/plant-training" className="text-gray-300 hover:text-white transition-colors">
                  Plant Training & Testing
                </Link>
              </li>
              <li>
                <Link href="/apprenticeships" className="text-gray-300 hover:text-white transition-colors">
                  Plant Operative Apprenticeship
                </Link>
              </li>
              <li>
                <Link href="/utility-detection" className="text-gray-300 hover:text-white transition-colors">
                  Utility Detection Training
                </Link>
              </li>
              <li>
                <Link href="/nrswa" className="text-gray-300 hover:text-white transition-colors">
                  NRSWA Training
                </Link>
              </li>
              <li>
                <Link href="/gps-training" className="text-gray-300 hover:text-white transition-colors">
                  GPS Training
                </Link>
              </li>
              <li>
                <Link href="/site-safety-plus" className="text-gray-300 hover:text-white transition-colors">
                  Site Safety Plus
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-300 text-sm">
            <div className="flex flex-wrap justify-center md:justify-start mb-4 md:mb-0">
              <Link href="/modern-slavery" className="mr-6 hover:text-white transition-colors">
                Modern Slavery Policy
              </Link>
              <Link href="/terms" className="mr-6 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="mr-6 hover:text-white transition-colors">
                Privacy Notice
              </Link>
              <Link href="/cookies" className="mr-6 hover:text-white transition-colors">
                Cookie Notice
              </Link>
              <Link href="/sitemap" className="hover:text-white transition-colors">
                Sitemap
              </Link>
            </div>
            <p>&copy; 2024 Operator Skills Hub. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

