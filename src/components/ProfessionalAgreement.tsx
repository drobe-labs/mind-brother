import React from 'react';

interface ProfessionalAgreementProps {
  onClose?: () => void;
  onAccept?: () => void;
}

export default function ProfessionalAgreement({ onClose, onAccept }: ProfessionalAgreementProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Professional User Agreement</h1>
              <p className="text-sm text-gray-500">Agreement for Licensed Mental Health Professionals</p>
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

          {/* Introduction */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. INTRODUCTION</h2>
            <p className="text-gray-700 mb-4">
              This Professional User Agreement ("Agreement") governs the use of Mind Brother's platform by licensed mental health professionals ("Professional," "you," or "your"). This Agreement is in addition to Mind Brother's general Terms of Service and Privacy Policy.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-800 font-semibold">
                <strong>By registering as a professional on Mind Brother, you agree to be bound by this Agreement.</strong>
              </p>
            </div>
          </section>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 text-gray-700">
            
            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. DEFINITIONS</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2"><strong>"Professional"</strong> means a licensed mental health professional including, but not limited to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                  <li>Licensed Clinical Psychologists</li>
                  <li>Licensed Professional Counselors (LPC)</li>
                  <li>Licensed Clinical Social Workers (LCSW)</li>
                  <li>Licensed Marriage and Family Therapists (LMFT)</li>
                  <li>Licensed Mental Health Counselors (LMHC)</li>
                  <li>Psychiatrists</li>
                  <li>Psychiatric Nurse Practitioners</li>
                  <li>Other licensed mental health providers</li>
                </ul>
                <p className="text-sm text-gray-700 mt-3">
                  <strong>"Platform"</strong> means Mind Brother's mobile application, website, and related services.<br/>
                  <strong>"Client"</strong> or <strong>"User"</strong> means individuals using Mind Brother who may connect with Professionals.<br/>
                  <strong>"Services"</strong> means professional services you provide through the Platform.
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. PROFESSIONAL ELIGIBILITY AND REQUIREMENTS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">3.1 Licensure Requirements</h3>
              <p className="mb-2">To register as a Professional, you must:</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <ul className="list-none space-y-2 text-sm text-green-800">
                  <li>✅ Hold a <strong>current, valid, active license</strong> in good standing</li>
                  <li>✅ Be licensed to practice in at least one <strong>U.S. state or territory</strong></li>
                  <li>✅ Have <strong>no disciplinary actions</strong> against your license</li>
                  <li>✅ Maintain <strong>professional liability (malpractice) insurance</strong></li>
                  <li>✅ Complete all required <strong>continuing education</strong> for your license</li>
                  <li>✅ Comply with your <strong>licensing board's requirements</strong></li>
                  <li>✅ Follow your profession's <strong>ethical codes and standards</strong></li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">3.2 Required Documentation</h3>
              <p className="mb-2">You must provide:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Professional License:</strong> Copy of current, valid license(s)</li>
                <li><strong>License Number:</strong> For each state where you're licensed</li>
                <li><strong>NPI Number:</strong> National Provider Identifier</li>
                <li><strong>Malpractice Insurance:</strong> Current certificate of insurance</li>
                <li><strong>Education Credentials:</strong> Degree verification</li>
                <li><strong>Photo ID:</strong> Government-issued identification</li>
                <li><strong>Background Check:</strong> Consent for background verification</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">3.3 Verification Process</h3>
              <p className="mb-2">Mind Brother will:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Verify your credentials with licensing boards</li>
                <li>Conduct background checks</li>
                <li>Review your professional history</li>
                <li>Validate insurance coverage</li>
                <li>Confirm education credentials</li>
              </ul>
              <p className="text-sm text-gray-600 mb-4">
                <strong>Verification typically takes 3-7 business days.</strong>
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">3.4 Ongoing Compliance</h3>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Update credentials</strong> within 30 days of any changes</li>
                <li><strong>Notify us immediately</strong> of license suspensions, restrictions, or disciplinary actions</li>
                <li><strong>Maintain current insurance</strong> at all times</li>
                <li><strong>Renew licenses</strong> before expiration</li>
                <li><strong>Report</strong> any change in practice status</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold">
                  <strong>Failure to maintain eligibility results in immediate suspension.</strong>
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. SCOPE OF PLATFORM</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">4.1 What Mind Brother Is</h3>
              <p className="mb-2">Mind Brother is a <strong>wellness platform</strong> that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Connects users with licensed professionals</li>
                <li>Facilitates secure messaging</li>
                <li>Provides wellness tools and resources</li>
                <li>Offers AI-powered wellness support (Amani)</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">4.2 What Mind Brother Is NOT</h3>
              <p className="mb-2">Mind Brother is:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>NOT a telehealth platform</strong> for delivering therapy</li>
                <li><strong>NOT a practice management system</strong></li>
                <li><strong>NOT a billing or claims processing service</strong></li>
                <li><strong>NOT responsible for</strong> your professional services</li>
                <li><strong>NOT a covered entity</strong> under HIPAA</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">4.3 Your Independent Practice</h3>
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  <strong>YOU ARE AN INDEPENDENT PRACTITIONER, NOT AN EMPLOYEE OF MIND BROTHER.</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                  <li>Mind Brother does not control your professional judgment</li>
                  <li>You determine your own practices and methods</li>
                  <li>You set your own availability and rates (if applicable)</li>
                  <li>You are responsible for your own professional conduct</li>
                  <li>You maintain your own client relationships</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. PROFESSIONAL RESPONSIBILITIES</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">5.1 Standard of Care</h3>
              <p className="mb-2">You agree to:</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <ul className="list-none space-y-2 text-sm text-green-800">
                  <li>✅ Provide services meeting <strong>professional standards of care</strong></li>
                  <li>✅ Exercise <strong>sound professional judgment</strong></li>
                  <li>✅ Maintain <strong>appropriate professional boundaries</strong></li>
                  <li>✅ Follow <strong>evidence-based practices</strong> when applicable</li>
                  <li>✅ Stay within your <strong>scope of competence</strong></li>
                  <li>✅ Comply with <strong>ethical codes</strong> of your profession</li>
                  <li>✅ Obtain <strong>informed consent</strong> from clients</li>
                  <li>✅ Maintain <strong>accurate records</strong> per your licensing requirements</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">5.2 Professional Ethics</h3>
              <p className="mb-2">You must adhere to ethical standards including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>American Psychological Association (APA)</strong> Code of Ethics (psychologists)</li>
                <li><strong>National Association of Social Workers (NASW)</strong> Code of Ethics (social workers)</li>
                <li><strong>American Counseling Association (ACA)</strong> Code of Ethics (counselors)</li>
                <li><strong>American Association for Marriage and Family Therapy (AAMFT)</strong> Code of Ethics (MFTs)</li>
                <li>Other applicable professional codes</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">5.3 Scope of Practice</h3>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Practice only within</strong> your licensed scope</li>
                <li><strong>Not provide services</strong> you're not trained or licensed to provide</li>
                <li><strong>Refer out</strong> when services are beyond your competence</li>
                <li><strong>Decline cases</strong> that present conflicts of interest</li>
                <li><strong>Not diagnose</strong> conditions outside your scope</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">5.4 Cultural Competence</h3>
              <p className="mb-2">You commit to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Providing culturally sensitive and appropriate care</li>
                <li>Understanding the unique needs of diverse communities</li>
                <li>Addressing implicit bias in your practice</li>
                <li>Seeking consultation when working with unfamiliar populations</li>
                <li>Continuing education in cultural competence</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. PROHIBITED ACTIVITIES</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">6.1 You MAY NOT:</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="list-none space-y-2 text-sm text-red-800">
                  <li>❌ <strong>Practice outside your licensed scope</strong></li>
                  <li>❌ <strong>Provide services in states where you're not licensed</strong> (unless allowed by telehealth compacts)</li>
                  <li>❌ <strong>Engage in dual relationships</strong> that create conflicts of interest</li>
                  <li>❌ <strong>Solicit personal relationships</strong> with clients</li>
                  <li>❌ <strong>Discriminate</strong> based on protected characteristics</li>
                  <li>❌ <strong>Breach client confidentiality</strong> (except where legally required)</li>
                  <li>❌ <strong>Misrepresent your credentials</strong> or qualifications</li>
                  <li>❌ <strong>Guarantee outcomes</strong> or make unrealistic promises</li>
                  <li>❌ <strong>Use the Platform</strong> for purposes other than professional services</li>
                  <li>❌ <strong>Circumvent the Platform</strong> to avoid fees (if applicable)</li>
                  <li>❌ <strong>Share or resell</strong> your professional account</li>
                  <li>❌ <strong>Use automated tools</strong> or bots to interact with clients</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">6.2 Content Prohibitions</h3>
              <p className="mb-2">You may not post or share:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Misleading health information</li>
                <li>Non-evidence-based treatments (without clear disclosure)</li>
                <li>Content promoting harmful practices</li>
                <li>Offensive, discriminatory, or harassing content</li>
                <li>Marketing that violates professional ethics</li>
                <li>Content that violates intellectual property rights</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. CONFIDENTIALITY AND HIPAA</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">7.1 Your HIPAA Responsibilities</h3>
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  <strong>As a licensed professional, YOU are likely a covered entity under HIPAA.</strong>
                </p>
                <p className="text-sm text-blue-800 mb-2">You are responsible for:</p>
                <ul className="list-none space-y-1 ml-2 text-sm text-blue-800">
                  <li>✅ Complying with <strong>HIPAA Privacy Rule</strong></li>
                  <li>✅ Complying with <strong>HIPAA Security Rule</strong></li>
                  <li>✅ Providing <strong>Notice of Privacy Practices</strong> to clients</li>
                  <li>✅ Obtaining required <strong>HIPAA authorizations</strong></li>
                  <li>✅ Maintaining <strong>appropriate safeguards</strong> for PHI</li>
                  <li>✅ Reporting <strong>breaches</strong> as required by law</li>
                  <li>✅ Training on HIPAA requirements</li>
                </ul>
                <p className="text-sm text-blue-800 font-semibold mt-2">
                  <strong>Mind Brother is NOT your Business Associate for HIPAA purposes.</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">7.2 Business Associate Agreement</h3>
              <p className="mb-2">If you require a Business Associate Agreement (BAA) with Mind Brother:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Contact legal@mindbrother.com</li>
                <li>BAA must be executed before using the Platform for PHI</li>
                <li>Additional terms and fees may apply</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 font-semibold">
                  <strong>Without a BAA, do not transmit PHI through the Platform.</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">7.3 Confidential Communications</h3>
              <p className="mb-2">You agree that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Client communications</strong> through the Platform are confidential</li>
                <li>You will <strong>not disclose</strong> client information except as legally required</li>
                <li>You will follow <strong>mandated reporting</strong> requirements</li>
                <li>You understand <strong>Platform security limitations</strong></li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">7.4 Mandated Reporting</h3>
              <p className="mb-2">You remain responsible for:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Reporting suspected child abuse or neglect</li>
                <li>Reporting elder or dependent adult abuse</li>
                <li>Complying with Tarasoff duties (duty to warn/protect)</li>
                <li>Other mandated reporting in your jurisdiction</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Mind Brother does not assume these responsibilities.</strong>
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. INFORMED CONSENT</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">8.1 Your Obligation to Obtain Consent</h3>
              <p className="mb-2">Before providing services through the Platform, you must:</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <ul className="list-none space-y-2 text-sm text-green-800">
                  <li>✅ Provide clients with <strong>informed consent</strong> documentation</li>
                  <li>✅ Explain <strong>nature and limits</strong> of services</li>
                  <li>✅ Disclose <strong>risks and benefits</strong> of digital communication</li>
                  <li>✅ Explain <strong>confidentiality</strong> and its limits</li>
                  <li>✅ Disclose your <strong>credentials and licensing</strong></li>
                  <li>✅ Explain <strong>emergency procedures</strong></li>
                  <li>✅ Provide <strong>contact information</strong> for licensing board</li>
                  <li>✅ Obtain <strong>documented consent</strong> before services begin</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">8.2 Platform-Specific Disclosures</h3>
              <p className="mb-2">Inform clients that:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Mind Brother is a platform, not a telehealth provider</li>
                <li>Communications may be reviewed for quality assurance</li>
                <li>Platform security limitations exist</li>
                <li>You are responsible for the professional relationship, not Mind Brother</li>
                <li>Emergency services are not available through the Platform</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">8.3 Documentation</h3>
              <p className="mb-2">You must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maintain signed consent forms</li>
                <li>Document all client interactions</li>
                <li>Keep records per your licensing requirements</li>
                <li>Produce records if required for licensing board investigations</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. MALPRACTICE INSURANCE</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">9.1 Insurance Requirement</h3>
                <p className="text-sm text-red-800 font-semibold mb-2">You MUST maintain:</p>
                <ul className="list-none space-y-1 ml-2 text-sm text-red-800">
                  <li>✅ <strong>Professional liability insurance</strong> (malpractice insurance)</li>
                  <li>✅ Coverage of at least <strong>$1,000,000 per occurrence</strong> and <strong>$3,000,000 aggregate</strong></li>
                  <li>✅ Coverage that includes <strong>telehealth/online services</strong></li>
                  <li>✅ <strong>Current policy</strong> at all times while using the Platform</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">9.2 Proof of Insurance</h3>
              <p className="mb-2">You must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Provide current certificate of insurance upon registration</li>
                <li>Update insurance information within 30 days of policy changes</li>
                <li>Notify Mind Brother immediately if coverage lapses</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-semibold">
                  <strong>Lapsed insurance results in immediate suspension.</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">9.3 Claims and Lawsuits</h3>
              <p className="mb-2">You must notify Mind Brother within <strong>7 days</strong> of:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Any malpractice claim filed against you</li>
                <li>Any licensing board complaint</li>
                <li>Any lawsuit related to your professional services</li>
                <li>Any criminal charges related to your practice</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. PROFESSIONAL CONDUCT</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">10.1 Professional Boundaries</h3>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Maintain appropriate professional relationships</li>
                <li>Avoid romantic or sexual relationships with clients</li>
                <li>Not exploit clients for financial, personal, or other gain</li>
                <li>Terminate relationships that become inappropriate</li>
                <li>Seek supervision when boundary issues arise</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">10.2 Supervision and Consultation</h3>
              <p className="mb-2">If required by your license or practice:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Obtain appropriate clinical supervision</li>
                <li>Document supervision sessions</li>
                <li>Consult with colleagues on complex cases</li>
                <li>Participate in peer review when appropriate</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">10.3 Continuing Education</h3>
              <p className="mb-2">You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Complete required continuing education for your license</li>
                <li>Stay current with best practices in your field</li>
                <li>Participate in professional development</li>
                <li>Update your knowledge of cultural competence</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">10.4 Professional Communication</h3>
              <p className="mb-2">When communicating through the Platform:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Use professional language and tone</li>
                <li>Respond to clients within reasonable timeframes</li>
                <li>Maintain consistency in communication</li>
                <li>Document important communications</li>
                <li>Clarify any misunderstandings promptly</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. FEES AND COMPENSATION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">11.1 Fee Structure</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 italic">
                  [THIS SECTION DEPENDS ON YOUR BUSINESS MODEL - UPDATE AS NEEDED]
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  <strong>Option A (Free Platform):</strong> Mind Brother does not charge professionals to use the Platform. Professionals may set their own fees with clients outside the Platform.
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  <strong>Option B (Commission Model):</strong> Mind Brother charges a commission on services booked through the Platform. Payment terms are described in separate billing documentation.
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  <strong>Option C (Subscription Model):</strong> Professionals pay a monthly subscription fee to access the Platform.
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">11.2 Payment Processing</h3>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Payments (if applicable) are processed through third-party providers</li>
                <li>You are responsible for taxes on your professional income</li>
                <li>Mind Brother provides 1099 forms as required (U.S. professionals)</li>
                <li>Fee structure may change with 30 days' notice</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">11.3 No Guarantee of Clients</h3>
              <p className="mb-2">Mind Brother makes no guarantee regarding:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Number of clients you'll receive</li>
                <li>Income you'll generate</li>
                <li>Referrals or connections</li>
                <li>Success of your profile or practice</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. LIABILITY AND INDEMNIFICATION</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">12.1 Your Liability</h3>
                <p className="text-sm text-red-800 font-semibold mb-2">
                  <strong>YOU ARE SOLELY RESPONSIBLE FOR:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                  <li>All professional services you provide</li>
                  <li>Your professional conduct and judgments</li>
                  <li>Maintaining appropriate standards of care</li>
                  <li>Complying with licensing requirements</li>
                  <li>Obtaining and maintaining malpractice insurance</li>
                  <li>Client outcomes and satisfaction</li>
                  <li>Any harm resulting from your services</li>
                </ul>
                <p className="text-sm text-red-800 font-semibold mt-2">
                  <strong>MIND BROTHER IS NOT LIABLE FOR YOUR PROFESSIONAL SERVICES.</strong>
                </p>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">12.2 Indemnification</h3>
              <p className="mb-2">You agree to <strong>indemnify, defend, and hold harmless</strong> Mind Brother, its officers, directors, employees, and agents from:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Malpractice claims</strong> arising from your services</li>
                <li><strong>Licensing board complaints</strong> related to your practice</li>
                <li><strong>Violations</strong> of professional ethics or standards</li>
                <li><strong>Breaches</strong> of confidentiality you cause</li>
                <li><strong>Claims</strong> that you practiced without proper licensure</li>
                <li><strong>Any liability</strong> arising from your professional conduct</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">12.3 Professional Liability</h3>
              <p className="mb-2">Mind Brother:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Is not a party to the professional-client relationship</li>
                <li>Does not supervise or control your professional judgment</li>
                <li>Is not liable for outcomes of your services</li>
                <li>Makes no representations about your qualifications</li>
                <li>Does not warrant the quality of your services</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Clients understand that Mind Brother is a platform, not a healthcare provider.</strong>
              </p>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. TERMINATION AND SUSPENSION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">13.1 Termination by You</h3>
              <p className="mb-2">You may terminate your professional account:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>At any time with 30 days' notice</li>
                <li>By emailing professionals@mindbrother.com</li>
                <li>Subject to completing obligations to current clients</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">13.2 Suspension or Termination by Mind Brother</h3>
              <p className="mb-2">We may suspend or terminate your account immediately for:</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <ul className="list-none space-y-1 ml-2 text-sm text-red-800">
                  <li>✗ <strong>License suspension, revocation, or restrictions</strong></li>
                  <li>✗ <strong>Lapsed malpractice insurance</strong></li>
                  <li>✗ <strong>Disciplinary action</strong> by licensing board</li>
                  <li>✗ <strong>Criminal charges</strong> related to professional practice</li>
                  <li>✗ <strong>Violations</strong> of this Agreement</li>
                  <li>✗ <strong>Ethical violations</strong> or misconduct</li>
                  <li>✗ <strong>Fraudulent activity</strong></li>
                  <li>✗ <strong>Misrepresentation</strong> of credentials</li>
                  <li>✗ <strong>Client complaints</strong> indicating serious misconduct</li>
                  <li>✗ <strong>Any reason</strong> at our discretion (with cause)</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">13.3 Effect of Termination</h3>
              <p className="mb-2">Upon termination:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Your profile is removed from the Platform</li>
                <li>Access to the Platform ends immediately</li>
                <li>You must notify any current clients</li>
                <li>You remain responsible for existing client relationships</li>
                <li>Records you created remain your responsibility</li>
                <li>Confidentiality obligations continue</li>
                <li>You may not access client data after termination</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">13.4 Client Continuity</h3>
              <p className="mb-2">If your account is terminated:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You are responsible for continuity of care</li>
                <li>Provide appropriate referrals to clients</li>
                <li>Complete required termination procedures per your licensing requirements</li>
                <li>Do not abandon clients</li>
              </ul>
            </section>

            {/* Sections 14-20 - Condensed for brevity */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. INTELLECTUAL PROPERTY</h2>
              <p className="mb-2">Content you create (profile, posts, resources):</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>You retain ownership</li>
                <li>You grant Mind Brother a license to display and use</li>
                <li>You represent you have rights to any content you post</li>
                <li>You may not post copyrighted material without permission</li>
              </ul>
              <p className="mb-2">Mind Brother's intellectual property (logo, app, AI):</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Remains Mind Brother's property</li>
                <li>You may not copy, modify, or distribute</li>
                <li>You may reference in connection with your use of Platform</li>
                <li>You may not use after termination</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. DATA AND PRIVACY</h2>
              <p className="mb-2"><strong>You are the data controller</strong> for your client relationships. You must comply with applicable privacy laws (HIPAA, state laws). See our Privacy Policy for details on data collection and security requirements.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. COMPLIANCE WITH LAWS</h2>
              <p className="mb-2">You agree to comply with:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Licensing laws in all jurisdictions where you're licensed</li>
                <li>HIPAA and state privacy laws</li>
                <li>Mental health parity laws</li>
                <li>Anti-discrimination laws</li>
                <li>Tax laws and reporting requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">17. DISPUTE RESOLUTION</h2>
              <p>Disputes between you and Mind Brother will be resolved through informal negotiation, mediation, or binding arbitration per our Terms of Service. Disputes between you and clients are your responsibility to resolve.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">18. MODIFICATIONS</h2>
              <p>We may modify this Agreement with 30 days' notice for material changes. Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">19. GENERAL PROVISIONS</h2>
              <p className="mb-2">You are an <strong>independent contractor</strong>, not an employee. This Agreement, together with Terms of Service and Privacy Policy, constitutes the entire agreement. Governed by the laws of [Your State], United States.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">20. CONTACT INFORMATION</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>For Professional Account Questions:</strong><br/>
                  Email: professionals@mindbrother.com<br/>
                  Subject: "Professional Account Inquiry"<br/><br/>
                  <strong>For Verification Status:</strong><br/>
                  Email: verification@mindbrother.com<br/>
                  Subject: "Credential Verification"<br/><br/>
                  <strong>For Legal Compliance:</strong><br/>
                  Email: legal@mindbrother.com<br/>
                  Subject: "Professional Legal Matter"
                </p>
              </div>
            </section>

            {/* Acknowledgment */}
            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">ACKNOWLEDGMENT</h2>
              <p className="text-sm text-blue-800 font-semibold mb-3">
                <strong>BY REGISTERING AS A PROFESSIONAL ON MIND BROTHER, YOU:</strong>
              </p>
              <ul className="list-none space-y-2 text-sm text-blue-800">
                <li>✅ Confirm you hold valid, current professional licensure</li>
                <li>✅ Have read and understood this Professional User Agreement</li>
                <li>✅ Agree to maintain appropriate malpractice insurance</li>
                <li>✅ Commit to following professional ethics and standards</li>
                <li>✅ Understand you are an independent practitioner</li>
                <li>✅ Accept full responsibility for your professional services</li>
                <li>✅ Agree to comply with all applicable laws and regulations</li>
                <li>✅ Will maintain client confidentiality per legal requirements</li>
                <li>✅ Understand Mind Brother is not liable for your services</li>
                <li>✅ Agree to provide appropriate standard of care</li>
              </ul>
              <p className="text-sm text-blue-800 font-semibold mt-4">
                <strong>YOU ARE RESPONSIBLE FOR YOUR PROFESSIONAL PRACTICE AND CONDUCT.</strong>
              </p>
            </section>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Professional User Agreement effective as of December 1, 2024
              </p>
              <p className="text-sm text-gray-500 text-center mt-1">
                Mind Brother Professional Network
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



