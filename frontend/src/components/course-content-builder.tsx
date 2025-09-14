"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import ContentPreview from './content-preview';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  status: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  content_type: string;
  file_path?: string;
  file_size?: number;
  page_count?: number;
  created_at: string;
  file_metadata?: any;
  is_processed: boolean;
}

interface GeneratedContent {
  id: number;
  content_type: string;
  generated_content: string;
  model_used: string;
  is_approved: boolean;
  created_at: string;
  approved_by?: number;
}

interface ContentGenerationRequest {
  content_type: string;
  title: string;
  description: string;
  additional_instructions?: string;
  use_rag: boolean;
}

interface ModuleContent {
  id: number;
  module_id: number;
  title: string;
  content: string;
  content_type: string;
  order: number;
  is_ai_generated: boolean;
  created_at: string;
}

interface CourseContentBuilderProps {
  courseId: number;
  onContentUpdate?: () => void;
}

export default function CourseContentBuilder({ courseId, onContentUpdate }: CourseContentBuilderProps) {
  const [activeTab, setActiveTab] = useState<'documents' | 'generate' | 'modules' | 'search'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [moduleContent, setModuleContent] = useState<ModuleContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  
  // Content generation state
  const [generationRequest, setGenerationRequest] = useState<ContentGenerationRequest>({
    content_type: 'learning_material',
    title: '',
    description: '',
    additional_instructions: '',
    use_rag: true
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Module content state
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    content_type: 'text',
    order: 0
  });

  useEffect(() => {
    loadDocuments();
    loadGeneratedContent();
  }, [courseId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/content/courses/${courseId}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        setError('Failed to load documents');
      }
    } catch (err) {
      setError('Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const loadGeneratedContent = async () => {
    try {
      const response = await fetch(`${api.baseUrl}/api/content/courses/${courseId}/generated-content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data);
      }
    } catch (err) {
      console.error('Error loading generated content:', err);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('course_id', courseId.toString());
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);

      const response = await fetch(`${api.baseUrl}/api/content/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments([...documents, data]);
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async (documentId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/content/documents/${documentId}/process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setError(null);
        // Refresh documents to show processed status
        loadDocuments();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Processing failed');
      }
    } catch (err) {
      setError('Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generationRequest.title || !generationRequest.description) return;

    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/content/courses/${courseId}/generate-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(generationRequest)
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent([data, ...generatedContent]);
        setGenerationRequest({
          content_type: 'learning_material',
          title: '',
          description: '',
          additional_instructions: '',
          use_rag: true
        });
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Generation failed');
      }
    } catch (err) {
      setError('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const approveContent = async (generationId: number) => {
    try {
      const response = await fetch(`${api.baseUrl}/api/content/generated-content/${generationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadGeneratedContent();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Approval failed');
      }
    } catch (err) {
      setError('Approval failed');
    }
  };

  const searchContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/content/courses/${courseId}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          top_k: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Search failed');
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const addToModule = async (content: string, title: string, moduleId: number) => {
    try {
      const response = await fetch(`${api.baseUrl}/api/content/modules/${moduleId}/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          module_id: moduleId,
          title: title,
          content: content,
          content_type: 'text',
          order: 0,
          is_ai_generated: true
        })
      });

      if (response.ok) {
        setError(null);
        onContentUpdate?.();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to add to module');
      }
    } catch (err) {
      setError('Failed to add to module');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Content Builder</h1>
        <p className="text-gray-600">Upload documents, generate AI content, and build comprehensive courses</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'documents', label: 'Documents', count: documents.length },
            { id: 'generate', label: 'AI Generation', count: generatedContent.length },
            { id: 'modules', label: 'Module Content', count: moduleContent.length },
            { id: 'search', label: 'Search Content', count: searchResults.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <form onSubmit={handleDocumentUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter document title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter document description"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Uploaded Documents</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Type: {doc.content_type}</span>
                        {doc.file_size && <span>Size: {(doc.file_size / 1024).toFixed(1)} KB</span>}
                        {doc.page_count && <span>Pages: {doc.page_count}</span>}
                        <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!doc.is_processed && (
                        <button
                          onClick={() => processDocument(doc.id)}
                          disabled={loading}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Process for AI
                        </button>
                      )}
                      {doc.is_processed && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Processed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No documents uploaded yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Generation Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generate AI Content</h2>
            <form onSubmit={generateContent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={generationRequest.content_type}
                    onChange={(e) => setGenerationRequest({
                      ...generationRequest,
                      content_type: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="learning_material">Learning Material</option>
                    <option value="lesson_plan">Lesson Plan</option>
                    <option value="knowledge_test">Knowledge Test</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Use RAG (Document Context)
                  </label>
                  <select
                    value={generationRequest.use_rag ? 'true' : 'false'}
                    onChange={(e) => setGenerationRequest({
                      ...generationRequest,
                      use_rag: e.target.value === 'true'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Yes - Use uploaded documents</option>
                    <option value="false">No - Generate from scratch</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={generationRequest.title}
                  onChange={(e) => setGenerationRequest({
                    ...generationRequest,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter content title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={generationRequest.description}
                  onChange={(e) => setGenerationRequest({
                    ...generationRequest,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what you want to generate"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Instructions
                </label>
                <textarea
                  value={generationRequest.additional_instructions}
                  onChange={(e) => setGenerationRequest({
                    ...generationRequest,
                    additional_instructions: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any specific requirements or instructions"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </button>
            </form>
          </div>

          {/* Prompt Examples Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 RAG AI Prompt Examples</h3>
            <p className="text-blue-800 mb-4">
              Use these examples to get the most out of the RAG AI system. The AI will analyze your uploaded documents and generate content based on your specific requirements.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Learning Materials */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">📚 Learning Materials</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Safety Procedures for Excavator Operations"<br/>
                        <strong>Description:</strong> "Create a comprehensive guide covering pre-operation checks, safe operating procedures, and emergency protocols for excavator operators based on the uploaded manual."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Safety Procedures for Excavator Operations",
                            description: "Create a comprehensive guide covering pre-operation checks, safe operating procedures, and emergency protocols for excavator operators based on the uploaded manual."
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Understanding Load Charts and Stability"<br/>
                        <strong>Description:</strong> "Generate an educational module explaining how to read load charts, calculate safe lifting capacities, and maintain stability during crane operations."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Understanding Load Charts and Stability",
                            description: "Generate an educational module explaining how to read load charts, calculate safe lifting capacities, and maintain stability during crane operations."
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lesson Plans */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Lesson Plans</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "2-Hour Practical Training Session"<br/>
                        <strong>Description:</strong> "Design a hands-on lesson plan for teaching proper excavator bucket techniques, including objectives, activities, and assessment criteria."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "2-Hour Practical Training Session",
                            description: "Design a hands-on lesson plan for teaching proper excavator bucket techniques, including objectives, activities, and assessment criteria.",
                            content_type: "lesson_plan"
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Classroom Theory on GPS Machine Control"<br/>
                        <strong>Description:</strong> "Create a structured lesson covering GPS fundamentals, machine control systems, and practical applications for construction equipment."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Classroom Theory on GPS Machine Control",
                            description: "Create a structured lesson covering GPS fundamentals, machine control systems, and practical applications for construction equipment.",
                            content_type: "lesson_plan"
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Knowledge Tests */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">🧠 Knowledge Tests</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Excavator Safety Assessment"<br/>
                        <strong>Description:</strong> "Generate 20 multiple-choice questions testing knowledge of excavator safety procedures, maintenance requirements, and operational best practices."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Excavator Safety Assessment",
                            description: "Generate 20 multiple-choice questions testing knowledge of excavator safety procedures, maintenance requirements, and operational best practices.",
                            content_type: "knowledge_test"
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Load Chart Interpretation Quiz"<br/>
                        <strong>Description:</strong> "Create practical questions requiring students to interpret load charts, calculate safe working loads, and identify stability factors."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Load Chart Interpretation Quiz",
                            description: "Create practical questions requiring students to interpret load charts, calculate safe working loads, and identify stability factors.",
                            content_type: "knowledge_test"
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Prompts */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Advanced Prompts</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Troubleshooting Guide"<br/>
                        <strong>Description:</strong> "Create a step-by-step troubleshooting guide for common excavator hydraulic issues, including symptoms, causes, and solutions."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Troubleshooting Guide",
                            description: "Create a step-by-step troubleshooting guide for common excavator hydraulic issues, including symptoms, causes, and solutions."
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-gray-700 relative group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>Title:</strong> "Site-Specific Risk Assessment"<br/>
                        <strong>Description:</strong> "Generate a template for conducting risk assessments on construction sites, including hazard identification and control measures."
                      </div>
                      <button
                        onClick={() => {
                          setGenerationRequest({
                            ...generationRequest,
                            title: "Site-Specific Risk Assessment",
                            description: "Generate a template for conducting risk assessments on construction sites, including hazard identification and control measures."
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips for Better Results:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Be specific:</strong> Include details about target audience, difficulty level, and learning objectives</li>
                <li>• <strong>Use context:</strong> Reference specific sections or topics from your uploaded documents</li>
                <li>• <strong>Set requirements:</strong> Specify format, length, or specific elements you want included</li>
                <li>• <strong>Add instructions:</strong> Use the "Additional Instructions" field for specific formatting or content requirements</li>
              </ul>
            </div>
          </div>

          {/* Generated Content List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Generated Content</h2>
            </div>
            <div className="space-y-6">
              {generatedContent.map((content) => (
                <ContentPreview
                  key={content.id}
                  content={content}
                  onSave={async (id, updatedContent) => {
                    // TODO: Implement save functionality
                    console.log('Saving content:', id, updatedContent);
                  }}
                  onApprove={approveContent}
                  onCopy={(content) => {
                    navigator.clipboard.writeText(content);
                  }}
                  onDownload={(content, filename) => {
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                />
              ))}
              {generatedContent.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No content generated yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Search Course Content</h2>
            <form onSubmit={searchContent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Query
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search for specific topics, concepts, or information"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Content'}
              </button>
            </form>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Search Results</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            Score: {(result.score * 100).toFixed(1)}%
                          </span>
                          <span className="text-sm text-gray-500">
                            Source: {result.metadata?.title || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-gray-700">{result.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Module Content Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Module Content Management</h2>
            <p className="text-gray-600">
              Manage content within course modules. You can add generated content or create new content directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
