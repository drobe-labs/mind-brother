import React from 'react';

interface CrisisDisclaimerProps {
  onClose?: () => void;
}

export default function CrisisDisclaimer({ onClose }: CrisisDisclaimerProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Crisis Disclaimer & Emergency Resources</h1>
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

          {/* Critical Emergency Banner */}
          <div className="bg-red-600 text-white p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-4">⚠️ CRISIS DISCLAIMER</h2>
            <p className="text-lg mb-4 font-semibold">
              <strong>Mind Brother and Amani (our AI assistant) are NOT designed to handle mental health crises or emergencies.</strong>
            </p>
            <p className="mb-4">
              If you are experiencing a mental health crisis, having thoughts of harming yourself or others, or need immediate help:
            </p>
            <div className="space-y-3">
              <div className="bg-white text-red-600 p-4 rounded-lg">
                <p className="font-bold text-xl mb-2">CALL 911 IMMEDIATELY</p>
                <p className="text-sm">For life-threatening emergencies</p>
              </div>
              <div className="bg-white text-red-600 p-4 rounded-lg">
                <p className="font-bold text-xl mb-2">CALL 988</p>
                <p className="text-sm font-semibold mb-1">Suicide & Crisis Lifeline</p>
                <ul className="text-sm space-y-1">
                  <li>• Available 24/7, 365 days a year</li>
                  <li>• Free and confidential</li>
                  <li>• Trained crisis counselors</li>
                  <li>• English and Spanish (press 2)</li>
                  <li>• <a href="https://988lifeline.org" target="_blank" rel="noopener noreferrer" className="underline">https://988lifeline.org</a></li>
                </ul>
              </div>
              <div className="bg-white text-red-600 p-4 rounded-lg">
                <p className="font-bold text-xl mb-2">TEXT "HELLO" to 741741</p>
                <p className="text-sm font-semibold mb-1">Crisis Text Line</p>
                <ul className="text-sm space-y-1">
                  <li>• Text-based crisis support</li>
                  <li>• Available 24/7</li>
                  <li>• Free and confidential</li>
                  <li>• Trained crisis counselors</li>
                  <li>• <a href="https://www.crisistextline.org" target="_blank" rel="noopener noreferrer" className="underline">https://www.crisistextline.org</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 text-gray-700">
            
            {/* When to Seek Immediate Help */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">🚨 WHEN TO SEEK IMMEDIATE HELP</h2>
              <p className="mb-2 font-semibold">Call 911 or go to your nearest emergency room if you experience:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Thoughts of suicide or self-harm</li>
                <li>Plans to hurt yourself or others</li>
                <li>Hearing voices telling you to harm yourself</li>
                <li>Severe panic attacks</li>
                <li>Psychotic episodes</li>
                <li>Substance overdose or poisoning</li>
                <li>Severe reactions to medication</li>
                <li>Any situation where you feel unable to keep yourself safe</li>
              </ul>
            </section>

            {/* Additional Crisis Resources */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Additional Crisis Resources</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Veterans Crisis Line</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Call:</strong> 988, then press 1</li>
                    <li>• <strong>Text:</strong> 838255</li>
                    <li>• <strong>Chat:</strong> <a href="https://veteranscrisisline.net" target="_blank" rel="noopener noreferrer" className="underline">veteranscrisisline.net</a></li>
                    <li>• Available 24/7 for veterans, service members, National Guard, Reserve, and their families</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">SAMHSA National Helpline</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>Call:</strong> 1-800-662-4357 (HELP)</li>
                    <li>• Substance abuse and mental health treatment referrals</li>
                    <li>• Free, confidential, 24/7</li>
                    <li>• English and Spanish</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">Trevor Project (LGBTQ+ Youth)</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• <strong>Call:</strong> 1-866-488-7386</li>
                    <li>• <strong>Text:</strong> "START" to 678-678</li>
                    <li>• <strong>Chat:</strong> <a href="https://thetrevorproject.org" target="_blank" rel="noopener noreferrer" className="underline">thetrevorproject.org</a></li>
                    <li>• 24/7 support for LGBTQ+ young people</li>
                  </ul>
                </div>

                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="font-semibold text-pink-900 mb-2">Trans Lifeline</h3>
                  <ul className="text-sm text-pink-800 space-y-1">
                    <li>• <strong>U.S.:</strong> 1-877-565-8860</li>
                    <li>• <strong>Canada:</strong> 1-877-330-6366</li>
                    <li>• Peer support for transgender community</li>
                    <li>• <a href="https://translifeline.org" target="_blank" rel="noopener noreferrer" className="underline">translifeline.org</a></li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">National Domestic Violence Hotline</h3>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• <strong>Call:</strong> 1-800-799-7233 (SAFE)</li>
                    <li>• <strong>Text:</strong> "START" to 88788</li>
                    <li>• <strong>Chat:</strong> <a href="https://thehotline.org" target="_blank" rel="noopener noreferrer" className="underline">thehotline.org</a></li>
                    <li>• 24/7 support for domestic violence survivors</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Disaster Distress Helpline</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• <strong>Call:</strong> 1-800-985-5990</li>
                    <li>• <strong>Text:</strong> "TalkWithUs" to 66746</li>
                    <li>• Crisis counseling for disaster-related distress</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">National Sexual Assault Hotline (RAINN)</h3>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• <strong>Call:</strong> 1-800-656-4673 (HOPE)</li>
                    <li>• <strong>Chat:</strong> <a href="https://hotline.rainn.org" target="_blank" rel="noopener noreferrer" className="underline">hotline.rainn.org</a></li>
                    <li>• 24/7 confidential support</li>
                  </ul>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-semibold text-teal-900 mb-2">Postpartum Support International</h3>
                  <ul className="text-sm text-teal-800 space-y-1">
                    <li>• <strong>Call:</strong> 1-800-944-4773</li>
                    <li>• <strong>Text:</strong> "HELP" to 800-944-4773 (English) or 971-203-7773 (Spanish)</li>
                    <li>• Support for perinatal mood and anxiety disorders</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Black Mental Health Alliance</h3>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• <strong>Online:</strong> <a href="https://blackmentalhealth.com" target="_blank" rel="noopener noreferrer" className="underline">blackmentalhealth.com</a></li>
                    <li>• Resources specifically for Black communities</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">National Alliance on Mental Illness (NAMI)</h3>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• <strong>Helpline:</strong> 1-800-950-6264</li>
                    <li>• <strong>Text:</strong> "NAMI" to 741741</li>
                    <li>• Monday-Friday, 10am-10pm ET</li>
                    <li>• Information, support, and referrals</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">FindTreatment.gov</h3>
                  <ul className="text-sm text-gray-800 space-y-1">
                    <li>• Locate mental health and substance use treatment</li>
                    <li>• U.S. Department of Health & Human Services</li>
                    <li>• <a href="https://findtreatment.gov" target="_blank" rel="noopener noreferrer" className="underline">findtreatment.gov</a></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Find Local Resources */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">🩺 FIND LOCAL RESOURCES</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Immediate Help:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-blue-800">
                  <li><strong>Call 911</strong> for emergency services</li>
                  <li>Go to your nearest <strong>emergency room</strong></li>
                  <li>Contact your <strong>doctor or therapist</strong></li>
                  <li>Visit an <strong>urgent care center</strong></li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-green-900 mb-2">Non-Emergency Support:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                  <li><strong>2-1-1:</strong> Dial 211 for local community resources and crisis support</li>
                  <li><strong>PsychologyToday.com:</strong> Find therapists in your area</li>
                  <li><strong>OpenPathCollective.org:</strong> Affordable therapy ($30-$80 per session)</li>
                  <li><strong>7Cups.com:</strong> Free emotional support via chat</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Insurance Resources:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-gray-700">
                  <li>Contact your health insurance provider's behavioral health line (usually on the back of your card)</li>
                  <li>Many insurers have 24/7 nurse hotlines for mental health guidance</li>
                </ul>
              </div>
            </section>

            {/* Safety Planning */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">📱 SAFETY PLANNING</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">Create Your Personal Crisis Plan</h3>
              <p className="mb-4">If you're struggling with mental health, create a safety plan:</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <ol className="list-decimal list-inside space-y-3 text-sm text-yellow-900">
                  <li><strong>Warning Signs I Experience:</strong> (Example: can't sleep, excessive worry, withdrawal)</li>
                  <li><strong>Things That Help Me Cope:</strong> (Example: exercise, music, calling a friend)</li>
                  <li><strong>People I Can Contact:</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Friend: _________________ Phone: _____________</li>
                      <li>Family: _________________ Phone: _____________</li>
                      <li>Therapist: _______________ Phone: _____________</li>
                    </ul>
                  </li>
                  <li><strong>Professional Resources:</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Therapist/Counselor: _______________________</li>
                      <li>Psychiatrist: _______________________________</li>
                      <li>Primary Care Doctor: _______________________</li>
                      <li>Local Crisis Center: ________________________</li>
                    </ul>
                  </li>
                  <li><strong>Emergency Contacts:</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>911 (Emergency)</li>
                      <li>988 (Suicide & Crisis Lifeline)</li>
                      <li>Local Hospital ER: __________________________</li>
                    </ul>
                  </li>
                  <li><strong>Make Environment Safe:</strong>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Remove means of self-harm</li>
                      <li>Stay with someone you trust</li>
                      <li>Avoid alcohol and drugs</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">Safety Planning Apps</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>MY3:</strong> Free safety planning and crisis support app</li>
                <li><strong>notOK:</strong> One-tap emergency alert to trusted contacts</li>
                <li><strong>Virtual Hope Box:</strong> Coping tools and distraction techniques</li>
              </ul>
            </section>

            {/* Understanding Mental Health Emergencies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">🧠 UNDERSTANDING MENTAL HEALTH EMERGENCIES</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">Signs You or Someone You Know Needs Help:</h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="font-semibold text-red-900 mb-2">Warning Signs:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                  <li>Talking about wanting to die or hurt oneself</li>
                  <li>Looking for ways to end one's life</li>
                  <li>Talking about feeling hopeless or having no reason to live</li>
                  <li>Talking about being a burden to others</li>
                  <li>Increasing use of alcohol or drugs</li>
                  <li>Acting anxious or agitated</li>
                  <li>Withdrawing from friends and family</li>
                  <li>Changing eating or sleeping habits</li>
                  <li>Showing rage or talking about seeking revenge</li>
                  <li>Taking risks that could lead to death</li>
                  <li>Giving away prized possessions</li>
                  <li>Saying goodbye as if for the last time</li>
                  <li>Putting affairs in order</li>
                  <li>Developing a plan or increasing substance use</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-semibold text-green-900 mb-2">What to Do:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-sm text-green-800">
                  <li><strong>Stay with the person</strong> - Don't leave them alone</li>
                  <li><strong>Remove dangerous items</strong> - Weapons, pills, sharp objects</li>
                  <li><strong>Call for help</strong> - 911, 988, or go to emergency room</li>
                  <li><strong>Listen without judgment</strong> - Let them express feelings</li>
                  <li><strong>Be supportive</strong> - Offer hope that help is available</li>
                </ol>
              </div>
            </section>

            {/* How to Talk to Someone in Crisis */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">💬 HOW TO TALK TO SOMEONE IN CRISIS</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Listen without judgment</li>
                    <li>Take them seriously</li>
                    <li>Stay calm</li>
                    <li>Ask directly: "Are you thinking about suicide?"</li>
                    <li>Show you care</li>
                    <li>Get professional help</li>
                    <li>Follow up after the crisis</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Leave them alone</li>
                    <li>Minimize their feelings ("It could be worse")</li>
                    <li>Argue or try to solve all their problems</li>
                    <li>Promise confidentiality (if they're in danger)</li>
                    <li>Act shocked or give a lecture</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Confidentiality and Reporting */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">🔒 CONFIDENTIALITY AND REPORTING</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">When We May Break Confidentiality</h3>
              <p className="mb-2">Mind Brother may contact emergency services or share information if:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>We believe you are at imminent risk of harming yourself</li>
                <li>We believe you are at risk of harming others</li>
                <li>We learn of child abuse or neglect</li>
                <li>We learn of elder or dependent adult abuse</li>
                <li>A court orders us to disclose information</li>
                <li>You provide written consent</li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-semibold">
                  <strong>Your safety is our priority, even if it means breaking confidentiality.</strong>
                </p>
              </div>
            </section>

            {/* International Crisis Resources */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">🌍 INTERNATIONAL CRISIS RESOURCES</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">United Kingdom</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Samaritans:</strong> 116 123</li>
                    <li>• <strong>NHS 111</strong> (Mental Health Crisis)</li>
                    <li>• <strong>Text:</strong> "SHOUT" to 85258</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Canada</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Crisis Services Canada:</strong> 1-833-456-4566</li>
                    <li>• <strong>Text:</strong> 45645</li>
                    <li>• <strong>Indigenous Peoples:</strong> 1-855-242-3310</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Australia</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Lifeline:</strong> 13 11 14</li>
                    <li>• <strong>Beyond Blue:</strong> 1300 22 4636</li>
                    <li>• <strong>Kids Helpline:</strong> 1800 55 1800</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">New Zealand</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Lifeline:</strong> 0800 543 354</li>
                    <li>• <strong>Suicide Crisis Helpline:</strong> 0508 828 865</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Ireland</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Samaritans:</strong> 116 123</li>
                    <li>• <strong>Pieta House:</strong> 1800 247 247</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">India</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>AASRA:</strong> +91 98204 66726</li>
                    <li>• <strong>iCall:</strong> 022-25521111</li>
                    <li>• <strong>Sneha:</strong> +91 44 2464 0050</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-blue-900 mb-2">International Association for Suicide Prevention</h3>
                <p className="text-sm text-blue-800">
                  Find crisis centers worldwide: <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" className="underline">https://www.iasp.info/resources/Crisis_Centres/</a>
                </p>
              </div>
            </section>

            {/* Mind Brother's Role */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">✅ MIND BROTHER'S ROLE</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">What Mind Brother CAN Do:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Provide daily wellness support</li>
                    <li>Offer breathing exercises and meditation</li>
                    <li>Track fitness and wellness goals</li>
                    <li>Suggest coping strategies</li>
                    <li>Provide motivation and encouragement</li>
                    <li>Connect you with resources</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">What Mind Brother CANNOT Do:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Replace professional mental health care</li>
                    <li>Provide therapy or counseling</li>
                    <li>Prescribe medication</li>
                    <li>Diagnose mental health conditions</li>
                    <li>Handle crisis situations</li>
                    <li>Provide emergency services</li>
                    <li>Guarantee specific health outcomes</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 font-semibold text-gray-900">
                <strong>Mind Brother is a wellness tool, not a medical service.</strong>
              </p>
            </section>

            {/* Additional Mental Health Resources */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">📚 ADDITIONAL MENTAL HEALTH RESOURCES</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Education and Information:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>NIMH:</strong> National Institute of Mental Health - <a href="https://nimh.nih.gov" target="_blank" rel="noopener noreferrer" className="underline">nimh.nih.gov</a></li>
                    <li>• <strong>MentalHealth.gov:</strong> Federal mental health resources</li>
                    <li>• <strong>NAMI:</strong> National Alliance on Mental Illness - <a href="https://nami.org" target="_blank" rel="noopener noreferrer" className="underline">nami.org</a></li>
                    <li>• <strong>Mental Health America:</strong> <a href="https://mhanational.org" target="_blank" rel="noopener noreferrer" className="underline">mhanational.org</a></li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Therapy Directories:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Psychology Today:</strong> Find a therapist near you</li>
                    <li>• <strong>TherapyDen:</strong> Inclusive therapist directory</li>
                    <li>• <strong>Therapy for Black Girls:</strong> <a href="https://therapyforblackgirls.com" target="_blank" rel="noopener noreferrer" className="underline">therapyforblackgirls.com</a></li>
                    <li>• <strong>National Queer and Trans Therapists of Color Network:</strong> <a href="https://nqttcn.com" target="_blank" rel="noopener noreferrer" className="underline">nqttcn.com</a></li>
                    <li>• <strong>Inclusive Therapists:</strong> <a href="https://inclusivetherapists.com" target="_blank" rel="noopener noreferrer" className="underline">inclusivetherapists.com</a></li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Affordable Therapy:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Open Path Collective:</strong> $30-$80 per session</li>
                    <li>• <strong>BetterHelp:</strong> Online therapy subscription</li>
                    <li>• <strong>Talkspace:</strong> Online therapy platform</li>
                    <li>• <strong>Community Mental Health Centers:</strong> Sliding scale fees</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Self-Help Resources:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>MoodGYM:</strong> Free online cognitive behavioral therapy program</li>
                    <li>• <strong>SMART Recovery:</strong> Free support groups for addiction</li>
                    <li>• <strong>Alcoholics Anonymous:</strong> <a href="https://aa.org" target="_blank" rel="noopener noreferrer" className="underline">aa.org</a></li>
                    <li>• <strong>Narcotics Anonymous:</strong> <a href="https://na.org" target="_blank" rel="noopener noreferrer" className="underline">na.org</a></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact and Commitment */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">📞 CONTACT MIND BROTHER</h2>
              <p className="mb-2">If you have questions or concerns about safety features:</p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> support@mindbrother.com<br/>
                  <strong>Safety Concerns:</strong> safety@mindbrother.com
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-semibold">
                  <strong>For Emergencies: DO NOT email us. Call 911 or 988 immediately.</strong>
                </p>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-6">🤝 OUR COMMITMENT</h2>
              <p className="mb-2">Mind Brother is committed to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Providing clear safety information</li>
                <li>Supporting your wellness journey</li>
                <li>Connecting you with appropriate resources</li>
                <li>Continuously improving our safety features</li>
                <li>Listening to user feedback about mental health needs</li>
              </ul>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-800 font-semibold">
                  <strong>Remember: Asking for help is a sign of strength, not weakness.</strong>
                </p>
              </div>
            </section>

            {/* Final Reminder */}
            <section className="bg-red-600 text-white p-6 rounded-lg mt-8">
              <h2 className="text-2xl font-bold mb-4 text-center">REMEMBER: YOU ARE NOT ALONE. HELP IS AVAILABLE.</h2>
              <p className="text-xl font-semibold text-center mb-4">If you're in crisis: CALL 988 or 911</p>
              <div className="flex justify-center space-x-4">
                <a href="tel:988" className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Call 988
                </a>
                <a href="tel:911" className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                  Call 911
                </a>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center italic">
                This document is for informational purposes only and does not constitute medical advice. Always consult qualified healthcare professionals for medical or mental health concerns.
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Last Updated: December 1, 2024
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



