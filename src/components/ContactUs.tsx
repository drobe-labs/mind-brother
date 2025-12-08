import React, { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'individual' as 'individual' | 'professional' | 'other'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the data to your backend
      console.log('Contact form submission:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        userType: 'individual'
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6" style={{background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%)'}}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-black text-2xl">✊</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're here to support you. Reach out with questions, feedback, or if you need help navigating your mental health journey.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-3xl mb-6">📧</div>
            <h3 className="font-semibold text-gray-900 mb-3">Email Support</h3>
            <p className="text-gray-600 text-sm">support@mindbrother.com</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-3xl mb-6">🚨</div>
            <h3 className="font-semibold text-gray-900 mb-3">Crisis Support</h3>
            <a href="tel:988" className="text-red-600 text-sm font-medium hover:text-red-700">
              Call 988 - 24/7 Crisis Line
            </a>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-3xl mb-6 font-bold text-indigo-600">C</div>
            <h3 className="font-semibold text-gray-900 mb-3">Community</h3>
            <p className="text-gray-600 text-sm">Join our discussions</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type */}
            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
                I am a... *
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="individual">Individual seeking support</option>
                <option value="professional">Mental health professional</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email address"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="What is this regarding?"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Share your message, question, or feedback..."
              />
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-blue-600">🔒</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Privacy & Confidentiality</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your information is kept confidential. For immediate crisis support, please call 988 or emergency services.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'text-white'
                }`}
                style={!isSubmitting ? { backgroundColor: '#4470AD' } : undefined}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#3A5F9A')}
                onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#4470AD')}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Message...
                  </div>
                ) : (
                  'Send Message'
                )}
              </button>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-green-600 mr-3">✅</span>
                  <div>
                    <h4 className="text-sm font-medium text-green-900">Message sent successfully!</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 mr-3">❌</span>
                  <div>
                    <h4 className="text-sm font-medium text-red-900">Failed to send message</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Please try again or contact us directly at support@mindbrother.com
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Additional Ways to Get Support</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🤖 Chat with Amani</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get immediate support from our AI mental health companion, available 24/7.
              </p>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                Start Chat →
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Community Support</h3>
              <p className="text-gray-600 text-sm mb-4">
                Connect with others who understand your experiences in our safe community.
              </p>
              <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                Join Discussions →
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is Mind Brother free to use?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all core features including Amani AI chat, journaling, and community discussions are completely free.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Is my information private and secure?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely. We use industry-standard encryption and never share your personal information. Your journal entries are completely private.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can Mind Brother replace therapy?</h3>
              <p className="text-gray-600 text-sm">
                Mind Brother is a supportive tool, but it's not a replacement for professional mental health care. We encourage seeking professional help when needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
