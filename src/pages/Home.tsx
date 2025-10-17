import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { fetchClasses } from '../api/client';
import { generateAdminToken, generateClassToken } from '../utils/routes';
import type { Class } from '../types/api';

export default function Home() {
  const navigate = useNavigate();
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
      <h1 className="text-3xl font-bold mb-8 text-center">
        <FormattedMessage id="home.welcome" defaultMessage="Welcome to RDV Scheduling" />
      </h1>

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
        <button
          onClick={goToAdmin}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium"
        >
          <FormattedMessage id="nav.admin" defaultMessage="Admin Access" />
        </button>
      </div>
    </div>
  );
}