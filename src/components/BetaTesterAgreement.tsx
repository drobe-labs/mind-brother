import React from 'react';

interface BetaTesterAgreementProps {
  onClose?: () => void;
  onAccept?: () => void;
}

export default function BetaTesterAgreement({ onClose, onAccept }: BetaTesterAgreementProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Beta Tester Agreement</h1>
              <p className="text-sm text-gray-500">Beta Testing Program - Informed Consent</p>
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

          {/* Welcome Section */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">WELCOME TO THE MIND BROTHER BETA PROGRAM</h2>
            <p className="text-gray-700 mb-4">
              Thank you for your interest in beta testing Mind Brother! This agreement explains what it means to be a beta tester, what we expect from you, and what you can expect from us.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-800 font-semibold">
                <strong>Please read this agreement carefully before participating in the beta program.</strong>
              </p>
            </div>
          </section>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 text-gray-700">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. BETA PROGRAM OVERVIEW</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">1.1 What is Beta Testing?</h3>
              <p className="mb-2">
                Beta testing means you'll use an <strong>early, pre-release version</strong> of Mind Brother to help us identify issues, gather feedback, and improve the app before public launch.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-yellow-900 mb-2">This version is:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                  <li>Not final or complete</li>
                  <li>May contain bugs, errors, or crashes</li>
                  <li>Subject to frequent changes</li>
                  <li>Potentially unstable</li>
                  <li>Not fully tested or validated</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">1.2 Purpose of Beta Testing</h3>
              <p className="mb-2">By participating, you help us:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Identify technical bugs and issues</li>
                <li>Test new features and functionality</li>
                <li>Evaluate user experience and design</li>
                <li>Gather feedback on AI responses and wellness content</li>
                <li>Understand how the app performs in real-world conditions</li>
                <li>Improve mental health support features</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. ELIGIBILITY AND REQUIREMENTS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">2.1 Eligibility Criteria</h3>
              <p className="mb-2">To participate in the beta program, you must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Be at least 18 years old</strong></li>
                <li><strong>Reside in the United States</strong> (for initial beta)</li>
                <li><strong>Own a compatible device</strong> (iOS 15+ or Android 10+)</li>
                <li><strong>Have stable internet connection</strong></li>
                <li><strong>Be willing to provide regular feedback</strong></li>
                <li><strong>Agree to this Beta Tester Agreement</strong></li>
                <li><strong>Accept our Terms of Service and Privacy Policy</strong></li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">2.2 Beta Tester Responsibilities</h3>
              <p className="mb-2">As a beta tester, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Use the app regularly</strong> and report your experiences</li>
                <li><strong>Provide honest, constructive feedback</strong></li>
                <li><strong>Report bugs, crashes, and technical issues</strong></li>
                <li><strong>Participate in surveys and feedback sessions</strong> (when requested)</li>
                <li><strong>Keep your app updated</strong> to the latest beta version</li>
                <li><strong>Not share your beta access</strong> with others</li>
                <li><strong>Maintain confidentiality</strong> about unreleased features</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. IMPORTANT DISCLAIMERS</h2>
              
              <div className="bg-red-600 text-white p-6 rounded-lg mb-4">
                <h3 className="font-bold text-xl mb-3">3.1 ⚠️ NOT FOR CRISIS SITUATIONS</h3>
                <p className="mb-2 font-semibold">
                  <strong>CRITICAL:</strong> The beta version of Mind Brother is <strong>NOT</strong> suitable for mental health crises or emergencies.
                </p>
                <p className="mb-3">IF YOU ARE IN CRISIS:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                  <li><strong>CALL 911</strong> for emergencies</li>
                  <li><strong>CALL 988</strong> for Suicide & Crisis Lifeline</li>
                  <li><strong>DO NOT rely on the beta app</strong> for urgent mental health needs</li>
                </ul>
                <p className="mb-2">The beta app is for wellness support only and should not be used if you're experiencing:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Thoughts of self-harm or suicide</li>
                  <li>Severe mental health symptoms</li>
                  <li>Medical emergencies</li>
                  <li>Situations requiring immediate professional intervention</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">3.2 Experimental Nature</h3>
              <p className="mb-2">You acknowledge and understand that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>The app is experimental and unfinished</strong></li>
                <li><strong>AI responses may be inaccurate, inappropriate, or unhelpful</strong></li>
                <li><strong>Features may not work as intended</strong></li>
                <li><strong>Data may be lost or corrupted</strong></li>
                <li><strong>The app may crash or become unavailable</strong></li>
                <li><strong>Your experience may be frustrating at times</strong></li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">3.3 No Medical Advice</h3>
              <p className="mb-2">Mind Brother beta:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Is not a medical device</strong></li>
                <li><strong>Does not provide medical advice, diagnosis, or treatment</strong></li>
                <li><strong>Is not a substitute for professional mental health care</strong></li>
                <li><strong>Should not be relied upon for health decisions</strong></li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold">
                  <strong>You should continue seeing your healthcare providers and not discontinue any treatment based on the beta app.</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2 mt-4">3.4 AI Limitations</h3>
              <p className="mb-2">Our AI assistant "Amani" is powered by artificial intelligence technology. You understand that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>AI may generate incorrect or nonsensical responses</strong></li>
                <li><strong>AI may not understand context or nuance</strong></li>
                <li><strong>AI responses are not from a human therapist</strong></li>
                <li><strong>AI may occasionally produce inappropriate content</strong> (we're working to prevent this)</li>
                <li><strong>AI cannot provide empathy or genuine emotional connection</strong></li>
                <li><strong>AI responses should not be considered professional advice</strong></li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. BETA ACCESS AND DURATION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">4.1 Beta Period</h3>
              <p className="mb-4">
                Beta testing will continue for an <strong>estimated 3-6 months</strong>, but may be extended or shortened at our discretion, ended early for individual testers, or terminated for any reason.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">4.2 Access Limitations</h3>
              <p className="mb-2">As a beta tester:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Access may be revoked at any time</strong> without notice</li>
                <li><strong>Not all features may be available</strong> to all testers</li>
                <li><strong>We may test different versions</strong> with different testers (A/B testing)</li>
                <li><strong>Service may be interrupted</strong> for updates or maintenance</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">4.3 No Guarantee of Continued Access</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Beta access does not guarantee access to the final product</strong></li>
                <li><strong>You may need to pay for the final version</strong> (though beta testers may receive discounts)</li>
                <li><strong>Your beta account may not transfer</strong> to the public release</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. CONFIDENTIALITY</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">5.1 What is Confidential</h3>
              <p className="mb-2">As a beta tester, you may have access to confidential information including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Unreleased features and functionality</li>
                <li>Product roadmaps and strategies</li>
                <li>Beta-only content and designs</li>
                <li>Performance metrics and analytics</li>
                <li>Business strategies and plans</li>
                <li>Other information not publicly available</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">5.2 Your Confidentiality Obligations</h3>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Keep beta features confidential</strong> until public release</li>
                <li><strong>Not share screenshots or videos</strong> of unreleased features on social media</li>
                <li><strong>Not discuss specific features</strong> with non-beta testers</li>
                <li><strong>Not share your beta access credentials</strong> with others</li>
                <li><strong>Not reverse engineer</strong> or attempt to extract code</li>
              </ul>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-green-900 mb-2">You MAY:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                  <li>Discuss your general experience ("I'm beta testing Mind Brother")</li>
                  <li>Share feedback with us directly</li>
                  <li>Discuss publicly announced features</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">5.3 Exceptions</h3>
              <p className="mb-2">Confidentiality does not apply to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Information you already knew before beta testing</li>
                <li>Information that becomes publicly available (not through your breach)</li>
                <li>Information you're legally required to disclose</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">5.4 Consequences of Breach</h3>
              <p className="mb-2">Violation of confidentiality may result in:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Immediate termination from beta program</li>
                <li>Legal action for damages</li>
                <li>Loss of access to future beta programs</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. FEEDBACK AND DATA COLLECTION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">6.1 Feedback You Provide</h3>
              <p className="mb-2">Any feedback, suggestions, ideas, or comments you provide:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Become our property</strong></li>
                <li><strong>May be used without compensation or attribution</strong></li>
                <li><strong>May be incorporated into the product</strong></li>
                <li><strong>Are provided voluntarily</strong></li>
              </ul>
              <p className="text-sm text-gray-600 mb-4">We appreciate your feedback but cannot compensate you for it.</p>

              <h3 className="font-semibold text-gray-800 mb-2">6.2 Data We Collect During Beta</h3>
              <p className="mb-2">In addition to data described in our Privacy Policy, during beta we may collect:</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 mb-2">Technical Data:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                  <li>Crash reports and error logs</li>
                  <li>Performance metrics (speed, battery usage)</li>
                  <li>Device information and specifications</li>
                  <li>Network connectivity data</li>
                  <li>Feature usage analytics</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 mb-2">Behavioral Data:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                  <li>How you navigate the app</li>
                  <li>Which features you use most</li>
                  <li>Time spent on different screens</li>
                  <li>Interaction patterns with AI</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">Feedback Data:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                  <li>Survey responses</li>
                  <li>In-app feedback submissions</li>
                  <li>Email communications with beta team</li>
                  <li>Interview or focus group recordings (with consent)</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2 mt-4">6.3 How We Use Beta Data</h3>
              <p className="mb-2">Beta data helps us:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Fix bugs and technical issues</li>
                <li>Improve AI responses and accuracy</li>
                <li>Enhance user experience</li>
                <li>Validate features and design decisions</li>
                <li>Prepare for public launch</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">6.4 Data Retention</h3>
              <p className="mb-2">Beta data may be retained:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>During the beta period</li>
                <li>After beta ends for analysis</li>
                <li>Indefinitely in anonymized form</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">6.5 Your Data Rights</h3>
              <p className="mb-2">Even during beta, you have rights to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access your data</li>
                <li>Request deletion</li>
                <li>Opt out of certain data collection</li>
                <li>Export your information</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. RISKS AND CONSENT</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">7.1 Potential Risks</h3>
              <p className="mb-2">By participating in beta testing, you acknowledge these potential risks:</p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-red-900 mb-2">Technical Risks:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                  <li>App crashes or freezes</li>
                  <li>Data loss or corruption</li>
                  <li>Battery drain or device slowdown</li>
                  <li>Network data usage</li>
                  <li>Storage space consumption</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-orange-900 mb-2">User Experience Risks:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-orange-800">
                  <li>Frustration from bugs or poor performance</li>
                  <li>Incomplete or confusing features</li>
                  <li>Inconsistent AI responses</li>
                  <li>Time invested without benefit</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-yellow-900 mb-2">Mental Health Risks:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                  <li>AI may provide unhelpful or insensitive responses</li>
                  <li>Features may not work when you need them</li>
                  <li>Reliance on beta app for support may be disappointing</li>
                  <li>App instability during vulnerable moments</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">Privacy Risks:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-blue-800">
                  <li>Beta software may have unknown security vulnerabilities</li>
                  <li>Increased data collection for testing purposes</li>
                  <li>Potential exposure of sensitive information</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-6 mt-6">
                <h3 className="font-semibold text-green-900 mb-3">7.2 Informed Consent</h3>
                <p className="text-sm text-green-800 font-semibold mb-3">
                  <strong>BY PARTICIPATING IN BETA TESTING, YOU:</strong>
                </p>
                <ul className="list-none space-y-2 text-sm text-green-800">
                  <li>✅ <strong>Acknowledge</strong> that you've read and understood this agreement</li>
                  <li>✅ <strong>Understand</strong> the experimental nature of the beta app</li>
                  <li>✅ <strong>Accept</strong> the risks described above</li>
                  <li>✅ <strong>Agree</strong> not to use the beta app for crisis situations</li>
                  <li>✅ <strong>Consent</strong> to data collection for testing purposes</li>
                  <li>✅ <strong>Agree</strong> to maintain confidentiality</li>
                  <li>✅ <strong>Understand</strong> that beta access may be revoked</li>
                  <li>✅ <strong>Acknowledge</strong> that the app may not work as expected</li>
                </ul>
                <p className="text-sm text-green-800 font-semibold mt-4">
                  <strong>YOU ARE VOLUNTARILY PARTICIPATING WITH FULL KNOWLEDGE OF THE RISKS.</strong>
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. NO WARRANTY</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">8.1 "AS IS" Provision</h3>
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  <strong>THE BETA APP IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES.</strong>
                </p>
                <p className="text-sm text-gray-700 mb-2">We make no guarantees that the beta app will:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                  <li>Be error-free or uninterrupted</li>
                  <li>Meet your requirements or expectations</li>
                  <li>Be suitable for any particular purpose</li>
                  <li>Provide accurate or reliable information</li>
                  <li>Be secure or free from vulnerabilities</li>
                  <li>Continue to be available</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">8.2 No Support Obligation</h3>
              <p className="mb-2">While we appreciate feedback:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>We are not obligated to fix bugs</strong> you report</li>
                <li><strong>We may not respond</strong> to every piece of feedback</li>
                <li><strong>We may not implement</strong> your suggestions</li>
                <li><strong>We may remove features</strong> you like</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">8.3 Use at Your Own Risk</h3>
              <p className="mb-2 font-semibold">
                <strong>YOU USE THE BETA APP AT YOUR OWN RISK.</strong>
              </p>
              <p className="mb-2">We are not liable for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Problems caused by beta software</li>
                <li>Time or resources spent testing</li>
                <li>Disappointment or frustration</li>
                <li>Any damages resulting from beta participation</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. LIMITATION OF LIABILITY</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">9.1 Maximum Liability</h3>
                <p className="text-sm text-red-800 font-semibold">
                  <strong>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM BETA TESTING SHALL NOT EXCEED $100 (ONE HUNDRED DOLLARS).</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">9.2 No Liability For</h3>
              <p className="mb-2">We are not liable for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Technical issues:</strong> Crashes, data loss, device problems</li>
                <li><strong>Mental health outcomes:</strong> Decisions based on AI responses</li>
                <li><strong>Time investment:</strong> Hours spent testing without benefit</li>
                <li><strong>Missed features:</strong> Functionality not included in beta</li>
                <li><strong>Consequential damages:</strong> Any indirect harms</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">9.3 State Law Variations</h3>
              <p>
                Some states do not allow limitations on liability, so the above may not fully apply to you.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. COMPENSATION</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-900 mb-2">10.1 No Payment</h3>
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  <strong>Beta testing is voluntary and unpaid.</strong> You will not receive:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                  <li>Monetary compensation</li>
                  <li>Gift cards or prizes</li>
                  <li>Guaranteed rewards</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">10.2 Potential Benefits</h3>
              <p className="mb-2">We may offer beta testers (at our discretion):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Free subscription</strong> to the beta app during testing</li>
                <li><strong>Discounted subscription</strong> to the final product</li>
                <li><strong>Early access</strong> to new features</li>
                <li><strong>Recognition</strong> as beta tester (if you consent)</li>
                <li><strong>Swag or merchandise</strong> (limited, no guarantee)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                These are gifts, not payment, and are not guaranteed.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. TERMINATION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">11.1 Termination by You</h3>
              <p className="mb-2">You may leave the beta program at any time by:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Uninstalling the app</li>
                <li>Emailing beta@mindbrother.com</li>
                <li>Ceasing to use the beta app</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">11.2 Termination by Us</h3>
              <p className="mb-2">We may terminate your beta access:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Without notice or reason</li>
                <li>For violating this agreement</li>
                <li>For providing false feedback</li>
                <li>For breaching confidentiality</li>
                <li>For abusive behavior</li>
                <li>For any reason at our discretion</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">11.3 Effect of Termination</h3>
              <p className="mb-2">Upon termination:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your access ends immediately</li>
                <li>You must uninstall the beta app</li>
                <li>Confidentiality obligations continue</li>
                <li>We may delete your beta account and data</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. PRIVACY AND TERMS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">12.1 Additional Agreements</h3>
              <p className="mb-2">This Beta Tester Agreement is in addition to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Mind Brother <strong>Terms of Service</strong></li>
                <li>Mind Brother <strong>Privacy Policy</strong></li>
                <li>Mind Brother <strong>Crisis Disclaimer</strong></li>
              </ul>
              <p className="mb-4">You must accept all of these to participate.</p>

              <h3 className="font-semibold text-gray-800 mb-2">12.2 Conflicts</h3>
              <p className="mb-2">If there's a conflict between this Agreement and other documents:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>This Beta Agreement takes priority for beta-specific matters</li>
                <li>Terms of Service take priority for general use</li>
                <li>Privacy Policy governs all data practices</li>
              </ul>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. UPDATES TO THIS AGREEMENT</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">13.1 Changes</h3>
              <p className="mb-2">We may update this Beta Tester Agreement:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>At any time during the beta period</li>
                <li>With notice via email or in-app</li>
                <li>To reflect program changes</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">13.2 Continued Participation</h3>
              <p>
                Continued use of the beta app after changes means you accept the updated agreement.
              </p>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. GENERAL PROVISIONS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">14.1 Entire Agreement</h3>
              <p className="mb-4">
                This Agreement, Terms of Service, and Privacy Policy constitute the entire agreement for beta testing.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">14.2 Severability</h3>
              <p className="mb-4">
                If any provision is found unenforceable, the rest remains in effect.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">14.3 No Assignment</h3>
              <p className="mb-4">
                You cannot transfer your beta access to anyone else.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">14.4 Governing Law</h3>
              <p className="mb-4">
                This Agreement is governed by the laws of [Your State], United States.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">14.5 Dispute Resolution</h3>
              <p>
                Disputes will be resolved through arbitration as described in our Terms of Service.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. CONTACT INFORMATION</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>For Beta Program Questions:</strong><br/>
                  <strong>Email:</strong> beta@mindbrother.com<br/>
                  <strong>Subject Line:</strong> "Beta Program Inquiry"
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>For Technical Issues:</strong><br/>
                  <strong>Email:</strong> support@mindbrother.com<br/>
                  <strong>Subject Line:</strong> "Beta Bug Report"
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>For Feedback:</strong><br/>
                  • Use in-app feedback feature<br/>
                  • Email: feedback@mindbrother.com<br/>
                  • Participate in surveys when invited
                </p>
              </div>
            </section>

            {/* Consent and Acknowledgment */}
            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">CONSENT AND ACKNOWLEDGMENT</h2>
              <p className="text-sm text-blue-800 font-semibold mb-3">
                <strong>BY CLICKING "I AGREE" OR BY USING THE MIND BROTHER BETA APP, YOU:</strong>
              </p>
              <ul className="list-none space-y-2 text-sm text-blue-800">
                <li>✅ Confirm you are at least 18 years old</li>
                <li>✅ Have read and understood this Beta Tester Agreement</li>
                <li>✅ Accept all terms and conditions</li>
                <li>✅ Understand the experimental nature of the beta</li>
                <li>✅ Acknowledge the risks of beta participation</li>
                <li>✅ Agree to maintain confidentiality</li>
                <li>✅ Consent to data collection for testing</li>
                <li>✅ Agree not to use the beta app for crisis situations</li>
                <li>✅ Understand that beta access may be revoked</li>
                <li>✅ Accept that the app is provided "as is" with no warranties</li>
              </ul>
              <p className="text-sm text-blue-800 font-semibold mt-4">
                <strong>YOU ARE VOLUNTARILY PARTICIPATING IN THE BETA PROGRAM.</strong>
              </p>
            </section>

            {/* Emergency Reminder */}
            <section className="bg-red-600 text-white p-6 rounded-lg mt-8">
              <h2 className="text-xl font-bold mb-3">EMERGENCY REMINDER</h2>
              <p className="mb-3 font-semibold">🚨 IF YOU ARE IN CRISIS:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                <li><strong>CALL 911</strong> for emergencies</li>
                <li><strong>CALL 988</strong> for Suicide & Crisis Lifeline</li>
                <li><strong>DO NOT rely on the beta app</strong></li>
              </ul>
              <p className="font-semibold">
                <strong>The beta app is NOT for crisis situations.</strong>
              </p>
            </section>

            {/* Thank You */}
            <section className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-semibold text-green-900 mb-3">THANK YOU FOR BETA TESTING!</h2>
              <p className="text-green-800 mb-4">
                Your participation helps us build a better mental wellness platform for Black and Brown men. We appreciate your time, feedback, and patience as we work to create something meaningful together.
              </p>
              <p className="text-sm text-green-700">
                <strong>Questions?</strong> Email beta@mindbrother.com
              </p>
            </section>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Beta Tester Agreement effective as of December 1, 2024
              </p>
              <p className="text-sm text-gray-500 text-center mt-1">
                Mind Brother Beta Testing Program
              </p>
              {onAccept && (
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={onAccept}
                    className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
                  >
                    I Agree
                  </button>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="bg-gray-300 text-gray-700 px-8 py-3 rounded-md hover:bg-gray-400 transition-colors font-semibold"
                    >
                      Decline
                    </button>
                  )}
                </div>
              )}
              {!onAccept && onClose && (
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



