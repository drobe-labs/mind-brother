interface PrivacyNoticeProps {
  onAccept?: () => void;
  onDecline?: () => void;
  showFullNotice?: boolean;
}

export default function PrivacyNotice({ onAccept, showFullNotice = true }: PrivacyNoticeProps) {
  if (showFullNotice) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-500">Last Updated: December 1, 2024</p>
              </div>
              {onAccept && (
                <button
                  onClick={onAccept}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              )}
            </div>

            {/* Introduction */}
            <section className="mb-6">
              <p className="text-gray-700 mb-4">
                Mind Brother ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services (the "Service").
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-800 font-semibold">
                  <strong>Please read this Privacy Policy carefully.</strong> By using the Service, you agree to the collection and use of information in accordance with this policy.
                </p>
              </div>
            </section>

            {/* Key Points */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">KEY POINTS</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                <li>We collect personal and health information to provide wellness support</li>
                <li>Your conversations with Amani (our AI assistant) are processed to generate responses</li>
                <li>We use third-party services (ElevenLabs, Anthropic, Supabase) to operate the Service</li>
                <li>We do not sell your personal information</li>
                <li>You have rights to access, delete, and control your data</li>
                <li>We implement security measures to protect your information</li>
              </ul>
            </section>

            {/* Terms Content */}
            <div className="prose prose-sm sm:prose max-w-none space-y-6 text-gray-700">
              
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. INFORMATION WE COLLECT</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">1.1 Information You Provide Directly</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Account Information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Phone number (optional)</li>
                    <li>Password (encrypted)</li>
                    <li>Date of birth</li>
                    <li>Profile picture (optional)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Profile Information:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Gender identity</li>
                    <li>Location (city/state, optional)</li>
                    <li>Wellness goals</li>
                    <li>Fitness preferences</li>
                    <li>Health conditions or concerns you choose to share</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Communication Data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Messages and conversations with Amani (AI assistant)</li>
                    <li>Voice recordings (if you use voice features)</li>
                    <li>Feedback and survey responses</li>
                    <li>Support inquiries</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Fitness and Wellness Data:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Workout completion and progress</li>
                    <li>Breathing exercise usage</li>
                    <li>Fitness goals and achievements</li>
                    <li>Activity logs</li>
                    <li>Mood check-ins</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">Professional User Information (for licensed professionals):</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-blue-800">
                    <li>Professional license number and type</li>
                    <li>State of licensure</li>
                    <li>National Provider Identifier (NPI)</li>
                    <li>Professional credentials and certifications</li>
                    <li>Proof of liability insurance</li>
                    <li>Educational background</li>
                    <li>Professional bio and expertise</li>
                  </ul>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2 mt-4">1.2 Information Collected Automatically</h3>
                <p className="mb-2">Usage Data:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Device type and operating system</li>
                  <li>App version</li>
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>Pages visited and features used</li>
                  <li>Time spent on different screens</li>
                  <li>Click and navigation patterns</li>
                  <li>Crash reports and error logs</li>
                </ul>

                <p className="mb-2">Device Information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Device identifiers (IDFA, Android ID)</li>
                  <li>Device settings</li>
                  <li>Operating system version</li>
                  <li>Screen resolution</li>
                  <li>Time zone</li>
                  <li>Mobile carrier</li>
                </ul>

                <p className="mb-2">Location Data:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Approximate location (city/state level) based on IP address</li>
                  <li>Precise location (only if you grant permission for location-based features)</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2 mt-4">1.3 Information from Third Parties</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Social Media:</strong> If you connect social media accounts, we may receive profile information according to your privacy settings on those platforms</li>
                  <li><strong>Payment Processors:</strong> Payment confirmation and subscription status (we do not store payment card numbers)</li>
                  <li><strong>Professional Verification Services:</strong> License verification data from state licensing boards and background check information (for professional users)</li>
                </ul>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. HOW WE USE YOUR INFORMATION</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">2.1 To Provide and Improve the Service</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Process and respond to your interactions with Amani</li>
                  <li>Personalize wellness recommendations and content</li>
                  <li>Track your fitness and wellness progress</li>
                  <li>Provide breathing exercises and guided meditations</li>
                  <li>Generate voice responses using text-to-speech technology</li>
                  <li>Improve our AI models and algorithms</li>
                  <li>Develop new features and services</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                </ul>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">2.2 AI Training and Development</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Important:</strong> Your conversations with Amani may be used to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-yellow-800 mb-2">
                    <li>Improve AI response quality and accuracy</li>
                    <li>Train and refine machine learning models</li>
                    <li>Identify and fix errors or inappropriate responses</li>
                    <li>Develop better mental health support capabilities</li>
                  </ul>
                  <p className="text-sm text-yellow-800 font-semibold">
                    <strong>We anonymize and aggregate this data when possible, but cannot guarantee complete de-identification of all conversations.</strong>
                  </p>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">2.3 Communications</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Send you service-related notifications</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Send wellness tips and motivational content (if you opt in)</li>
                  <li>Notify you of updates, new features, or changes to the Service</li>
                  <li>Send administrative information about your account</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">2.4 Safety and Security</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Monitor for violations of our Terms of Service</li>
                  <li>Protect against security threats</li>
                  <li>Comply with legal obligations</li>
                  <li>Respond to emergency situations</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">2.5 Professional Network Features</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Verify credentials of mental health professionals</li>
                  <li>Connect users with licensed professionals</li>
                  <li>Facilitate secure communications between users and professionals</li>
                  <li>Monitor professional conduct and quality</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">2.6 Research and Analytics</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Conduct research on mental health and wellness (with anonymized data)</li>
                  <li>Generate aggregate statistics and insights</li>
                  <li>Measure effectiveness of wellness interventions</li>
                  <li>Publish research findings (using de-identified data only)</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. HOW WE SHARE YOUR INFORMATION</h2>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-900 mb-2">3.1 We Do Not Sell Your Data</h3>
                  <p className="text-sm text-green-800 font-semibold">
                    <strong>We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</strong>
                  </p>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">3.2 Service Providers</h3>
                <p className="mb-2">We share information with third-party service providers who help us operate the Service:</p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">AI and Technology Partners:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li><strong>Anthropic (Claude AI):</strong> Processes your messages to generate Amani's responses</li>
                    <li><strong>ElevenLabs:</strong> Converts text to speech for voice responses</li>
                    <li><strong>Supabase:</strong> Hosts and manages our database and authentication</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Infrastructure and Operations:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Cloud hosting providers</li>
                    <li>Analytics services</li>
                    <li>Payment processors (Apple, Google, Stripe)</li>
                    <li>Email and notification services</li>
                    <li>Security and fraud prevention services</li>
                  </ul>
                </div>

                <p className="mb-2">These providers:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Are contractually obligated to protect your data</li>
                  <li>May only use data to provide services to us</li>
                  <li>Must comply with applicable privacy laws</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">3.3 Professional Users</h3>
                <p className="mb-2">If you choose to connect with a licensed mental health professional through our platform:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Your profile information and communication history may be shared with that professional</li>
                  <li>Professionals are bound by their own professional confidentiality obligations</li>
                  <li>We are not responsible for professionals' handling of your information</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">3.4 Legal Requirements</h3>
                <p className="mb-2">We may disclose your information if required to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Comply with legal processes (subpoenas, court orders)</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Protect our rights, property, or safety</li>
                  <li>Protect the rights, property, or safety of others</li>
                  <li>Prevent fraud or illegal activity</li>
                  <li>Respond to government requests</li>
                </ul>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-red-900 mb-2">3.5 Emergency Situations</h3>
                  <p className="text-sm text-red-800 mb-2">
                    <strong>If we believe there is imminent risk of harm to you or others, we may share information with:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-red-800">
                    <li>Emergency services (911)</li>
                    <li>Mental health crisis services</li>
                    <li>Designated emergency contacts (if you've provided them)</li>
                    <li>Healthcare providers</li>
                  </ul>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">3.6 Business Transfers</h3>
                <p className="mb-4">
                  If Mind Brother is acquired, merges, or sells assets, your information may be transferred. We will notify you and provide choices regarding your data.
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">3.7 Aggregate and De-identified Data</h3>
                <p className="mb-2">We may share aggregate, anonymized, or de-identified data that cannot reasonably be used to identify you:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>For research purposes</li>
                  <li>In published studies or reports</li>
                  <li>With academic or research institutions</li>
                  <li>For industry benchmarking</li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. THIRD-PARTY SERVICES</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">4.1 Services We Use</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2"><strong>Anthropic (Claude AI)</strong></p>
                  <ul className="list-none space-y-1 ml-2 text-sm text-gray-700">
                    <li>• Purpose: AI conversation processing</li>
                    <li>• Data Shared: Your messages and conversation history</li>
                    <li>• Privacy Policy: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.anthropic.com/privacy</a></li>
                  </ul>
                  </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2"><strong>ElevenLabs</strong></p>
                  <ul className="list-none space-y-1 ml-2 text-sm text-gray-700">
                    <li>• Purpose: Text-to-speech voice generation</li>
                    <li>• Data Shared: Text content for voice conversion</li>
                    <li>• Privacy Policy: <a href="https://elevenlabs.io/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://elevenlabs.io/privacy</a></li>
                  </ul>
                  </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2"><strong>Supabase</strong></p>
                  <ul className="list-none space-y-1 ml-2 text-sm text-gray-700">
                    <li>• Purpose: Database and authentication</li>
                    <li>• Data Shared: All stored user data</li>
                    <li>• Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://supabase.com/privacy</a></li>
                  </ul>
                  </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2"><strong>Payment Processors (Apple, Google, Stripe)</strong></p>
                  <ul className="list-none space-y-1 ml-2 text-sm text-gray-700">
                    <li>• Purpose: Process subscription payments</li>
                    <li>• Data Shared: Payment information (handled directly by processor)</li>
                    <li>• We do not store payment card information</li>
                  </ul>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">4.2 Third-Party Responsibilities</h3>
                <p className="mb-4">
                  These services have their own privacy policies and practices. We encourage you to review them. We are not responsible for third-party privacy practices.
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">4.3 International Data Transfers</h3>
                <p>
                  Some third-party services may process data outside your country of residence, including in the United States. We ensure appropriate safeguards are in place.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. DATA RETENTION</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">5.1 How Long We Keep Your Data</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Active Accounts:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Account data: As long as your account is active</li>
                    <li>Conversation history: Retained for service improvement and personalization</li>
                    <li>Fitness/wellness data: Retained while account is active</li>
                  </ul>
                  </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Deleted Accounts:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Most data deleted within 30 days</li>
                    <li>Some data retained longer for legal compliance:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Transaction records: 7 years</li>
                        <li>Dispute-related data: Until resolved</li>
                        <li>Legal hold data: As required</li>
                      </ul>
                    </li>
                  </ul>
                  </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">Anonymized Data:</p>
                  <p className="text-sm text-gray-700">May be retained indefinitely for research and analytics</p>
                  </div>

                <h3 className="font-semibold text-gray-800 mb-2 mt-4">5.2 AI Training Data</h3>
                <p>
                  Conversations used to train AI models may be retained longer as they become part of the training dataset, but are anonymized when possible.
                </p>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. YOUR PRIVACY RIGHTS</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">6.1 Access and Portability</h3>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Access your personal information</li>
                  <li>Request a copy of your data in a portable format</li>
                  <li>Review your conversation history</li>
                  <li>View your fitness and wellness data</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>How to exercise:</strong> Use in-app settings or contact support@mindbrother.com
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">6.2 Correction and Update</h3>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Correct inaccurate information</li>
                  <li>Update outdated information</li>
                  <li>Complete incomplete information</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>How to exercise:</strong> Update directly in app settings or contact support
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">6.3 Deletion</h3>
                <p className="mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Delete your account and associated data</li>
                  <li>Request deletion of specific information</li>
                  <li>Be "forgotten" (subject to legal retention requirements)</li>
                </ul>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>How to exercise:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-4 mb-4 text-sm text-gray-700">
                  <li>In-app: Settings → Account → Delete Account</li>
                  <li>Email: support@mindbrother.com with "Delete My Data" subject</li>
                </ol>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Note:</strong> Some data may be retained for legal compliance or legitimate business purposes.
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">6.4 Opt-Out Rights</h3>
                <p className="mb-2">You have the right to opt out of:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li><strong>Marketing communications:</strong> Unsubscribe link in emails or app settings</li>
                  <li><strong>Data processing for AI training:</strong> Contact support (may limit functionality)</li>
                  <li><strong>Push notifications:</strong> Device settings</li>
                  <li><strong>Location tracking:</strong> Device settings</li>
                  <li><strong>Voice features:</strong> Use text-only mode</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">6.5 Data Download</h3>
                <p className="mb-2">You can request a downloadable copy of your data including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Account information</li>
                  <li>Conversation history</li>
                  <li>Fitness and wellness logs</li>
                  <li>Usage data</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Processing time:</strong> Within 30 days of request
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">6.6 State-Specific Rights</h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-blue-900 mb-2">California Residents (CCPA/CPRA):</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-blue-800">
                    <li>Right to know what data we collect</li>
                    <li>Right to deletion</li>
                    <li>Right to opt-out of sale (we don't sell data)</li>
                    <li>Right to non-discrimination</li>
                    <li>Right to correct inaccurate information</li>
                  </ul>
                  </div>

                <p className="mb-2">Virginia, Colorado, Connecticut, Utah Residents:</p>
                <p className="mb-4 text-sm text-gray-600">Similar rights under respective state laws</p>

                <p className="mb-2">Nevada Residents:</p>
                <p className="mb-4 text-sm text-gray-600">Right to opt-out of sale (we don't sell data)</p>

                <p className="text-sm text-gray-600 mb-4">
                  <strong>To exercise state-specific rights:</strong> Email privacy@mindbrother.com with "State Privacy Rights" subject
                </p>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">6.7 European Users (GDPR)</h3>
                  <p className="text-sm text-purple-800 mb-2">If you're in the EU/EEA/UK:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-purple-800 mb-2">
                    <li>Right to access</li>
                    <li>Right to rectification</li>
                    <li>Right to erasure ("right to be forgotten")</li>
                    <li>Right to restrict processing</li>
                    <li>Right to data portability</li>
                    <li>Right to object to processing</li>
                    <li>Right to withdraw consent</li>
                    <li>Right to lodge a complaint with supervisory authority</li>
                  </ul>
                  <p className="text-sm text-purple-800 font-semibold mt-2">
                    <strong>Legal Basis for Processing:</strong> Consent (for optional features), Contract (to provide the Service), Legitimate interests (for improvements and security), Legal obligations (to comply with laws)
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. CHILDREN'S PRIVACY</h2>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-red-900 mb-2">7.1 Age Restriction</h3>
                  <p className="text-sm text-red-800 font-semibold">
                    Mind Brother is <strong>not intended for children under 18</strong>. We do not knowingly collect information from anyone under 18.
                  </p>
                    </div>

                <h3 className="font-semibold text-gray-800 mb-2">7.2 If We Learn of Underage Use</h3>
                <p className="mb-2">If we discover we have collected information from someone under 18:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>We will delete the information promptly</li>
                  <li>We will terminate the account</li>
                  <li>We will not use the information</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">7.3 Parental Notice</h3>
                <p>
                  If you believe a child under 18 has provided information to us, contact us immediately at privacy@mindbrother.com.
                </p>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. DATA SECURITY</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">8.1 Security Measures</h3>
                <p className="mb-2">We implement reasonable security measures including:</p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Technical Safeguards:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Encryption in transit (TLS/SSL)</li>
                    <li>Encryption at rest for sensitive data</li>
                    <li>Secure authentication (passwords hashed with bcrypt)</li>
                    <li>Firewalls and intrusion detection</li>
                    <li>Regular security audits</li>
                    <li>Access controls and monitoring</li>
                  </ul>
                  </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Organizational Safeguards:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                    <li>Limited employee access to personal data</li>
                    <li>Confidentiality agreements with employees and vendors</li>
                    <li>Security training for staff</li>
                    <li>Incident response procedures</li>
                  </ul>
                    </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">8.2 Limitations</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>No system is 100% secure.</strong> While we strive to protect your information:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                    <li>We cannot guarantee absolute security</li>
                    <li>You are responsible for keeping your password secure</li>
                    <li>Public WiFi networks pose security risks</li>
                    <li>Device security is your responsibility</li>
                  </ul>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">8.3 Data Breach Notification</h3>
                <p className="mb-2">If a data breach affects your information, we will:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Notify you promptly as required by law</li>
                  <li>Explain what information was compromised</li>
                  <li>Describe steps we're taking to address the breach</li>
                  <li>Provide guidance on protecting yourself</li>
                </ul>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. INTERNATIONAL USERS</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">9.1 Data Transfers</h3>
                <p className="mb-4">
                  Mind Brother operates in the United States. If you use the Service from outside the U.S., your data will be transferred to and processed in the U.S. U.S. privacy laws may differ from your country's laws. We implement appropriate safeguards for international transfers.
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">9.2 European Union Users</h3>
                <p className="mb-2">For EU/EEA users, we rely on:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Standard Contractual Clauses (SCCs) for third-party transfers</li>
                  <li>Adequacy decisions where applicable</li>
                  <li>Your explicit consent when required</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">9.3 Data Protection Officer</h3>
                <p>
                  EU users may contact our Data Protection Officer at: dpo@mindbrother.com
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. COOKIES AND TRACKING</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">10.1 What We Use</h3>
                <p className="mb-2">Cookies:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Authentication cookies (essential)</li>
                  <li>Preference cookies (remember settings)</li>
                  <li>Analytics cookies (understand usage)</li>
                </ul>
                <p className="mb-2">Similar Technologies:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Local storage</li>
                  <li>Device identifiers</li>
                  <li>SDKs (software development kits)</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">10.2 Types of Cookies</h3>
                <p className="mb-2"><strong>Essential Cookies:</strong> Required for the Service to function</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Cannot be disabled</li>
                  <li>Include authentication and security cookies</li>
                </ul>
                <p className="mb-2"><strong>Analytics Cookies:</strong> Help us understand how you use the Service</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Can be disabled in settings</li>
                  <li>Used for improving user experience</li>
                </ul>
                <p className="mb-2"><strong>Third-Party Cookies:</strong> From service providers</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Subject to third-party privacy policies</li>
                  <li>May include advertising or analytics providers</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">10.3 Your Choices</h3>
                <p className="mb-2">Control Cookies:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>In-app settings</li>
                  <li>Browser settings</li>
                  <li>Device settings</li>
                </ul>
                  <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Disabling cookies may limit functionality.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. DO NOT TRACK SIGNALS</h2>
                <p>
                  Some browsers have "Do Not Track" (DNT) features. We do not currently respond to DNT signals, as there is no industry standard for how to interpret them.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">12. CHANGES TO THIS PRIVACY POLICY</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">12.1 Right to Modify</h3>
                <p className="mb-2">We may update this Privacy Policy from time to time to reflect:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Changes in our practices</li>
                  <li>Legal or regulatory requirements</li>
                  <li>New features or services</li>
                  <li>Technological developments</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">12.2 Notice of Changes</h3>
                <p className="mb-2">For material changes, we will notify you via:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Email to your registered address</li>
                  <li>In-app notification</li>
                  <li>Prominent notice on our website</li>
                  <li>Updated "Last Updated" date at the top</li>
                </ul>

                <h3 className="font-semibold text-gray-800 mb-2">12.3 Your Acceptance</h3>
                <p>
                  Continued use after changes constitutes acceptance. If you disagree with changes, you must stop using the Service and may request deletion of your data.
                </p>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">13. CONTACT US</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">13.1 Privacy Questions</h3>
                <p className="mb-2">For questions about this Privacy Policy or our data practices:</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> privacy@mindbrother.com<br/>
                    <strong>Support:</strong> support@mindbrother.com<br/>
                    <strong>Mail:</strong><br/>
                    Mind Brother<br/>
                    [Your Business Address]<br/>
                    [City, State, ZIP]
                  </p>
                </div>

                <h3 className="font-semibold text-gray-800 mb-2">13.2 Data Rights Requests</h3>
                <p className="mb-2">To exercise your privacy rights:</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> privacy@mindbrother.com<br/>
                    <strong>Subject Line:</strong> "Privacy Rights Request"<br/>
                    <strong>Include:</strong> Your name, email, and specific request
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  We will respond within 30 days (or as required by applicable law).
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">13.3 Complaints</h3>
                <p className="mb-2">If you believe we have not adequately addressed your privacy concerns:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>U.S. Users:</strong> Federal Trade Commission (FTC)</li>
                  <li><strong>EU Users:</strong> Your local Data Protection Authority</li>
                  <li><strong>California Users:</strong> California Attorney General</li>
                </ul>
              </section>

              {/* Section 14 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">14. ADDITIONAL INFORMATION</h2>
                
                <h3 className="font-semibold text-gray-800 mb-2">14.1 Health Information</h3>
                <p className="mb-4">
                  While Mind Brother is a wellness app, not a medical service, information you share may be considered health information under certain laws.
                </p>
                <p className="mb-2"><strong>HIPAA:</strong> Mind Brother is not a HIPAA-covered entity. If you connect with healthcare professionals through our platform, they may be subject to HIPAA.</p>
                <p className="mb-4"><strong>State Health Privacy Laws:</strong> We comply with applicable state health privacy requirements.</p>

                <h3 className="font-semibold text-gray-800 mb-2">14.2 Professional-Client Communications</h3>
                <p className="mb-2">Communications between users and licensed professionals may be subject to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                  <li>Professional confidentiality obligations</li>
                  <li>State licensure requirements</li>
                  <li>Professional ethics codes</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Mind Brother acts as a platform facilitator and is not responsible for professional conduct or confidentiality breaches by professionals.</strong>
                </p>

                <h3 className="font-semibold text-gray-800 mb-2">14.3 Research and Studies</h3>
                <p className="mb-2">If we conduct research using your data:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>We will use anonymized or de-identified data when possible</li>
                  <li>We may seek your specific consent for certain research</li>
                  <li>You have the right to opt-out of research use</li>
                  <li>Research findings will not identify you</li>
                </ul>
              </section>

              {/* Acknowledgment */}
              <section className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">ACKNOWLEDGMENT</h2>
                <p className="text-sm text-blue-800 font-semibold">
                  <strong>BY USING MIND BROTHER, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS PRIVACY POLICY AND AGREE TO THE COLLECTION, USE, AND SHARING OF YOUR INFORMATION AS DESCRIBED HEREIN.</strong>
                </p>
              </section>

              {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  This Privacy Policy is effective as of December 1, 2024.
                </p>
                {onAccept && (
                  <div className="mt-4 flex justify-center">
                <button
                  onClick={onAccept}
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

  // Compact version for initial display (if needed)
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">🔒</span>
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-900">Your Data is Protected</h3>
          <div className="mt-1 text-sm text-blue-800">
            <p>We use industry-standard encryption and security practices to protect your personal information.</p>
              <button
              onClick={() => window.location.href = '#privacy'}
                className="text-blue-600 hover:text-blue-800 underline mt-1"
              >
                Learn more about our privacy practices
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
