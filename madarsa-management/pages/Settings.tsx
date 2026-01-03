import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui';
import { Clock, BookOpen, Users, ChevronRight } from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();

  const settingCards = [
    {
      title: 'Time Slots',
      description: 'Manage class timings, shifts, and durations.',
      icon: Clock,
      path: '/settings/timeslots',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Classes',
      description: 'Configure class levels, sections, and descriptions.',
      icon: BookOpen,
      path: '/settings/classes',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Teachers',
      description: 'Add or remove teachers and manage their profiles.',
      icon: Users,
      path: '/settings/teachers',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary-500">Settings</h2>
      <p className="text-primary">Manage your institution's configuration and resources.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingCards.map((card) => (
          <Card 
            key={card.title} 
            className="cursor-pointer hover:shadow-lg transition-shadow group relative overflow-hidden"
          >
            <div 
              onClick={() => navigate(card.path)} 
              className="flex items-start justify-between h-full"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};