"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Save, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";

interface HomePageSection {
  id: string;
  type: 'hero' | 'features' | 'about' | 'cta' | 'bestseller' | 'testimonials' | 'stats' | 'custom';
  title: string;
  content: string;
  image?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  order: number;
}

interface HomePageContent {
  meta_title: string;
  meta_description: string;
  sections: HomePageSection[];
}

export function HomepageEditor() {
  const [content, setContent] = useState<HomePageContent>({
    meta_title: "",
    meta_description: "",
    sections: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to safely render content (handles both plain text and JSON)
  const renderContent = (contentString: string) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(contentString);
      return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <RenderDescription json={parsed} />
        </div>
      );
    } catch {
      // If parsing fails, treat as plain text
      return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {contentString.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      );
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    console.log("🏠 HomepageEditor: Fetching content...");
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/homepage');
      console.log("📡 Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("📊 Received data:", data);
        
        // Ensure sections is always an array and convert plain text content to JSON
        const fetchedContent = data.content || {};
        const convertContentToJSON = (content: string) => {
          if (!content) return JSON.stringify({
            type: 'doc',
            content: [{
              type: 'paragraph',
              content: [{
                type: 'text',
                text: ''
              }]
            }]
          });
          
          try {
            // Test if it's already valid JSON
            JSON.parse(content);
            return content;
          } catch {
            // Convert plain text to JSON format
            return JSON.stringify({
              type: 'doc',
              content: [{
                type: 'paragraph',
                content: [{
                  type: 'text',
                  text: content
                }]
              }]
            });
          }
        };

        const sections = Array.isArray(fetchedContent.sections) 
          ? fetchedContent.sections.map((section: HomePageSection) => ({
              ...section,
              content: convertContentToJSON(section.content)
            }))
          : [];

        const newContent = {
          meta_title: fetchedContent.meta_title || "",
          meta_description: fetchedContent.meta_description || "",
          sections,
        };
        
        console.log("✅ Setting content:", newContent);
        setContent(newContent);
      } else {
        const errorData = await response.text();
        console.log("❌ Error response:", errorData);
        toast.error("Failed to load homepage content");
      }
    } catch (error) {
      console.error("💥 Error fetching homepage content:", error);
      toast.error("Failed to load homepage content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      console.log("🚀 Submitting homepage content:", content);
      const response = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      console.log("📡 Response status:", response.status);
      
      if (response.ok) {
        toast.success("Homepage content updated successfully!");
      } else {
        const result = await response.json();
        console.error("❌ API Error:", result);
        toast.error(result.error || "Failed to update homepage content");
      }
    } catch (error) {
      console.error("💥 Network/Parse Error:", error);
      toast.error("An error occurred while updating content");
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = () => {
    const sections = content.sections || [];
    const newSection: HomePageSection = {
      id: `section_${Date.now()}`,
      type: 'custom',
      title: '',
      content: JSON.stringify({
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: 'Enter your content here...'
          }]
        }]
      }),
      order: sections.length,
    };
    setContent({
      ...content,
      sections: [...sections, newSection],
    });
  };

  const loadTemplate = () => {
    const templateSections: HomePageSection[] = [
      {
        id: 'hero_template',
        type: 'hero',
        title: 'Transform Your Future with Expert-Led Courses',
        content: JSON.stringify({
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Join thousands of learners who have advanced their careers with our comprehensive, industry-relevant courses taught by world-class instructors.'
            }]
          }]
        }),
        image: '/placeholder-course.jpg',
        buttonText: 'Start Learning Today',
        buttonUrl: '/courses',
        backgroundColor: '#1e40af',
        textColor: '#ffffff',
        order: 0,
      },
      {
        id: 'stats_template',
        type: 'stats',
        title: 'Trusted by Learners Worldwide',
        content: '10,000+ Students | 100+ Courses | 98% Success Rate | 50+ Expert Instructors',
        backgroundColor: '#f8fafc',
        order: 1,
      },
      {
        id: 'bestseller_template',
        type: 'bestseller',
        title: 'Most Popular Courses',
        content: JSON.stringify({
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Discover our top-rated courses that have helped thousands of students achieve their goals.'
            }]
          }]
        }),
        order: 2,
      },
      {
        id: 'features_template',
        type: 'features',
        title: 'Why Choose Our Platform?',
        content: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Expert-led courses' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Lifetime access' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Interactive assignments' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Certificate of completion' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '24/7 community support' }] }] },
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mobile learning app' }] }] }
              ]
            }
          ]
        }),
        backgroundColor: '#ffffff',
        order: 3,
      },
      {
        id: 'testimonials_template',
        type: 'testimonials',
        title: 'What Our Students Say',
        content: 'This platform completely changed my career trajectory. The courses are incredibly detailed and practical! - Sarah Johnson --- I landed my dream job after completing the web development course. Highly recommended! - Mike Chen --- The instructors are amazing and the community is so supportive. Best investment I ever made! - Emma Davis',
        order: 4,
      },
      {
        id: 'cta_template',
        type: 'cta',
        title: 'Ready to Start Your Learning Journey?',
        content: JSON.stringify({
          type: 'doc',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: 'Join our community of successful learners and take the first step towards achieving your goals. Start with a free trial today!'
            }]
          }]
        }),
        buttonText: 'Get Started Free',
        buttonUrl: '/signup',
        backgroundColor: '#059669',
        textColor: '#ffffff',
        order: 5,
      },
    ];

    setContent({
      ...content,
      sections: templateSections,
    });
    toast.success("Template loaded! You can now customize each section.");
  };

  const updateSection = (id: string, updates: Partial<HomePageSection>) => {
    const sections = content.sections || [];
    setContent({
      ...content,
      sections: sections.map(section =>
        section.id === id ? { ...section, ...updates } : section
      ),
    });
  };

  const deleteSection = (id: string) => {
    const sections = content.sections || [];
    setContent({
      ...content,
      sections: sections.filter(section => section.id !== id),
    });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const sections = [...(content.sections || [])];
    const index = sections.findIndex(s => s.id === id);
    
    if (direction === 'up' && index > 0) {
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
    } else if (direction === 'down' && index < sections.length - 1) {
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    }

    // Update order values
    sections.forEach((section, idx) => {
      section.order = idx;
    });

    setContent({ ...content, sections });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading homepage content...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Homepage Editor
        </CardTitle>
        <CardDescription>
          Customize your homepage content and layout
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meta" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meta">SEO & Meta</TabsTrigger>
            <TabsTrigger value="sections">Content Sections</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="space-y-4">
            <div>
              <Label htmlFor="meta_title">Page Title</Label>
              <Input
                id="meta_title"
                value={content.meta_title}
                onChange={(e) => setContent({ ...content, meta_title: e.target.value })}
                placeholder="Welcome to our platform"
              />
            </div>
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea
                id="meta_description"
                value={content.meta_description}
                onChange={(e) => setContent({ ...content, meta_description: e.target.value })}
                placeholder="Learn, grow, and succeed with our comprehensive learning management system"
                className="min-h-[80px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Content Sections</h3>
              <div className="flex gap-2">
                <Button onClick={loadTemplate} variant="outline" size="sm">
                  Load Template
                </Button>
                <Button onClick={addSection} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {(content.sections || []).map((section, index) => (
                <Card key={section.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Section {index + 1}</span>
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(section.id, { 
                          type: e.target.value as HomePageSection['type'] 
                        })}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="hero">Hero Section</option>
                        <option value="features">Features</option>
                        <option value="about">About</option>
                        <option value="bestseller">Best Seller Courses</option>
                        <option value="testimonials">Testimonials</option>
                        <option value="stats">Statistics</option>
                        <option value="cta">Call to Action</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={index === (content.sections || []).length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSection(section.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section title"
                      />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <RichTextEditor 
                        field={{
                          value: section.content,
                          onChange: (value: string) => updateSection(section.id, { content: value })
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>
                          {section.type === 'hero' ? 'Image URL' : 'Icon/Emoji'}
                        </Label>
                        <Input
                          value={section.image || ''}
                          onChange={(e) => updateSection(section.id, { image: e.target.value })}
                          placeholder={
                            section.type === 'hero' 
                              ? "/images/hero-image.jpg" 
                              : "📚 (Enter emoji or image URL)"
                          }
                        />
                      </div>
                      <div>
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={section.backgroundColor || '#ffffff'}
                            onChange={(e) => updateSection(section.id, { backgroundColor: e.target.value })}
                            className="w-16 h-10 p-1"
                          />
                          <Input
                            value={section.backgroundColor || ''}
                            onChange={(e) => updateSection(section.id, { backgroundColor: e.target.value })}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {(section.type === 'hero' || section.type === 'cta') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Button Text</Label>
                          <Input
                            value={section.buttonText || ''}
                            onChange={(e) => updateSection(section.id, { buttonText: e.target.value })}
                            placeholder="Get Started"
                          />
                        </div>
                        <div>
                          <Label>Button URL</Label>
                          <Input
                            value={section.buttonUrl || ''}
                            onChange={(e) => updateSection(section.id, { buttonUrl: e.target.value })}
                            placeholder="/courses"
                          />
                        </div>
                      </div>
                    )}

                    {section.type === 'bestseller' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Best Seller Section:</strong> This will automatically display your top-performing courses based on enrollments and ratings.
                        </p>
                      </div>
                    )}

                    {section.type === 'stats' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <strong>Statistics Section:</strong> Use content like "1000+ Students | 50+ Courses | 95% Success Rate" - separated by |
                        </p>
                      </div>
                    )}

                    {section.type === 'testimonials' && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                        <p className="text-sm text-purple-800">
                          <strong>Testimonials Section:</strong> Add customer testimonials separated by triple dashes (---) like: "Great course! - John Doe --- Amazing experience! - Jane Smith"
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {(content.sections || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No sections added yet. Click "Add Section" to get started.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="mb-4">
                <h1 className="text-3xl font-bold mb-2">{content.meta_title || 'Homepage Title'}</h1>
                <p className="text-gray-600">{content.meta_description || 'Homepage description'}</p>
              </div>

              {(content.sections || [])
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div 
                    key={section.id} 
                    className="mb-6 p-6 border rounded-lg"
                    style={{ 
                      backgroundColor: section.backgroundColor || '#ffffff',
                      color: section.textColor || '#000000'
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wide bg-white px-2 py-1 rounded">
                        {section.type} Section
                      </span>
                    </div>
                    
                    {section.type === 'hero' && (
                      <div className="text-center">
                        {section.title && (
                          <h1 className="text-4xl font-bold mb-4">{section.title}</h1>
                        )}
                        {section.content && (
                          <div className="text-xl mb-6 max-w-2xl mx-auto">
                            {renderContent(section.content)}
                          </div>
                        )}
                        {section.image && (
                          <img 
                            src={section.image} 
                            alt={section.title}
                            className="w-full max-w-md mx-auto h-64 object-cover rounded-lg mb-6"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        )}
                        {section.buttonText && (
                          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700">
                            {section.buttonText}
                          </button>
                        )}
                      </div>
                    )}

                    {section.type === 'bestseller' && (
                      <div>
                        {section.title && (
                          <h2 className="text-3xl font-bold text-center mb-8">{section.title}</h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border rounded-lg p-4 shadow-sm">
                              <div className="bg-gray-200 h-40 rounded mb-4"></div>
                              <h3 className="font-semibold text-gray-800">Best Seller Course {i}</h3>
                              <p className="text-gray-600 text-sm mt-1">⭐⭐⭐⭐⭐ (4.9) • 1,234 students</p>
                              <p className="font-bold text-green-600 mt-2">99 LYD</p>
                            </div>
                          ))}
                        </div>
                        {section.content && (
                          <div className="text-center mt-6 text-gray-600">
                            {renderContent(section.content)}
                          </div>
                        )}
                      </div>
                    )}

                    {section.type === 'stats' && (
                      <div className="text-center">
                        {section.title && (
                          <h2 className="text-3xl font-bold mb-8">{section.title}</h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {section.content?.split('|').map((stat, idx) => (
                            <div key={idx} className="text-center">
                              <div className="text-4xl font-bold text-blue-600 mb-2">
                                {stat.trim().split(' ')[0]}
                              </div>
                              <div className="text-gray-600">
                                {stat.trim().split(' ').slice(1).join(' ')}
                              </div>
                            </div>
                          )) || (
                            <div className="col-span-3 text-gray-500">
                              Add statistics separated by | (e.g., "1000+ Students | 50+ Courses | 95% Success Rate")
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {section.type === 'testimonials' && (
                      <div>
                        {section.title && (
                          <h2 className="text-3xl font-bold text-center mb-8">{section.title}</h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {section.content?.split('---').map((testimonial, idx) => {
                            const [quote, author] = testimonial.split(' - ');
                            return (
                              <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border">
                                <p className="text-gray-700 mb-4 italic">"{quote?.trim()}"</p>
                                <p className="font-semibold text-gray-800">- {author?.trim()}</p>
                              </div>
                            );
                          }) || (
                            <div className="col-span-2 text-gray-500 text-center">
                              Add testimonials separated by --- (e.g., "Great course! - John Doe --- Amazing! - Jane")
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(section.type === 'features' || section.type === 'about' || section.type === 'custom') && (
                      <div>
                        {section.title && (
                          <h2 className="text-3xl font-bold mb-6">{section.title}</h2>
                        )}
                        {section.image && (
                          <div className="mb-6">
                            {section.image.startsWith('http') || section.image.startsWith('/') ? (
                              <img 
                                src={section.image} 
                                alt={section.title}
                                className="w-full h-64 object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="text-6xl text-center">{section.image}</div>
                            )}
                          </div>
                        )}
                        {section.content && renderContent(section.content)}
                      </div>
                    )}

                    {section.type === 'cta' && (
                      <div className="text-center py-8">
                        {section.title && (
                          <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
                        )}
                        {section.content && (
                          <div className="text-lg mb-6 max-w-2xl mx-auto">
                            {renderContent(section.content)}
                          </div>
                        )}
                        {section.buttonText && (
                          <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-green-700">
                            {section.buttonText}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {(content.sections || []).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Preview will appear here once you add sections
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Content
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchContent}>
            <Eye className="w-4 h-4 mr-2" />
            Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
