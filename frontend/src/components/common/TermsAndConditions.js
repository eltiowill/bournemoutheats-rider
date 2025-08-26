import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo className="h-16 w-auto mx-auto" showText={false} />
          <h1 className="mt-6 text-3xl font-extrabold text-white">Terms and Conditions</h1>
          <p className="mt-2 text-gray-300">BournemouthEats Rider Portal</p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Terms and Conditions for Riders</h2>
            
            <div className="space-y-6 text-gray-700">
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
                <p>By registering as a rider with BournemouthEats, you agree to be bound by these terms and conditions. If you do not agree to these terms, please do not register or use our services.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Rider Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintain a valid driving license and appropriate insurance</li>
                  <li>Ensure your vehicle is roadworthy and properly maintained</li>
                  <li>Follow all traffic laws and regulations</li>
                  <li>Provide accurate and up-to-date personal information</li>
                  <li>Maintain professional conduct with customers and restaurant staff</li>
                  <li>Handle food items with care and maintain food safety standards</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Document Verification</h3>
                <p>You must provide and maintain current copies of:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Valid government-issued photo identification</li>
                  <li>Current driving license</li>
                  <li>Vehicle insurance certificate</li>
                  <li>Proof of right to work in the United Kingdom</li>
                </ul>
                <p className="mt-2">Your account will remain inactive until all documents are verified and approved by our administration team.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Payment and Commission</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Commission rates are determined by your efficiency rating and performance</li>
                  <li>Payments are processed weekly to your registered bank account</li>
                  <li>All earnings are subject to applicable taxes and deductions</li>
                  <li>Bonus payments are awarded based on performance metrics</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Performance Standards</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintain a minimum efficiency rating as determined by the platform</li>
                  <li>Accept and complete deliveries within reasonable timeframes</li>
                  <li>Communicate promptly with customers and support staff</li>
                  <li>Maintain high customer satisfaction ratings</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Termination</h3>
                <p>Your account may be suspended or terminated for:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Violation of these terms and conditions</li>
                  <li>Poor performance or customer complaints</li>
                  <li>Failure to maintain required documentation</li>
                  <li>Unprofessional conduct or illegal activities</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Privacy and Data Protection</h3>
                <p>We are committed to protecting your personal information and will only use it in accordance with our Privacy Policy and applicable data protection laws.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Changes to Terms</h3>
                <p>We reserve the right to modify these terms at any time. You will be notified of any changes, and continued use of the service constitutes acceptance of the modified terms.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Information</h3>
                <p>For questions about these terms and conditions, please contact our support team at support@bournemoutheats.com</p>
              </section>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Last updated:</strong> January 2025<br />
                <strong>Version:</strong> 1.0
              </p>
            </div>
          </div>
        </div>

        {/* Back to Registration */}
        <div className="text-center">
          <Link 
            to="/register" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            ← Back to Registration
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-xs text-gray-400">
            <p>BournemouthEats Rider Portal</p>
            <p>Since 2025 • Professional Food Delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;
