"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, BookOpen, ClipboardList, BarChart3 } from 'lucide-react';

interface AIContentGeneratorProps {
  onContentGenerated?: (content: any) => void;
  courseId?: string;
}

export function AIContentGenerator({ onContentGenerated, courseId }: AIContentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    content_type: 'learning_material',
    title: '',
    description: '',
    additional_instructions: '',
    difficulty_level: 'intermediate',
    target_audience: ''
  });

  const contentTypes = [
    { value: 'learning_material', label: 'Learning Material', icon: BookOpen },
    { value: 'lesson_plan', label: 'Lesson Plan', icon: FileText },
    { value: 'test', label: 'Test/Assessment', icon: ClipboardList },
    { value: 'assessment', label: 'Assessment Rubric', icon: BarChart3 }
  ];

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setIsGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedContent(result.data);
        onContentGenerated?.(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Content generation error:', error);
      alert('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!generatedContent?.content) {
      alert('No content to analyze');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/analyze-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: generatedContent.content })
      });

      const result = await response.json();
      if (result.success) {
        console.log('Content analysis:', result.data);
        alert('Content analyzed! Check console for details.');
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    }
  };

  const selectedType = contentTypes.find(t => t.value === formData.content_type);
  const IconComponent = selectedType?.icon || BookOpen;

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Content Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="content_type">Content Type</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter content title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this content should cover"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="additional_instructions">Additional Instructions</Label>
            <Textarea
              id="additional_instructions"
              value={formData.additional_instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_instructions: e.target.value }))}
              placeholder="Any specific requirements or instructions"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="target_audience">Target Audience</Label>
            <Input
              id="target_audience"
              value={formData.target_audience}
              onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
              placeholder="e.g., Construction workers, Safety officers, etc."
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !formData.title.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-green-500" />
                Generated Content
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleAnalyze}>
                  Analyze
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(generatedContent.content)}>
                  Copy
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{generatedContent.type}</Badge>
                <Badge variant="outline">{generatedContent.metadata.difficulty_level}</Badge>
                <Badge variant="outline">{generatedContent.metadata.word_count} words</Badge>
                <Badge variant="outline">{generatedContent.metadata.estimated_read_time} min read</Badge>
              </div>
              
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                  {generatedContent.content}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
