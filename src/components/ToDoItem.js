import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { format, isToday, isTomorrow } from 'date-fns';

function ToDoItem({ task, index, onDelete, onToggleComplete }) {
  const getDueDateColor = (dueDate) => {
    if (!dueDate) return 'bg-gray-100 dark:bg-gray-700';
    const date = new Date(dueDate);
    if (isToday(date)) return 'bg-red-100 dark:bg-red-900';
    if (isTomorrow(date)) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-green-100 dark:bg-green-900';
  };

  // Ensure task text is a string
  const taskText = String(task.text || '');

  return (
    <Draggable draggableId={String(task.id)} index={index} type="TASK">
      {(provided, snapshot) => (
        <motion.li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className={`group ${snapshot.isDragging ? 'shadow-lg' : ''}`}
        >
          <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 ${
            snapshot.isDragging ? 'ring-2 ring-blue-500' : ''
          }`}>
            {/* Main Row: Checkbox and Task Text */}
            <div className="flex items-start gap-2 mb-2">
              <button
                onClick={onToggleComplete}
                className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                  task.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                }`}
              >
                {task.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={false}
                  animate={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.6 : 1
                  }}
                  className="flex flex-col"
                >
                  <h3 className={`text-base font-medium text-gray-900 dark:text-gray-100 truncate ${
                    task.completed ? 'line-through opacity-60' : ''
                  }`}>
                    {taskText}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {task.category}
                    </span>
                    {task.dueDate && (
                      <span className={`text-xs font-normal px-2 py-0.5 rounded-full ${getDueDateColor(task.dueDate)}`}>
                        {format(new Date(task.dueDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </motion.div>
              </div>
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 opacity-0 group-hover:opacity-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Delete task"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </motion.li>
      )}
    </Draggable>
  );
}

export default ToDoItem; 