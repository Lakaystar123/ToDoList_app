import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isToday, isYesterday, startOfDay } from 'date-fns';
import ToDoItem from './components/ToDoItem';
import MotivationalQuote from './components/MotivationalQuote';
import TaskSuggestions from './components/TaskSuggestions';
import { jsPDF } from 'jspdf';
import KonamiEasterEgg from './components/KonamiEasterEgg';

const CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Other'];

function App() {
  const [tasks, setTasks] = useState(() => {
    // Load tasks from localStorage on initial render
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [filter, setFilter] = useState('all'); // 'all', 'active', or 'completed'
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [streak, setStreak] = useState(() => {
    const savedStreak = localStorage.getItem('streak');
    return savedStreak ? JSON.parse(savedStreak) : { count: 0, lastCompleted: null };
  });
  const [isListening, setIsListening] = useState(false);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('streak', JSON.stringify(streak));
  }, [tasks, streak]);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check and update streak daily
  useEffect(() => {
    const checkStreak = () => {
      const lastCompleted = streak.lastCompleted ? startOfDay(new Date(streak.lastCompleted)) : null;
      const hasCompletedToday = tasks.some(task => 
        task.completed && isToday(new Date(task.completedAt))
      );

      // Only update streak if there's a change in completion status
      if (!hasCompletedToday && lastCompleted && !isToday(lastCompleted)) {
        setStreak({ count: 0, lastCompleted: null });
      }
    };

    // Check streak only when tasks or streak changes
    checkStreak();

    // Set up a daily check at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;

    const midnightCheck = setTimeout(() => {
      checkStreak();
      // After first midnight check, set up daily interval
      const dailyInterval = setInterval(checkStreak, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightCheck);
  }, [tasks, streak.lastCompleted]); // Only depend on tasks and lastCompleted date

  const handleAddTask = (text = newTask) => {
    // Convert input to string and trim
    const taskText = String(text || '').trim();
    
    if (taskText !== '') {
      const newTaskObj = {
        id: Date.now().toString(),
        text: taskText,
        completed: false,
        dueDate: newDueDate || null,
        category: newCategory,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      console.log('Adding new task:', newTaskObj); // Debug log
      setTasks(prevTasks => [...prevTasks, newTaskObj]);
      setNewTask('');
      setNewDueDate('');
      setNewCategory('Other');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleToggleComplete = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const completed = !task.completed;
        // Update streak when completing a task
        if (completed) {
          const today = new Date();
          const lastCompleted = streak.lastCompleted ? new Date(streak.lastCompleted) : null;
          
          if (!lastCompleted || isToday(lastCompleted)) {
            // Same day, maintain streak
            setStreak(prev => ({ ...prev, lastCompleted: today.toISOString() }));
          } else if (isYesterday(lastCompleted)) {
            // Yesterday, increment streak
            setStreak(prev => ({ count: prev.count + 1, lastCompleted: today.toISOString() }));
          } else {
            // Streak broken, start new streak
            setStreak({ count: 1, lastCompleted: today.toISOString() });
          }
        }
        return {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : null
        };
      }
      return task;
    }));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTasks(items);
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true; // 'all' filter
  });

  // Generate chart data for the last 7 days
  const getChartData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const completedTasks = tasks.filter(task => 
        task.completed && 
        isToday(new Date(task.completedAt)) === isToday(date)
      ).length;
      
      data.push({
        date: format(date, 'EEE'),
        completed: completedTasks
      });
    }
    return data;
  };

  // Export tasks to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const groupedTasks = tasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {});

    let y = 20;
    doc.setFontSize(16);
    doc.text('My Todo List', 20, y);
    y += 20;

    Object.entries(groupedTasks).forEach(([category, categoryTasks]) => {
      doc.setFontSize(14);
      doc.text(category, 20, y);
      y += 10;

      categoryTasks.forEach(task => {
        doc.setFontSize(12);
        const status = task.completed ? '✓' : '□';
        const text = `${status} ${task.text}${task.dueDate ? ` (Due: ${format(new Date(task.dueDate), 'MMM d, yyyy')})` : ''}`;
        doc.text(text, 25, y);
        y += 10;

        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      y += 10;
    });

    doc.save('todo-list.pdf');
  };

  // Speech recognition setup
  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          console.log('Speech transcript:', transcript); // Debug log
          handleAddTask(transcript);
        }
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  // Group tasks by category
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {});

  // Update TaskSuggestions component usage
  const handleSuggestionClick = (suggestion) => {
    if (typeof suggestion === 'string') {
      console.log('Adding suggestion:', suggestion); // Debug log
      handleAddTask(suggestion);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'} transition-colors duration-200 font-['Inter']`}>
      <KonamiEasterEgg />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  My To-Do List
                </h1>
                <div className="inline-block bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    🔥 {streak.count} Day{streak.count !== 1 ? 's' : ''} Streak
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="font-['Poppins'] text-lg italic text-gray-700 dark:text-gray-300 mb-8">
              <MotivationalQuote />
            </div>
          </div>

          {/* Main Content Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 mb-8">
            {/* Filter Bar */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  filter === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  filter === 'active'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                  filter === 'completed'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Completed
              </button>
            </div>

            {/* Task Input Section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a new task"
                  className="flex-1 min-w-[200px] px-4 py-2 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleAddTask()}
                  className="px-6 py-2 text-base font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transform hover:-translate-y-0.5 transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Add Task
                </button>
                <TaskSuggestions onAddTask={handleSuggestionClick} />
                <button
                  onClick={startListening}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                      : 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500'
                  }`}
                >
                  {isListening ? '🎤 Stop' : '🎤 Speak'}
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transform hover:-translate-y-0.5 transition duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                  📄 Export
                </button>
              </div>
            </div>

            {/* Chart Section */}
            <div className="h-64 mb-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tasks Section */}
            <DragDropContext onDragEnd={handleDragEnd}>
              {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
                <div key={category} className="mb-8 last:mb-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {category}
                  </h2>
                  <Droppable droppableId={category} type="TASK">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 ${snapshot.isDraggingOver ? 'bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2' : ''}`}
                      >
                        <AnimatePresence>
                          {categoryTasks.map((task, index) => (
                            <ToDoItem
                              key={task.id}
                              task={task}
                              index={index}
                              onDelete={() => handleDeleteTask(task.id)}
                              onToggleComplete={() => handleToggleComplete(task.id)}
                            />
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </DragDropContext>

            {filteredTasks.length === 0 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4"
              >
                {filter === 'all' 
                  ? 'No tasks yet. Add one above!'
                  : filter === 'active'
                  ? 'No active tasks'
                  : 'No completed tasks'}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Enhanced Floating Action Button */}
      <motion.button
        initial={{ scale: 1 }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{ 
          scale: 1.1,
          backgroundColor: "#0d9488"
        }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setNewTask('');
          setNewDueDate('');
          setNewCategory('Other');
          document.querySelector('input[type="text"]')?.focus();
        }}
        className="fixed bottom-4 right-4 w-14 h-14 bg-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50"
        aria-label="Add new task"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 4v16m8-8H4" 
          />
        </svg>
      </motion.button>
    </div>
  );
}

export default App;
