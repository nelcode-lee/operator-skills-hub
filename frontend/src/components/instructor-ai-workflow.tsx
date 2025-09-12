"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api, getAuthHeadersForm } from '@/lib/api';
import { 
  Upload, 
  FileText, 
  BookOpen, 
  ClipboardList, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
}

interface Document {
  id: number;
  title: string;
  description: string;
  content_type: string;
  file_size: number;
  created_at: string;
  is_processed: boolean;
}

interface ContentGeneration {
  id: number;
  content_type: string;
  prompt: string;
  generated_content: string;
  model_used: string;
  course_id: number;
  is_approved: boolean;
  created_at: string;
  approved_at?: string;
  approved_by?: number;
}

interface SearchResult {
  score: number;
  content: string;
  document_id: string;
  chunk_index: number;
  metadata: {
    title: string;
    course_id: number;
  };
}

export default function InstructorAIWorkflow() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [contentGenerations, setContentGenerations] = useState<ContentGeneration[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Document upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');

  // Content generation state
  const [contentType, setContentType] = useState<string>('learning_material');
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [useRAG, setUseRAG] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load documents when course changes
  useEffect(() => {
    if (selectedCourse) {
      loadCourseDocuments(selectedCourse);
      loadContentGenerations(selectedCourse);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${api.baseUrl}/api/courses/my-courses`, {
        headers: getAuthHeadersForm()
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        setError('Failed to load courses');
      }
    } catch (err) {
      setError('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseDocuments = async (courseId: number) => {
    try {
      const response = await fetch(api.instructorAI.getCourseDocuments(courseId), {
        headers: getAuthHeadersForm()
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      } else {
        setError('Failed to load course documents');
      }
    } catch (err) {
      setError('Error loading course documents');
    }
  };

  const loadContentGenerations = async (courseId: number) => {
    try {
      const response = await fetch(api.instructorAI.getContentGenerations(courseId), {
        headers: getAuthHeadersForm()
      });
      if (response.ok) {
        const data = await response.json();
        setContentGenerations(data);
      } else {
        setError('Failed to load content generations');
      }
    } catch (err) {
      setError('Error loading content generations');
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !uploadFile) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('course_id', selectedCourse.toString());
      formData.append('title', documentTitle);
      formData.append('description', documentDescription);
      formData.append('file', uploadFile);

      const response = await fetch(api.instructorAI.uploadDocument, {
        method: 'POST',
        headers: getAuthHeadersForm(),
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Document uploaded and processed successfully');
        setDocumentTitle('');
        setDocumentDescription('');
        setUploadFile(null);
        loadCourseDocuments(selectedCourse);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to upload document');
      }
    } catch (err) {
      setError('Error uploading document');
    } finally {
      setLoading(false);
    }
  };

  const handleContentGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted!', { selectedCourse, contentType, contentTitle, contentDescription });
    
    if (!selectedCourse) {
      console.log('❌ No course selected');
      setError('Please select a course');
      return;
    }

    if (!contentTitle.trim() || !contentDescription.trim()) {
      console.log('❌ Missing required fields');
      setError('Please fill in title and description');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('course_id', selectedCourse.toString());
      formData.append('content_type', contentType);
      formData.append('title', contentTitle);
      formData.append('description', contentDescription);
      formData.append('additional_instructions', additionalInstructions);
      formData.append('use_rag', useRAG.toString());

      console.log('📤 Sending request to:', api.instructorAI.generateContent);
      console.log('📤 Form data:', Object.fromEntries(formData.entries()));

      const response = await fetch(api.instructorAI.generateContent, {
        method: 'POST',
        headers: getAuthHeadersForm(),
        body: formData,
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Content generated successfully:', data);
        setSuccess('Content generated successfully');
        setContentTitle('');
        setContentDescription('');
        setAdditionalInstructions('');
        loadContentGenerations(selectedCourse);
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          setError(errorData.detail || 'Failed to generate content');
        } catch {
          setError(`Failed to generate content: ${response.status} ${response.statusText}`);
        }
      }
    } catch (err) {
      console.log('❌ Exception during generation:', err);
      setError(`Error generating content: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!selectedCourse || !searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const response = await fetch(
        api.instructorAI.searchContent(selectedCourse, searchQuery, 5),
        {
          headers: getAuthHeadersForm()
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      } else {
        setError('Search failed');
      }
    } catch (err) {
      setError('Error searching content');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleApproveContent = async (generationId: number) => {
    try {
      const response = await fetch(api.instructorAI.approveContent(generationId), {
        method: 'POST',
        headers: getAuthHeadersForm()
      });

      if (response.ok) {
        setSuccess('Content approved successfully');
        loadContentGenerations(selectedCourse!);
      } else {
        setError('Failed to approve content');
      }
    } catch (err) {
      setError('Error approving content');
    }
  };

  const handleRejectContent = async (generationId: number) => {
    try {
      const response = await fetch(api.instructorAI.rejectContent(generationId), {
        method: 'DELETE',
        headers: getAuthHeadersForm()
      });

      if (response.ok) {
        setSuccess('Content rejected successfully');
        loadContentGenerations(selectedCourse!);
      } else {
        setError('Failed to reject content');
      }
    } catch (err) {
      setError('Error rejecting content');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Content Workflow</h1>
          <p className="text-muted-foreground">
            Upload documents, generate content, and manage AI-powered educational materials
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="review">Review Content</TabsTrigger>
          <TabsTrigger value="search">Search Content</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Course Documents
              </CardTitle>
              <CardDescription>
                Upload PDF documents to be processed by the AI system for content generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDocumentUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-select">Select Course</Label>
                  <Select
                    value={selectedCourse?.toString() || ''}
                    onValueChange={(value) => setSelectedCourse(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-title">Document Title</Label>
                  <Input
                    id="document-title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="e.g., Construction Safety Manual"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document-description">Description</Label>
                  <Textarea
                    id="document-description"
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    placeholder="Brief description of the document content"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.txt,.doc,.docx"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading || !selectedCourse || !uploadFile}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedCourse && documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Course Documents</CardTitle>
                <CardDescription>
                  Documents uploaded for this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <h4 className="font-medium">{doc.title}</h4>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{doc.content_type.toUpperCase()}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(doc.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.is_processed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Processed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Generate AI Content
              </CardTitle>
              <CardDescription>
                Create learning materials, lesson plans, and knowledge tests using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContentGeneration} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-course-select">Select Course</Label>
                  <Select
                    value={selectedCourse?.toString() || ''}
                    onValueChange={(value) => setSelectedCourse(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learning_material">Learning Material</SelectItem>
                      <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                      <SelectItem value="knowledge_test">Knowledge Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-title">Title</Label>
                  <Input
                    id="content-title"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="e.g., Construction Safety Fundamentals"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content-description">Description</Label>
                  <Textarea
                    id="content-description"
                    value={contentDescription}
                    onChange={(e) => setContentDescription(e.target.value)}
                    placeholder="Describe what you want to generate"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional-instructions">Additional Instructions</Label>
                  <Textarea
                    id="additional-instructions"
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="e.g., Focus on UK construction standards, include practical examples"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="use-rag"
                    checked={useRAG}
                    onChange={(e) => setUseRAG(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="use-rag">Use uploaded documents for context (RAG)</Label>
                </div>

                <Button type="submit" disabled={loading || !selectedCourse}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Generate Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Review Generated Content
              </CardTitle>
              <CardDescription>
                Review, approve, or reject AI-generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCourse ? (
                <div className="space-y-4">
                  {contentGenerations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No generated content found for this course
                    </p>
                  ) : (
                    contentGenerations.map((generation) => (
                      <div key={generation.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{generation.content_type.replace('_', ' ')}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(generation.created_at)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Model: {generation.model_used}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {generation.is_approved ? (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Approved
                              </Badge>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveContent(generation.id)}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectContent(generation.id)}
                                >
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">{generation.prompt}</h4>
                          <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm">
                              {generation.generated_content}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a course to view generated content
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Course Content
              </CardTitle>
              <CardDescription>
                Search through uploaded documents and generated content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={searchLoading || !selectedCourse}>
                    {searchLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                    {searchResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Score: {result.score.toFixed(3)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {result.metadata.title}
                          </span>
                        </div>
                        <p className="text-sm">{result.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
