import React from 'react';

interface TermsOfServiceProps {
  onClose?: () => void;
  showFullTerms?: boolean;
}

export default function TermsOfService({ onClose, showFullTerms = true }: TermsOfServiceProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
              <p className="text-sm text-gray-500">Last Updated: December 1, 2024</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>

          {/* Important Disclaimer Banner */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Important: Not a Substitute for Professional Care</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-semibold mb-1">If you are experiencing a mental health crisis or emergency:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Call <strong>911</strong> for immediate emergency assistance</li>
                    <li>Call <strong>988</strong> for the Suicide & Crisis Lifeline (24/7)</li>
                    <li>Text <strong>"HELLO" to 741741</strong> for Crisis Text Line</li>
                    <li>Go to your nearest emergency room</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Terms Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 text-gray-700">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. ACCEPTANCE OF TERMS</h2>
              <p>
                Welcome to Mind Brother. By accessing or using the Mind Brother mobile application, website, or any related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
              <p className="mt-2">
                These Terms constitute a legally binding agreement between you and Mind Brother ("we," "us," or "our").
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. IMPORTANT DISCLAIMERS</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-900 mb-2">2.1 Not a Substitute for Professional Care</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>MIND BROTHER IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL, MENTAL HEALTH, OR THERAPEUTIC CARE.</strong> The Service, including our AI assistant "Amani," provides general wellness support, fitness guidance, and breathing exercises. It does not provide:
                </p>
                <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1 ml-2">
                  <li>Medical advice, diagnosis, or treatment</li>
                  <li>Psychotherapy or counseling</li>
                  <li>Crisis intervention services</li>
                  <li>Emergency mental health services</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">2.2 Emergency Situations</h3>
                <p className="text-sm text-red-800 mb-2">
                  <strong>IF YOU ARE EXPERIENCING A MENTAL HEALTH CRISIS OR EMERGENCY:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1 ml-2">
                  <li><strong>Call 911</strong> for immediate emergency assistance</li>
                  <li><strong>Call 988</strong> for the Suicide & Crisis Lifeline (24/7)</li>
                  <li><strong>Text "HELLO" to 741741</strong> for Crisis Text Line</li>
                  <li><strong>Go to your nearest emergency room</strong></li>
                </ul>
                <p className="text-sm text-red-800 mt-2">
                  Mind Brother is not equipped to handle crisis situations and should never be used as a substitute for emergency services.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">2.3 AI Limitations</h3>
                <p className="text-sm text-blue-800">
                  Amani, our AI wellness companion, uses artificial intelligence technology. While designed to be helpful and supportive:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-2 mt-2">
                  <li>AI responses may contain errors or inaccuracies</li>
                  <li>AI cannot understand complex emotional nuances like a human therapist</li>
                  <li>AI responses are generated based on patterns, not genuine emotional understanding</li>
                  <li>AI should not be relied upon for critical health decisions</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. ELIGIBILITY</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">3.1 Age Requirement</h3>
              <p className="mb-4">
                You must be at least 18 years old to use the Service. By using the Service, you represent and warrant that you are 18 years of age or older.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">3.2 Account Registration</h3>
              <p className="mb-2">To access certain features, you must create an account. You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">3.3 Account Termination</h3>
              <p className="mb-2">We reserve the right to suspend or terminate your account at any time, with or without notice, for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Prolonged inactivity</li>
                <li>Any reason at our sole discretion</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. USE OF SERVICE</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">4.1 License</h3>
              <p className="mb-4">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">4.2 Prohibited Uses</h3>
              <p className="mb-2">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, threaten, or harm others</li>
                <li>Share another person's personal information without consent</li>
                <li>Attempt to hack, reverse engineer, or compromise the Service</li>
                <li>Use automated systems (bots) to access the Service</li>
                <li>Scrape, copy, or download content without permission</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service to distribute spam or malware</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">4.3 Content Guidelines</h3>
              <p className="mb-2">When using community features or interacting with professionals:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Be respectful and supportive of others</li>
                <li>Do not share explicit, violent, or harmful content</li>
                <li>Do not promote self-harm, suicide, or dangerous behaviors</li>
                <li>Do not share misinformation about health or mental health</li>
                <li>Respect the privacy and confidentiality of others</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. PROFESSIONAL USERS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">5.1 Mental Health Professionals</h3>
              <p className="mb-2">Licensed mental health professionals who register on the platform agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Provide accurate license and credential information</li>
                <li>Maintain valid, current professional licenses</li>
                <li>Comply with all applicable professional ethics codes</li>
                <li>Maintain appropriate professional liability insurance</li>
                <li>Not use the platform as a substitute for proper clinical care</li>
                <li>Follow HIPAA and other applicable privacy regulations</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">5.2 Professional Verification</h3>
              <p className="mb-2">We reserve the right to verify professional credentials and may:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Request copies of licenses and certifications</li>
                <li>Conduct background checks</li>
                <li>Suspend or terminate accounts with invalid credentials</li>
                <li>Remove content that violates professional standards</li>
              </ul>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-orange-900 mb-2">5.3 Professional Liability</h3>
                <p className="text-sm text-orange-800">
                  Professional users are solely responsible for their own professional conduct and advice, maintaining appropriate professional boundaries, complying with licensing board requirements, their own malpractice insurance, and any claims arising from their professional services.
                </p>
                <p className="text-sm text-orange-800 font-semibold mt-2">
                  <strong>Mind Brother is not liable for actions or advice provided by professional users.</strong>
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. INTELLECTUAL PROPERTY</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">6.1 Our Content</h3>
              <p className="mb-2">All content, features, and functionality of the Service, including but not limited to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Text, graphics, logos, images, and software</li>
                <li>AI models and algorithms</li>
                <li>Breathing exercises and fitness programs</li>
                <li>Audio content and voice recordings</li>
                <li>User interface and design</li>
              </ul>
              <p>are owned by Mind Brother and protected by copyright, trademark, and other intellectual property laws.</p>

              <h3 className="font-semibold text-gray-800 mb-2 mt-4">6.2 User Content</h3>
              <p className="mb-2">
                You retain ownership of content you submit to the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Use, reproduce, modify, and display your User Content</li>
                <li>Improve our AI models and Service</li>
                <li>Aggregate and anonymize data for analytics</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">6.3 Feedback</h3>
              <p>
                Any feedback, suggestions, or ideas you provide about the Service become our property and may be used without compensation or attribution.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. PRIVACY AND DATA</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">7.1 Data Collection</h3>
              <p className="mb-4">
                We collect and process personal data as described in our Privacy Policy. By using the Service, you consent to such collection and processing.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">7.2 Health Information</h3>
              <p className="mb-4">
                Information you provide about your mental health, fitness, and wellness is sensitive. We take reasonable measures to protect this information, but cannot guarantee absolute security.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">7.3 Third-Party Services</h3>
              <p>
                The Service integrates with third-party services (e.g., ElevenLabs for voice, Anthropic for AI). These services have their own privacy policies and terms.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. PAYMENTS AND SUBSCRIPTIONS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">8.1 Subscription Plans</h3>
              <p className="mb-2">Certain features require a paid subscription. Subscription details include:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Monthly or annual billing cycles</li>
                <li>Automatic renewal unless cancelled</li>
                <li>Access to premium features</li>
                <li>No refunds for partial periods</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">8.2 Free Trial</h3>
              <p className="mb-2">We may offer free trial periods. By starting a trial:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>You authorize charges after the trial ends</li>
                <li>You must cancel before trial ends to avoid charges</li>
                <li>One trial per user</li>
                <li>We reserve the right to verify eligibility</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">8.3 Payment Processing</h3>
              <p className="mb-4">
                Payments are processed through third-party payment processors (Apple, Google, Stripe). We do not store your payment card information.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">8.4 Cancellation</h3>
              <p className="mb-2">You may cancel your subscription at any time through:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>App settings</li>
                <li>App store subscription management</li>
                <li>Contacting support</li>
              </ul>
              <p className="mb-4">Cancellation takes effect at the end of the current billing period.</p>

              <h3 className="font-semibold text-gray-800 mb-2">8.5 Price Changes</h3>
              <p>
                We reserve the right to change subscription prices with 30 days' notice. Changes apply to renewals after the notice period.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. WARRANTY DISCLAIMERS</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-700 mb-4">
                  <li>Fitness for a particular purpose</li>
                  <li>Merchantability</li>
                  <li>Non-infringement</li>
                  <li>Accuracy or reliability</li>
                  <li>Uninterrupted or error-free operation</li>
                </ul>
                <p className="text-sm font-semibold text-gray-900 mb-2">WE DO NOT WARRANT THAT:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-gray-700 mb-2">
                  <li>The Service will meet your requirements</li>
                  <li>The Service will be available at all times</li>
                  <li>Any content or advice will be accurate</li>
                  <li>Defects will be corrected</li>
                  <li>The Service is free from viruses or harmful components</li>
                </ul>
                <p className="text-sm font-semibold text-gray-900">
                  USE THE SERVICE AT YOUR OWN RISK.
                </p>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. LIMITATION OF LIABILITY</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">10.1 No Liability for Damages</h3>
                <p className="text-sm text-red-800 mb-2">
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-red-800">
                  <li>Loss of profits, data, or use</li>
                  <li>Personal injury or emotional distress</li>
                  <li>Loss of goodwill or reputation</li>
                  <li>Service interruption or data loss</li>
                </ul>
                <p className="text-sm text-red-800 font-semibold mt-2">
                  EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">10.2 Maximum Liability</h3>
              <p className="mb-4">
                <strong>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THE SERVICE SHALL NOT EXCEED THE GREATER OF:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>The amount you paid us in the 12 months before the claim, OR</li>
                <li>$100</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">10.3 Health-Related Limitations</h3>
              <p className="mb-2"><strong>WE ARE NOT LIABLE FOR:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Health outcomes or lack thereof</li>
                <li>Decisions made based on Service content</li>
                <li>Reliance on AI-generated advice</li>
                <li>Delays in seeking professional help</li>
                <li>Any harm resulting from use of the Service</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">10.4 Professional User Liability</h3>
              <p className="mb-2"><strong>WE ARE NOT LIABLE FOR:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Actions or advice of professional users</li>
                <li>Professional malpractice claims</li>
                <li>Licensing or credentialing issues</li>
                <li>Professional-client relationships formed through the Service</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. INDEMNIFICATION</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Mind Brother, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your User Content</li>
                <li>Your violation of any rights of another person</li>
                <li>Your violation of any applicable laws</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. DISPUTE RESOLUTION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">12.1 Governing Law</h3>
              <p className="mb-4">
                These Terms are governed by the laws of [Your State/Country], without regard to conflict of law principles.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-900 mb-2">12.2 Arbitration Agreement</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Any dispute arising from these Terms or the Service shall be resolved through binding arbitration, except:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-yellow-800">
                  <li>Small claims court actions</li>
                  <li>Injunctive relief for intellectual property</li>
                  <li>Disputes that cannot be arbitrated under applicable law</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-orange-900 mb-2">12.3 Class Action Waiver</h3>
                <p className="text-sm text-orange-800 font-semibold">
                  <strong>YOU AGREE TO RESOLVE DISPUTES INDIVIDUALLY. YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS OR CLASS ARBITRATIONS.</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">12.4 Arbitration Process</h3>
              <p className="mb-4">
                Arbitration shall be conducted by a neutral arbitrator in accordance with the American Arbitration Association's rules. The arbitrator's decision is final and binding.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">12.5 Exceptions</h3>
              <p>
                Either party may seek injunctive relief in court for intellectual property infringement, misuse of confidential information, or violations requiring immediate action.
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. MODIFICATIONS TO TERMS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">13.1 Right to Modify</h3>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. Changes become effective upon posting for material changes (with notice) or immediately for minor updates.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">13.2 Notice of Changes</h3>
              <p className="mb-2">For material changes, we will notify you via:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Email to your registered address</li>
                <li>In-app notification</li>
                <li>Notice on our website</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">13.3 Continued Use</h3>
              <p>
                Continued use of the Service after changes constitutes acceptance of the new Terms. If you disagree with changes, you must stop using the Service.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. TERMINATION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">14.1 By You</h3>
              <p className="mb-2">You may terminate your account at any time by:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Deleting your account in settings</li>
                <li>Contacting support</li>
                <li>Ceasing to use the Service</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">14.2 By Us</h3>
              <p className="mb-2">We may terminate or suspend your access immediately, without notice, for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Breach of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Prolonged inactivity</li>
                <li>Any reason at our discretion</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">14.3 Effect of Termination</h3>
              <p className="mb-2">Upon termination:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your right to use the Service ends immediately</li>
                <li>We may delete your account and data</li>
                <li>Sections that should survive (indemnification, liability limitations) remain in effect</li>
                <li>No refunds for unused subscription periods</li>
              </ul>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. GENERAL PROVISIONS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">15.1 Entire Agreement</h3>
              <p className="mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and Mind Brother.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">15.2 Severability</h3>
              <p className="mb-4">
                If any provision is found unenforceable, the remaining provisions remain in full effect.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">15.3 Waiver</h3>
              <p className="mb-4">
                Our failure to enforce any right or provision does not constitute a waiver of that right or provision.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">15.4 Assignment</h3>
              <p className="mb-4">
                You may not assign these Terms without our consent. We may assign these Terms without restriction.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">15.5 No Agency</h3>
              <p className="mb-4">
                No agency, partnership, joint venture, or employment relationship is created by these Terms.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">15.6 Force Majeure</h3>
              <p className="mb-4">
                We are not liable for delays or failures due to circumstances beyond our reasonable control.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">15.7 Notices</h3>
              <p className="mb-2">
                Notices to you may be sent to your registered email address. Notices to us should be sent to:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Mind Brother</strong><br/>
                  Email: legal@mindbrother.com<br/>
                  [Your Business Address]
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">15.8 Export Control</h3>
              <p>
                You agree to comply with all export and import laws and regulations.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. CONTACT INFORMATION</h2>
              <p className="mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> support@mindbrother.com<br/>
                  <strong>Website:</strong> [Your Website]<br/>
                  <strong>Mail:</strong> [Your Business Address]
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">ACKNOWLEDGMENT</h2>
              <p className="text-sm text-blue-800 mb-2">
                <strong>BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.</strong>
              </p>
              <p className="text-sm text-blue-800 font-semibold">
                <strong>YOU ALSO ACKNOWLEDGE THAT MIND BROTHER IS NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL OR MENTAL HEALTH CARE, AND THAT IN CASE OF EMERGENCY, YOU SHOULD CALL 911 OR 988.</strong>
              </p>
            </section>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                These Terms of Service are effective as of December 1, 2024.
              </p>
              {onClose && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={onClose}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



