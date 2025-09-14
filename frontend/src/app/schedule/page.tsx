"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User,
  BookOpen, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { api } from '@/lib/api';

interface CourseEvent {
  id: number;
  title: string;
  course_id: number;
  course_title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  instructor: string;
  max_participants: number;
  current_participants: number;
  event_type: 'class' | 'exam' | 'practical' | 'meeting' | 'deadline';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  color: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CourseEvent[];
}

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CourseEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CourseEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Comprehensive seed data for construction training calendar (2025 dates)
  const sampleEvents: CourseEvent[] = [
    // September 2025 Events
    {
      id: 1,
      title: "Excavator Safety Training - Module 1",
      course_id: 1,
      course_title: "Plant Operations Level 2",
      start_date: "2025-09-08",
      end_date: "2025-09-08",
      start_time: "09:00",
      end_time: "17:00",
      location: "Training Center A",
      instructor: "John Smith",
      max_participants: 12,
      current_participants: 10,
      event_type: "class",
      status: "completed",
      description: "Introduction to excavator safety procedures and pre-operation checks",
      color: "bg-blue-500"
    },
    {
      id: 2,
      title: "GPS Machine Control Theory",
      course_id: 2,
      course_title: "GPS Training Course",
      start_date: "2025-09-10",
      end_date: "2025-09-10",
      start_time: "09:00",
      end_time: "12:00",
      location: "Computer Lab",
      instructor: "Sarah Johnson",
      max_participants: 20,
      current_participants: 18,
      event_type: "class",
      status: "completed",
      description: "Fundamentals of GPS machine control systems and applications",
      color: "bg-blue-500"
    },
    {
      id: 3,
      title: "Load Chart Interpretation Workshop",
      course_id: 1,
      course_title: "Plant Operations Level 2",
      start_date: "2025-09-12",
      end_date: "2025-09-12",
      start_time: "14:00",
      end_time: "17:00",
      location: "Workshop B",
      instructor: "Mike Wilson",
      max_participants: 8,
      current_participants: 8,
      event_type: "practical",
      status: "completed",
      description: "Hands-on workshop for load chart reading and stability calculations",
      color: "bg-green-500"
    },
    {
      id: 4,
      title: "NRSWA Registration Deadline",
      course_id: 3,
      course_title: "NRSWA Training",
      start_date: "2025-09-15",
      end_date: "2025-09-15",
      start_time: "23:59",
      end_time: "23:59",
      location: "Online",
      instructor: "System",
      max_participants: 50,
      current_participants: 45,
      event_type: "deadline",
      status: "completed",
      description: "Final deadline for NRSWA Training course registration",
      color: "bg-orange-500"
    },
    {
      id: 5,
      title: "Instructor Monthly Meeting",
      course_id: 0,
      course_title: "Staff Meeting",
      start_date: "2025-09-16",
      end_date: "2025-09-16",
      start_time: "10:00",
      end_time: "11:30",
      location: "Conference Room",
      instructor: "Training Manager",
      max_participants: 15,
      current_participants: 15,
      event_type: "meeting",
      status: "completed",
      description: "Monthly instructor coordination and training updates",
      color: "bg-purple-500"
    },
    {
      id: 6,
      title: "Excavator Practical Assessment",
      course_id: 1,
      course_title: "Plant Operations Level 2",
      start_date: "2025-09-18",
      end_date: "2025-09-18",
      start_time: "09:00",
      end_time: "16:00",
      location: "Training Yard",
      instructor: "John Smith",
      max_participants: 8,
      current_participants: 6,
      event_type: "practical",
      status: "scheduled",
      description: "Practical assessment of excavator operation skills",
      color: "bg-green-500"
    },
    {
      id: 7,
      title: "GPS Machine Control Exam",
      course_id: 2,
      course_title: "GPS Training Course",
      start_date: "2025-09-22",
      end_date: "2025-09-22",
      start_time: "10:00",
      end_time: "12:00",
      location: "Computer Lab",
      instructor: "Sarah Johnson",
      max_participants: 20,
      current_participants: 18,
      event_type: "exam",
      status: "scheduled",
      description: "Written examination on GPS machine control systems",
      color: "bg-red-500"
    },
    {
      id: 8,
      title: "Site Safety Plus Course",
      course_id: 4,
      course_title: "Site Safety Plus",
      start_date: "2025-09-24",
      end_date: "2025-09-26",
      start_time: "09:00",
      end_time: "17:00",
      location: "Training Center B",
      instructor: "David Brown",
      max_participants: 25,
      current_participants: 22,
      event_type: "class",
      status: "scheduled",
      description: "3-day CITB accredited Site Safety Plus course",
      color: "bg-blue-500"
    },
    {
      id: 9,
      title: "Utility Detection Training",
      course_id: 5,
      course_title: "Utility Detection & Mapping",
      start_date: "2025-09-29",
      end_date: "2025-09-29",
      start_time: "09:00",
      end_time: "16:00",
      location: "Detection Facility",
      instructor: "Emma Davis",
      max_participants: 12,
      current_participants: 10,
      event_type: "practical",
      status: "scheduled",
      description: "Hands-on utility detection and mapping training",
      color: "bg-green-500"
    },
    {
      id: 10,
      title: "Course Evaluation Deadline",
      course_id: 1,
      course_title: "Plant Operations Level 2",
      start_date: "2025-09-30",
      end_date: "2025-09-30",
      start_time: "23:59",
      end_time: "23:59",
      location: "Online",
      instructor: "System",
      max_participants: 12,
      current_participants: 10,
      event_type: "deadline",
      status: "scheduled",
      description: "Deadline for course evaluation and feedback submission",
      color: "bg-orange-500"
    },

    // October 2025 Events
    {
      id: 11,
      title: "Roller Operations Training",
      course_id: 6,
      course_title: "Compaction Equipment Operations",
      start_date: "2025-10-05",
      end_date: "2025-10-05",
      start_time: "09:00",
      end_time: "17:00",
      location: "Training Yard",
      instructor: "James Wilson",
      max_participants: 10,
      current_participants: 8,
      event_type: "class",
      status: "scheduled",
      description: "Comprehensive roller operation and compaction techniques",
      color: "bg-blue-500"
    },
    {
      id: 12,
      title: "Telehandler Safety Assessment",
      course_id: 7,
      course_title: "Telehandler Operations",
      start_date: "2025-10-08",
      end_date: "2025-10-08",
      start_time: "14:00",
      end_time: "17:00",
      location: "Workshop A",
      instructor: "Lisa Anderson",
      max_participants: 8,
      current_participants: 6,
      event_type: "practical",
      status: "scheduled",
      description: "Practical assessment of telehandler safety procedures",
      color: "bg-green-500"
    },
    {
      id: 13,
      title: "Plant Apprenticeship Induction",
      course_id: 8,
      course_title: "Plant Operative Apprenticeship",
      start_date: "2025-10-12",
      end_date: "2025-10-12",
      start_time: "10:00",
      end_time: "15:00",
      location: "Main Hall",
      instructor: "Training Manager",
      max_participants: 30,
      current_participants: 25,
      event_type: "meeting",
      status: "scheduled",
      description: "Induction session for new plant operative apprentices",
      color: "bg-purple-500"
    },
    {
      id: 14,
      title: "Dumper Truck Operations Exam",
      course_id: 9,
      course_title: "Dumper Operations",
      start_date: "2025-10-15",
      end_date: "2025-10-15",
      start_time: "10:00",
      end_time: "12:00",
      location: "Computer Lab",
      instructor: "Tom Roberts",
      max_participants: 15,
      current_participants: 12,
      event_type: "exam",
      status: "scheduled",
      description: "Written examination on dumper truck operations and safety",
      color: "bg-red-500"
    },
    {
      id: 15,
      title: "Skills Bootcamp Launch",
      course_id: 10,
      course_title: "Digital Construction Skills",
      start_date: "2025-10-19",
      end_date: "2025-10-19",
      start_time: "09:00",
      end_time: "16:00",
      location: "Innovation Lab",
      instructor: "Alex Chen",
      max_participants: 20,
      current_participants: 18,
      event_type: "class",
      status: "scheduled",
      description: "Launch of digital construction skills bootcamp program",
      color: "bg-blue-500"
    },
    {
      id: 16,
      title: "Health & Safety Refresher",
      course_id: 11,
      course_title: "H&S Short Courses",
      start_date: "2025-10-22",
      end_date: "2025-10-22",
      start_time: "09:00",
      end_time: "12:00",
      location: "Training Center A",
      instructor: "Maria Garcia",
      max_participants: 25,
      current_participants: 20,
      event_type: "class",
      status: "scheduled",
      description: "Health and safety refresher course for construction workers",
      color: "bg-blue-500"
    },
    {
      id: 17,
      title: "Equipment Maintenance Workshop",
      course_id: 12,
      course_title: "Plant Maintenance",
      start_date: "2025-10-26",
      end_date: "2025-10-26",
      start_time: "14:00",
      end_time: "17:00",
      location: "Maintenance Bay",
      instructor: "Steve Taylor",
      max_participants: 12,
      current_participants: 10,
      event_type: "practical",
      status: "scheduled",
      description: "Hands-on workshop for basic plant equipment maintenance",
      color: "bg-green-500"
    },
    {
      id: 18,
      title: "Course Completion Deadline",
      course_id: 2,
      course_title: "GPS Training Course",
      start_date: "2025-10-28",
      end_date: "2025-10-28",
      start_time: "23:59",
      end_time: "23:59",
      location: "Online",
      instructor: "System",
      max_participants: 20,
      current_participants: 18,
      event_type: "deadline",
      status: "scheduled",
      description: "Final deadline for GPS Training Course completion",
      color: "bg-orange-500"
    },

    // November 2025 Events
    {
      id: 19,
      title: "Dozer Operations Training",
      course_id: 13,
      course_title: "Earthmoving Equipment",
      start_date: "2025-11-04",
      end_date: "2025-11-04",
      start_time: "09:00",
      end_time: "17:00",
      location: "Training Yard",
      instructor: "Mark Thompson",
      max_participants: 8,
      current_participants: 6,
      event_type: "class",
      status: "scheduled",
      description: "Comprehensive dozer operation and earthmoving techniques",
      color: "bg-blue-500"
    },
    {
      id: 20,
      title: "NOCN Assessment Day",
      course_id: 14,
      course_title: "NOCN Accredited Courses",
      start_date: "2025-11-07",
      end_date: "2025-11-07",
      start_time: "09:00",
      end_time: "16:00",
      location: "Assessment Center",
      instructor: "NOCN Assessor",
      max_participants: 15,
      current_participants: 12,
      event_type: "exam",
      status: "scheduled",
      description: "NOCN accredited assessment for construction competencies",
      color: "bg-red-500"
    },
    {
      id: 21,
      title: "Instructor Development Workshop",
      course_id: 0,
      course_title: "Staff Development",
      start_date: "2025-11-11",
      end_date: "2025-11-11",
      start_time: "09:00",
      end_time: "16:00",
      location: "Conference Room",
      instructor: "External Trainer",
      max_participants: 20,
      current_participants: 18,
      event_type: "meeting",
      status: "scheduled",
      description: "Professional development workshop for instructors",
      color: "bg-purple-500"
    },
    {
      id: 22,
      title: "Wheeled Loading Shovel Practical",
      course_id: 15,
      course_title: "Loading Operations",
      start_date: "2025-11-14",
      end_date: "2025-11-14",
      start_time: "09:00",
      end_time: "16:00",
      location: "Loading Bay",
      instructor: "Paul Mitchell",
      max_participants: 10,
      current_participants: 8,
      event_type: "practical",
      status: "scheduled",
      description: "Practical training for wheeled loading shovel operations",
      color: "bg-green-500"
    },
    {
      id: 23,
      title: "CPCS Renewal Course",
      course_id: 16,
      course_title: "CPCS Renewal",
      start_date: "2025-11-18",
      end_date: "2025-11-20",
      start_time: "09:00",
      end_time: "17:00",
      location: "Training Center B",
      instructor: "CPCS Assessor",
      max_participants: 12,
      current_participants: 10,
      event_type: "class",
      status: "scheduled",
      description: "3-day CPCS renewal course for existing card holders",
      color: "bg-blue-500"
    },
    {
      id: 24,
      title: "Site Right Certification",
      course_id: 17,
      course_title: "Site Right Training",
      start_date: "2025-11-25",
      end_date: "2025-11-25",
      start_time: "09:00",
      end_time: "16:00",
      location: "Training Center A",
      instructor: "Site Right Assessor",
      max_participants: 20,
      current_participants: 18,
      event_type: "class",
      status: "scheduled",
      description: "Site Right certification for construction site access",
      color: "bg-blue-500"
    },
    {
      id: 25,
      title: "Quarterly Review Meeting",
      course_id: 0,
      course_title: "Management Meeting",
      start_date: "2025-11-28",
      end_date: "2025-11-28",
      start_time: "14:00",
      end_time: "16:00",
      location: "Boardroom",
      instructor: "Training Director",
      max_participants: 12,
      current_participants: 12,
      event_type: "meeting",
      status: "scheduled",
      description: "Quarterly review of training programs and performance",
      color: "bg-purple-500"
    }
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/schedule/events`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        // Fallback to sample data if API fails
        console.warn('API failed, using sample data');
        setEvents(sampleEvents);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to sample data on error
      setEvents(sampleEvents);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'class': return <BookOpen className="h-4 w-4" />;
      case 'exam': return <Users className="h-4 w-4" />;
      case 'practical': return <MapPin className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'deadline': return <Clock className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'class': return 'Class';
      case 'exam': return 'Exam';
      case 'practical': return 'Practical';
      case 'meeting': return 'Meeting';
      case 'deadline': return 'Deadline';
      default: return 'Event';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === date.toDateString();
      });
      
      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        events: dayEvents
      });
    }
    
    return days;
  };

  const filteredEvents = events.filter(event => {
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const exportSchedule = () => {
    // TODO: Implement schedule export functionality
    console.log('Exporting schedule...');
  };

  const handleEventClick = (event: CourseEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPath="/schedule" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={exportSchedule} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => console.log('Add event')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="class">Classes</option>
                <option value="exam">Exams</option>
                <option value="practical">Practical</option>
                <option value="meeting">Meetings</option>
                <option value="deadline">Deadlines</option>
              </select>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === mode
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <Button onClick={goToToday} variant="outline" size="sm">
                Today
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => navigateMonth('prev')}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigateMonth('next')}
                  variant="outline"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Week day headers */}
                {weekDays.map((day) => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[120px] ${
                      !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    } ${day.isToday ? 'bg-blue-50 border-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        day.isToday ? 'text-blue-600' : ''
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {day.events.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          {day.events.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {day.events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${event.color} text-white`}
                          onClick={() => handleEventClick(event)}
                        >
                          {event.start_time} - {event.title}
                        </div>
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{day.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'week' && (
              <div className="space-y-4">
                <div className="text-center text-lg font-semibold text-gray-700">
                  Week of {currentDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </div>
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day, index) => {
                    const dayDate = new Date(currentDate);
                    dayDate.setDate(currentDate.getDate() - currentDate.getDay() + index);
                    const dayEvents = getEventsForDate(dayDate);
                    
                    return (
                      <div key={day} className="space-y-2">
                        <div className="text-center font-medium text-gray-700">
                          {day}
                          <div className="text-sm text-gray-500">
                            {dayDate.getDate()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`p-2 rounded text-xs ${event.color} text-white`}
                            >
                              <div className="font-medium">{event.title}</div>
                              <div>{event.start_time}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'day' && (
              <div className="space-y-4">
                <div className="text-center text-lg font-semibold text-gray-700">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric' 
                  }) : currentDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </div>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate || currentDate).map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`p-1 rounded ${event.color} text-white`}>
                              {getEventTypeIcon(event.event_type)}
                            </div>
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <Badge className={getStatusColor(event.status)}>
                              {getEventTypeLabel(event.event_type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {event.start_time} - {event.end_time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {event.current_participants}/{event.max_participants}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{event.instructor}</div>
                          <div className="text-xs text-gray-500">{event.course_title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {getEventsForDate(selectedDate || currentDate).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No events scheduled for this day
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`p-1 rounded ${event.color} text-white`}>
                              {getEventTypeIcon(event.event_type)}
                            </div>
                            <h3 className="font-semibold text-gray-900">{event.title}</h3>
                            <Badge className={getStatusColor(event.status)}>
                              {getStatusColor(event.status).includes('blue') ? 'Scheduled' : 
                               getStatusColor(event.status).includes('yellow') ? 'In Progress' :
                               getStatusColor(event.status).includes('green') ? 'Completed' : 'Cancelled'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.start_date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {event.start_time} - {event.end_time}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{event.instructor}</div>
                          <div className="text-xs text-gray-500">{event.course_title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No events found matching your criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="font-semibold">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-semibold">
                    {events.filter(e => {
                      const eventDate = new Date(e.start_date);
                      return eventDate.getMonth() === currentDate.getMonth() && 
                             eventDate.getFullYear() === currentDate.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Classes</span>
                  <span className="font-semibold">
                    {events.filter(e => e.event_type === 'class').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Exams</span>
                  <span className="font-semibold">
                    {events.filter(e => e.event_type === 'exam').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {events
                    .filter(e => e.event_type === 'deadline')
                    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                        <div className="font-medium text-sm">{event.title}</div>
                        <div className="text-xs text-gray-600">
                          {new Date(event.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                  <p className="text-lg text-gray-600">{selectedEvent.course_title}</p>
                </div>
                <button
                  onClick={closeEventModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(selectedEvent.start_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedEvent.start_time} - {selectedEvent.end_time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{selectedEvent.location}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">{selectedEvent.instructor}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">
                        {selectedEvent.current_participants} / {selectedEvent.max_participants} participants
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Event Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Type:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEvent.event_type === 'class' ? 'bg-blue-100 text-blue-800' :
                        selectedEvent.event_type === 'exam' ? 'bg-red-100 text-red-800' :
                        selectedEvent.event_type === 'practical' ? 'bg-green-100 text-green-800' :
                        selectedEvent.event_type === 'meeting' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {selectedEvent.event_type.charAt(0).toUpperCase() + selectedEvent.event_type.slice(1)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedEvent.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        selectedEvent.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-700">Course ID:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedEvent.course_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeEventModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit event:', selectedEvent.id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Edit Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
