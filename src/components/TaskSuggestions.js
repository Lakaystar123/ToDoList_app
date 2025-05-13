import React from 'react';

const getSuggestions = () => {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  const suggestions = [];

  // Morning suggestions (5 AM - 11 AM)
  if (hour >= 5 && hour < 12) {
    suggestions.push(
      'Morning exercise',
      'Review daily goals',
      'Check emails',
      'Plan day ahead'
    );
  }
  // Afternoon suggestions (12 PM - 4 PM)
  else if (hour >= 12 && hour < 17) {
    suggestions.push(
      'Lunch break',
      'Team meeting',
      'Project review',
      'Client follow-up'
    );
  }
  // Evening suggestions (5 PM - 10 PM)
  else if (hour >= 17 && hour < 22) {
    suggestions.push(
      'Evening walk',
      'Dinner preparation',
      'Read a book',
      'Plan tomorrow'
    );
  }
  // Night suggestions (10 PM - 4 AM)
  else {
    suggestions.push(
      'Prepare for bed',
      'Set alarm',
      'Review tomorrow\'s schedule',
      'Meditate'
    );
  }

  // Add day-specific suggestions
  if (day === 1) { // Monday
    suggestions.push('Weekly planning', 'Team sync');
  } else if (day === 5) { // Friday
    suggestions.push('Week review', 'Plan weekend');
  }

  return suggestions;
};

function TaskSuggestions({ onAddTask }) {
  const suggestions = getSuggestions();

  return (
    <div className="relative group">
      <button
        className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transform hover:-translate-y-0.5 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        💡 Suggest
      </button>
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-10 hidden group-hover:block">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onAddTask(suggestion)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TaskSuggestions; 