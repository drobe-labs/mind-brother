import React from 'react';

interface CommunityGuidelinesProps {
  onClose?: () => void;
}

export default function CommunityGuidelines({ onClose }: CommunityGuidelinesProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Community Guidelines</h1>
              <p className="text-sm text-gray-500">Creating a Safe, Supportive Space for Wellness</p>
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

          {/* Mission */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">OUR MISSION</h2>
            <p className="text-gray-700 mb-4">
              Mind Brother exists to provide a <strong>safe, supportive, judgment-free space</strong> for Black and Brown men to prioritize their mental health and wellness. These Community Guidelines help us maintain a positive, respectful environment for everyone.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-800 font-semibold">
                <strong>Together, we build a community where brothers uplift brothers.</strong>
              </p>
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">CORE VALUES</h2>
            <p className="text-gray-700 mb-3">Our community is built on:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800"><strong>🤝 Respect</strong> - Treat everyone with dignity and kindness</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800"><strong>💙 Support</strong> - Uplift and encourage one another</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800"><strong>🛡️ Safety</strong> - Create a space free from harm and judgment</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800"><strong>✊🏾 Authenticity</strong> - Be real about struggles and triumphs</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800"><strong>🌱 Growth</strong> - Commit to personal development and healing</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-sm text-indigo-800"><strong>🤐 Confidentiality</strong> - What's shared here stays here</p>
              </div>
            </div>
          </section>

          {/* Content */}
          <div className="prose prose-sm sm:prose max-w-none space-y-6 text-gray-700">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. BE RESPECTFUL AND SUPPORTIVE</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Treat everyone with respect regardless of background, identity, or circumstances</li>
                    <li>Use supportive, encouraging language</li>
                    <li>Listen without judgment when someone shares their struggles</li>
                    <li>Offer empathy and understanding</li>
                    <li>Celebrate others' progress and achievements</li>
                    <li>Acknowledge different perspectives and experiences</li>
                    <li>Use culturally sensitive language</li>
                    <li>Give constructive feedback when requested</li>
                    <li>Respect boundaries - if someone doesn't want to discuss something, honor that</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Insult, demean, or belittle others</li>
                    <li>Make racist, sexist, homophobic, or discriminatory comments</li>
                    <li>Mock someone's mental health struggles</li>
                    <li>Minimize others' experiences ("It's not that bad")</li>
                    <li>Tell people to "man up" or "get over it"</li>
                    <li>Shame people for seeking help</li>
                    <li>Engage in name-calling or personal attacks</li>
                    <li>Harass or stalk other users</li>
                    <li>Spread negativity or bring others down</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. KEEP IT SAFE</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Report concerning behavior or content to moderators</li>
                    <li>Reach out if you're concerned about someone's safety</li>
                    <li>Share crisis resources (988, 911) when appropriate</li>
                    <li>Practice self-care - take breaks when needed</li>
                    <li>Set healthy boundaries in conversations</li>
                    <li>Ask for consent before giving advice</li>
                    <li>Respect "no contact" requests</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Share graphic content about self-harm or suicide methods</li>
                    <li>Encourage dangerous or harmful behaviors</li>
                    <li>Promote substance abuse</li>
                    <li>Post triggering content without warnings</li>
                    <li>Share explicit or sexual content</li>
                    <li>Glorify violence or illegal activities</li>
                    <li>Dox or expose someone's personal information</li>
                    <li>Threaten or intimidate others</li>
                    <li>Coordinate harmful activities</li>
                  </ul>
                </div>
              </div>

              <div className="bg-red-600 text-white p-6 rounded-lg mt-4">
                <h3 className="font-bold text-xl mb-3">🚨 CRISIS CONTENT</h3>
                <p className="mb-3">If someone expresses suicidal thoughts or intent:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4 mb-3">
                  <li><strong>Report immediately</strong> to moderators</li>
                  <li><strong>Encourage them to call 988</strong> (Suicide & Crisis Lifeline)</li>
                  <li><strong>Do not</strong> engage in extended crisis counseling (you're not trained for that)</li>
                  <li><strong>Do not</strong> minimize or dismiss their feelings</li>
                  <li><strong>Do offer</strong> support and resources</li>
                </ol>
                <p className="font-semibold">
                  <strong>Mind Brother is not equipped for crisis intervention. In emergencies, call 911.</strong>
                </p>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. RESPECT PRIVACY AND CONFIDENTIALITY</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Keep conversations confidential - don't share others' stories outside the community</li>
                    <li>Ask permission before sharing someone's content</li>
                    <li>Respect anonymity - don't try to identify anonymous users</li>
                    <li>Use discretion when sharing your own experiences</li>
                    <li>Protect others' privacy in your stories (change names, details)</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Share others' personal information (phone numbers, addresses, real names)</li>
                    <li>Screenshot and share private conversations</li>
                    <li>"Out" someone's identity, sexuality, or personal information</li>
                    <li>Share photos of others without permission</li>
                    <li>Expose someone's mental health information</li>
                    <li>Use information against someone</li>
                    <li>Stalk users on other platforms</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. MAINTAIN APPROPRIATE BOUNDARIES</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Keep interactions supportive and platonic</li>
                    <li>Respect professional boundaries with licensed professionals</li>
                    <li>Use public channels for general discussions</li>
                    <li>Report inappropriate advances or harassment</li>
                    <li>Be clear about your intentions in conversations</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Pursue romantic or sexual relationships through the platform</li>
                    <li>Send unsolicited sexual content or messages</li>
                    <li>Make inappropriate comments about appearance or body</li>
                    <li>Hit on other users</li>
                    <li>Engage in grooming behavior</li>
                    <li>Form codependent relationships</li>
                    <li>Manipulate others emotionally</li>
                    <li>Cross professional boundaries (if you're a professional user)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. BE AUTHENTIC BUT THOUGHTFUL</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Be honest about your struggles and experiences</li>
                    <li>Share your truth in your own words</li>
                    <li>Express emotions appropriately</li>
                    <li>Ask for help when you need it</li>
                    <li>Admit when you don't know something</li>
                    <li>Be vulnerable in appropriate contexts</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Fake mental health issues for attention</li>
                    <li>Exaggerate or lie about experiences</li>
                    <li>Appropriate others' trauma stories</li>
                    <li>Create drama unnecessarily</li>
                    <li>Manipulate others with false stories</li>
                    <li>Impersonate others</li>
                    <li>Claim qualifications you don't have</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. GIVE GOOD ADVICE (OR DON'T)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Share what worked for you ("This helped me...")</li>
                    <li>Suggest professional help when appropriate</li>
                    <li>Provide resources and information</li>
                    <li>Ask questions to understand before advising</li>
                    <li>Acknowledge limitations ("I'm not a professional but...")</li>
                    <li>Respect when someone doesn't want advice</li>
                    <li>Encourage evidence-based approaches</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Diagnose mental health conditions (unless you're a licensed professional working with that person)</li>
                    <li>Prescribe medications or treatments</li>
                    <li>Contradict someone's doctor or therapist</li>
                    <li>Push alternative treatments as miracle cures</li>
                    <li>Shame someone's treatment choices</li>
                    <li>Give advice on serious medical or legal matters</li>
                    <li>Insist your way is the only way</li>
                    <li>Make guarantees about outcomes</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 font-semibold">
                  <strong>Remember: Amani (our AI) is not a therapist. Neither are most community members. Real therapy comes from licensed professionals.</strong>
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. RESPECT COMMUNITY SPACES</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Stay on topic in themed discussions</li>
                    <li>Use appropriate channels for different types of content</li>
                    <li>Read pinned posts and community announcements</li>
                    <li>Follow moderator guidance</li>
                    <li>Report spam and off-topic content</li>
                    <li>Welcome new members</li>
                    <li>Contribute positively to discussions</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Spam or flood channels with repetitive content</li>
                    <li>Promote products, services, or businesses without permission</li>
                    <li>Advertise other apps or competing services</li>
                    <li>Post irrelevant content or memes excessively</li>
                    <li>Derail serious conversations</li>
                    <li>Troll or engage in inflammatory behavior</li>
                    <li>Create multiple accounts to circumvent rules</li>
                    <li>Engage in vote manipulation or fake engagement</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. CULTURAL SENSITIVITY AND INCLUSIVITY</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Respect diverse identities within the Black and Brown community</li>
                    <li>Acknowledge different experiences based on identity (LGBTQ+, immigrant, etc.)</li>
                    <li>Use inclusive language</li>
                    <li>Challenge stereotypes respectfully</li>
                    <li>Celebrate cultural diversity</li>
                    <li>Learn from different perspectives</li>
                    <li>Call in rather than call out when possible</li>
                    <li>Apologize and learn when you make mistakes</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Make assumptions about someone's identity or experiences</li>
                    <li>Tokenize or stereotype based on race, sexuality, etc.</li>
                    <li>Use slurs or offensive language</li>
                    <li>Engage in colorism</li>
                    <li>Dismiss others' cultural experiences</li>
                    <li>Appropriate cultural practices</li>
                    <li>Gatekeep who belongs in the community</li>
                    <li>Create divisions within the community</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900 mb-2">Mind Brother welcomes ALL Black and Brown men, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-blue-800">
                  <li>LGBTQ+ brothers</li>
                  <li>Immigrant brothers</li>
                  <li>Brothers of all ages</li>
                  <li>Brothers with disabilities</li>
                  <li>Brothers from all backgrounds</li>
                </ul>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. INTELLECTUAL PROPERTY AND COPYRIGHT</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Credit sources when sharing information</li>
                    <li>Link to original content</li>
                    <li>Respect copyright and intellectual property</li>
                    <li>Share your own experiences in your own words</li>
                    <li>Ask permission before sharing others' creative work</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Copy/paste large amounts of copyrighted material</li>
                    <li>Share pirated content or resources</li>
                    <li>Plagiarize others' work</li>
                    <li>Claim others' content as your own</li>
                    <li>Violate fair use guidelines</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. PROFESSIONAL CONDUCT (For Licensed Professionals)</h2>
              <p className="mb-3">If you're a licensed mental health professional in our community:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ DO:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                    <li>Follow your professional ethics code</li>
                    <li>Maintain appropriate boundaries</li>
                    <li>Disclose your role when relevant</li>
                    <li>Provide evidence-based information</li>
                    <li>Refer to resources appropriately</li>
                    <li>Model healthy behavior</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">❌ DON'T:</h3>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                    <li>Establish formal therapeutic relationships through the community</li>
                    <li>Diagnose or treat community members</li>
                    <li>Solicit clients inappropriately</li>
                    <li>Violate professional boundaries</li>
                    <li>Share confidential client information</li>
                    <li>Provide crisis intervention through the platform</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Content Warnings */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CONTENT WARNINGS AND TRIGGERS</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">When to Use Content Warnings</h3>
              <p className="mb-2">Use a content warning (CW) or trigger warning (TW) when discussing:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li>Suicide or self-harm</li>
                <li>Sexual assault or abuse</li>
                <li>Violence or trauma</li>
                <li>Eating disorders</li>
                <li>Substance abuse</li>
                <li>Death or grief</li>
                <li>Panic attacks or severe anxiety</li>
                <li>Other potentially triggering topics</li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">How to Use Content Warnings</h3>
                <p className="text-sm text-yellow-800 mb-2"><strong>Format:</strong></p>
                <pre className="bg-white p-3 rounded text-xs text-yellow-900 mb-2">
{`⚠️ CW: [Topic]

[Leave space]

[Your content here]`}
                </pre>
                <p className="text-sm text-yellow-800"><strong>Example:</strong></p>
                <pre className="bg-white p-3 rounded text-xs text-yellow-900">
{`⚠️ CW: Suicidal thoughts, substance use

I've been really struggling lately...`}
                </pre>
              </div>
            </section>

            {/* Reporting */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">REPORTING AND MODERATION</h2>
              
              <h3 className="font-semibold text-gray-800 mb-2">How to Report</h3>
              <p className="mb-2">Report content or users that violate these guidelines:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4 mb-4">
                <li>Use the "Report" button in the app</li>
                <li>Email: report@mindbrother.com</li>
                <li>Describe the violation and provide context</li>
                <li>Include screenshots if helpful (but respect privacy)</li>
              </ol>

              <h3 className="font-semibold text-gray-800 mb-2">What Happens Next</h3>
              <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                <li><strong>Review:</strong> Moderators review reports within 24-48 hours</li>
                <li><strong>Investigation:</strong> We investigate the reported content/behavior</li>
                <li><strong>Action:</strong> Appropriate action is taken (warning, suspension, ban)</li>
                <li><strong>Follow-up:</strong> Reporters receive confirmation (privacy permitting)</li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">Consequences for Violations</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800 mb-2">
                  <li><strong>First offense (minor):</strong> Warning</li>
                  <li><strong>Second offense:</strong> Temporary suspension (3-7 days)</li>
                  <li><strong>Third offense:</strong> Longer suspension (30 days)</li>
                  <li><strong>Severe violations:</strong> Immediate permanent ban</li>
                </ul>
                <p className="text-sm text-red-800 font-semibold mt-2">Severe violations include:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                  <li>Threats of violence</li>
                  <li>Harassment or stalking</li>
                  <li>Sharing explicit content</li>
                  <li>Doxxing</li>
                  <li>Hate speech</li>
                  <li>Encouraging self-harm</li>
                  <li>Illegal activities</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-yellow-900 mb-2">FALSE REPORTS</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                  <li>Don't file false reports to harass others</li>
                  <li>Don't abuse the reporting system</li>
                  <li>False reports may result in your account being suspended</li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-800 mb-2">Moderator Authority</h3>
              <p className="mb-2">Moderators can remove content, issue warnings, suspend or ban accounts, and make final decisions. They will act fairly, explain decisions when appropriate, and protect user privacy.</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Appeals Process</h3>
                <p className="text-sm text-blue-800 mb-2">If you believe a moderation decision was wrong:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-sm text-blue-800">
                  <li>Email: appeals@mindbrother.com</li>
                  <li>Subject: "Moderation Appeal"</li>
                  <li>Include: Your username, the decision, and why you're appealing</li>
                  <li>Response: Within 5-7 business days</li>
                </ol>
              </div>
            </section>

            {/* Content Examples */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">CREATING POSITIVE CONTENT</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Examples of Great Community Content:</h3>
                  <ul className="list-none space-y-2 text-sm text-green-800">
                    <li>✅ "Just finished my first week of therapy. Scared to start but glad I did."</li>
                    <li>✅ "Anyone else struggle with talking about feelings? How do you open up?"</li>
                    <li>✅ "Completed my workout plan today. Small win but it counts."</li>
                    <li>✅ "Resources that helped me: [links to legitimate mental health resources]"</li>
                    <li>✅ "Checking in - how is everyone doing today?"</li>
                    <li>✅ "Proud of you brothers for showing up and doing the work."</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Examples of Content That Doesn't Belong:</h3>
                  <ul className="list-none space-y-2 text-sm text-red-800">
                    <li>❌ "Just end it all, nothing matters anyway" (crisis content, no resources offered)</li>
                    <li>❌ "Women are the cause of all my problems" (misogyny)</li>
                    <li>❌ "Real men don't cry" (toxic masculinity, harmful)</li>
                    <li>❌ "This app is trash, use [competitor] instead" (spam/advertising)</li>
                    <li>❌ "Check out my mixtape: [link]" (off-topic promotion)</li>
                    <li>❌ "[User] is a fake, here's their real name..." (doxxing)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Self-Care */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">SELF-CARE IN THE COMMUNITY</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">Protect Your Mental Health:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-blue-800">
                  <li>Take breaks from the app when needed</li>
                  <li>Mute or block triggering content or users</li>
                  <li>Set boundaries around your engagement</li>
                  <li>Don't try to be everyone's therapist</li>
                  <li>Seek professional help if you're struggling</li>
                  <li>Remember - you can't pour from an empty cup</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Digital Wellness Tips:</h3>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-green-800">
                  <li>Limit time in the app if it becomes stressful</li>
                  <li>Don't feel obligated to respond to everyone</li>
                  <li>It's okay to ignore conversations</li>
                  <li>Step away if discussions become heated</li>
                  <li>Prioritize in-person connections too</li>
                  <li>Balance online support with real-world support</li>
                </ul>
              </div>
            </section>

            {/* Special Circumstances */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">SPECIAL CIRCUMSTANCES</h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-900 mb-2">Community Member in Crisis</h3>
                <p className="text-sm text-red-800 mb-2">If a community member expresses suicidal thoughts or plans, intent to harm themselves or others, or severe mental health crisis:</p>
                <p className="text-sm text-red-800 font-semibold mb-2">Do:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-sm text-red-800 mb-2">
                  <li>Report to moderators immediately</li>
                  <li>Encourage them to call 988 or 911</li>
                  <li>Provide crisis resources</li>
                  <li>Be supportive but don't become their crisis counselor</li>
                </ol>
                <p className="text-sm text-red-800 font-semibold mb-2">Don't:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-red-800">
                  <li>Ignore warning signs</li>
                  <li>Promise to "save" them (you're not equipped)</li>
                  <li>Keep serious threats confidential</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Disagreements and Conflicts</h3>
                <p className="text-sm text-yellow-800 mb-2"><strong>Healthy conflict resolution:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-sm text-yellow-800 mb-2">
                  <li>Stay respectful</li>
                  <li>Listen to understand, not to respond</li>
                  <li>Acknowledge different perspectives</li>
                  <li>Agree to disagree if needed</li>
                  <li>Walk away if it's not productive</li>
                  <li>Report if it becomes harassment</li>
                </ol>
                <p className="text-sm text-yellow-800 font-semibold mb-2">Don't:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm text-yellow-800">
                  <li>Escalate into personal attacks</li>
                  <li>Drag others into the conflict</li>
                  <li>Take it to other platforms</li>
                  <li>Hold grudges</li>
                  <li>Create drama</li>
                </ul>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">UPDATES TO GUIDELINES</h2>
              <p className="mb-4">
                These Community Guidelines may be updated to reflect community needs, address new issues, clarify existing rules, and improve community safety. Updates will be announced in the app and via email.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">QUESTIONS ABOUT GUIDELINES</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Email:</strong> community@mindbrother.com<br/>
                  <strong>Subject:</strong> "Community Guidelines Question"
                </p>
              </div>
            </section>

            {/* Commitments */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">OUR COMMITMENT TO YOU</h2>
              <p className="mb-2">Mind Brother is committed to:</p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <ul className="list-none space-y-2 text-sm text-green-800">
                  <li>✅ Maintaining a safe, supportive community</li>
                  <li>✅ Enforcing guidelines fairly and consistently</li>
                  <li>✅ Listening to community feedback</li>
                  <li>✅ Continuously improving our policies</li>
                  <li>✅ Protecting your privacy and safety</li>
                  <li>✅ Supporting your wellness journey</li>
                </ul>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-3">YOUR COMMITMENT TO THE COMMUNITY</h2>
              <p className="mb-2">By participating, you commit to:</p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="list-none space-y-2 text-sm text-blue-800">
                  <li>✅ Following these Community Guidelines</li>
                  <li>✅ Treating others with respect</li>
                  <li>✅ Contributing positively</li>
                  <li>✅ Reporting violations</li>
                  <li>✅ Taking care of your own wellness</li>
                  <li>✅ Uplifting your brothers</li>
                </ul>
              </div>
            </section>

            {/* Final Thoughts */}
            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">FINAL THOUGHTS</h2>
              <p className="text-sm text-blue-800 mb-3">
                <strong>Mind Brother is what we make it.</strong>
              </p>
              <p className="text-sm text-blue-800 mb-3">
                This is OUR space - a place where Black and Brown men can be vulnerable, seek support, and grow together. Let's honor that by showing up with respect, empathy, and authenticity.
              </p>
              <p className="text-sm text-blue-800 font-semibold">
                <strong>We're all in this together, brothers. Let's build something meaningful.</strong> 💙
              </p>
            </section>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Community Guidelines effective as of December 1, 2024
              </p>
              <p className="text-sm text-gray-500 text-center mt-1">
                Mind Brother - Brothers Supporting Brothers
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



