import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { fetchClasses } from '../api/client';
import { generateAdminToken, generateClassToken } from '../utils/routes';
import { useAuth } from '../contexts/AuthContext';
import type { Class } from '../types/api';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    try {
      setLoading(true);
      const fetchedClasses = await fetchClasses();
      setClasses(fetchedClasses);
    } catch (err) {
      console.error('Error loading classes:', err);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }

  function goToAdmin() {
    const token = generateAdminToken();
    localStorage.setItem('rdv-admin-token', token);
    navigate(`/admin/${token}`);
  }

  function goToClassSchedule(classId: string) {
    const token = generateClassToken(classId);
    localStorage.setItem('rdv-class-token', token);
    navigate(`/class/${classId}/${token}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center">
        <FormattedMessage id="home.welcome" defaultMessage="Welcome to RDV Scheduling" />
      </h1>
      
      {/* User role indicator */}
      {user?.roles && user.roles.length > 0 && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full">
            <span className="text-gray-400 text-sm">
              <FormattedMessage id="home.loggedInAs" defaultMessage="Logged in as:" />
            </span>
            <div className="flex gap-1">
              {user.roles.map((role) => (
                <span 
                  key={role}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    role === 'administrator' ? 'bg-red-600 text-white' :
                    role === 'class_lead' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}
                >
                  <FormattedMessage 
                    id={`auth.role${role.charAt(0).toUpperCase()}${role.slice(1).replace('_', '')}`}
                    defaultMessage={role}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-6 mt-8">
        {classes.map(cls => (
          <button
            key={cls.id}
            onClick={() => goToClassSchedule(cls.id)}
            className="p-6 text-left rounded-lg transition-transform hover:scale-102 transform"
            style={{ 
              backgroundColor: cls.color + '20',
              borderLeft: `4px solid ${cls.color}`
            }}
          >
            <h2 className="text-xl font-semibold mb-2">{cls.name}</h2>
            {cls.description && (
              <p className="text-gray-300">{cls.description}</p>
            )}
          </button>
        ))}
      </div>

      <div className="mt-12 text-center">
        {/* Show admin controls if user has admin/class_lead privileges */}
        {user?.roles && (user.roles.includes('administrator') || user.roles.includes('class_lead')) ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Admin Access - for administrators and class leads */}
            <button
              onClick={goToAdmin}
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors"
            >
              <FormattedMessage id="nav.admin" defaultMessage="Admin Access" />
            </button>
            
            {/* User Approval - for administrators and class leads */}
            {(user.roles.includes('administrator') || user.roles.includes('class_lead')) && (
              <button
                onClick={() => navigate('/user-approval')}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
              >
                <FormattedMessage id="nav.userApproval" defaultMessage="User Approval" />
              </button>
            )}
          </div>
        ) : (
          /* Show message for regular users (parents) */
          <div className="text-gray-400 text-sm">
            <FormattedMessage 
              id="home.parentMessage" 
              defaultMessage="Select a class above to view and book appointments"
            />
          </div>
        )}
      </div>
    </div>
  );
}