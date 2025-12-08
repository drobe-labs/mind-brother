import React, { useState } from 'react';
import { mentalHealthResources, MentalHealthResource } from '../lib/mentalHealthResources';

export default function Resources() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'crisis', label: 'Crisis Support' },
    { value: 'therapy', label: 'Find a Therapist' },
    { value: 'support_groups', label: 'Support Groups' },
    { value: 'hotlines', label: 'Hotlines' }
  ];

  const filteredResources = mentalHealthResources.filter(resource => {
    if (showEmergencyOnly && !resource.isEmergency) return false;
    if (selectedCategory === 'all') return true;
    return resource.category === selectedCategory;
  });

  const emergencyResources = mentalHealthResources.filter(resource => resource.isEmergency);

  const ResourceCard = ({ resource }: { resource: MentalHealthResource }) => (
    <div className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow ${
      resource.isEmergency ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`font-semibold ${resource.isEmergency ? 'text-red-900' : 'text-gray-900'}`}>
          {resource.title}
        </h3>
        {resource.forMenOfColor && (
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
            MOC Focus
          </span>
        )}
        {resource.isEmergency && (
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            Emergency
          </span>
        )}
      </div>
      
      <p className={`text-sm mb-3 ${resource.isEmergency ? 'text-red-700' : 'text-gray-600'}`}>
        {resource.description}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {resource.phone && (
          <a
            href={`tel:${resource.phone.replace(/\D/g, '')}`}
            className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
              resource.isEmergency 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'text-white'
            } transition-colors`}
            style={!resource.isEmergency ? {
              backgroundColor: '#4470AD',
              ':hover': { backgroundColor: '#3A5F9A' }
            } : undefined}
          >
            {resource.phone}
          </a>
        )}
        
        {resource.url && (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-white transition-colors"
            style={{
              backgroundColor: '#4470AD',
              ':hover': { backgroundColor: '#3A5F9A' }
            }}
          >
            Visit Website
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-medium text-gray-900 mb-2">Mental Health Resources</h1>
        <p className="text-gray-600">
          Comprehensive resources for mental health support, with a focus on culturally competent care for men of color.
        </p>
      </div>

      {/* Emergency Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <h2 className="text-lg font-semibold text-red-900">In Crisis? Get Immediate Help</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {emergencyResources.map(resource => (
            <a
              key={resource.id}
              href={resource.phone ? `tel:${resource.phone.replace(/\D/g, '')}` : resource.url}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-center font-medium hover:bg-red-700 transition-colors"
            >
              {resource.title}
            </a>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.value
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedCategory === category.value ? {
                backgroundColor: '#4470AD',
                ':hover': { backgroundColor: '#3A5F9A' }
              } : undefined}
            >
              {category.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="emergency-only"
            checked={showEmergencyOnly}
            onChange={(e) => setShowEmergencyOnly(e.target.checked)}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="emergency-only" className="ml-2 text-sm text-gray-700">
            Show emergency resources only
          </label>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map(resource => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No resources found for the selected criteria.</p>
        </div>
      )}

      {/* Additional Help Section */}
      <div className="mt-12 rounded-lg p-6" style={{backgroundColor: '#CCDBEE'}}>
        <h2 className="text-xl font-semibold text-black mb-3">Need More Help?</h2>
        <p className="text-black mb-4">
          If you can't find what you're looking for, or need personalized guidance, consider:
        </p>
        <ul className="list-disc list-inside text-black space-y-1">
          <li>Talking to your primary care doctor about mental health referrals</li>
          <li>Contacting your insurance provider for covered mental health services</li>
          <li>Reaching out to local community health centers</li>
          <li>Asking trusted friends or family for recommendations</li>
          <li>Chatting with Amani, our AI mental health companion</li>
        </ul>
      </div>
    </div>
  );
}
