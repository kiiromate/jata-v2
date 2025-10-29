import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  generateCoverLetter,
  formatCoverLetterForExport,
  type CoverLetterParams,
} from '@/services/coverLetterService';
import { generateCoverLetterFileName } from '@/utils/fileNaming';
import { Skeleton } from '@/components/ui/skeleton';

const CoverLetterPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Form state
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [highlights, setHighlights] = useState(['', '', '']);
  const [tone, setTone] = useState<'professional' | 'conversational' | 'formal'>('professional');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Generated cover letter
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const params: CoverLetterParams = {
        jobTitle,
        companyName,
        jobDescription: jobDescription || undefined,
        userName,
        userEmail: userEmail || undefined,
        highlights: highlights.filter((h) => h.trim() !== ''),
        tone,
      };

      const result = await generateCoverLetter(params);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate cover letter');
      }

      return { result, params };
    },
    onSuccess: ({ result, params }) => {
      const formatted = formatCoverLetterForExport(result, params);
      setGeneratedLetter(formatted);
      toast({
        title: 'Cover letter generated',
        description: 'Your cover letter is ready. Review and export below.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!jobTitle.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter the job title.',
        variant: 'destructive',
      });
      return;
    }

    if (!companyName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter the company name.',
        variant: 'destructive',
      });
      return;
    }

    if (!userName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter your name.',
        variant: 'destructive',
      });
      return;
    }

    const validHighlights = highlights.filter((h) => h.trim() !== '');
    if (validHighlights.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please add at least one highlight about your experience.',
        variant: 'destructive',
      });
      return;
    }

    generateMutation.mutate();
  };

  const handleDownload = () => {
    if (!generatedLetter) return;

    const filename = generateCoverLetterFileName(
      userName.split(' ')[0],
      userName.split(' ')[1],
      companyName,
      jobTitle,
      'txt'
    );

    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `Cover letter saved as ${filename}`,
    });
  };

  const handleCopy = () => {
    if (!generatedLetter) return;

    navigator.clipboard.writeText(generatedLetter);
    toast({
      title: 'Copied',
      description: 'Cover letter copied to clipboard.',
    });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...highlights];
    newHighlights[index] = value;
    setHighlights(newHighlights);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-gray-600">Please log in to generate cover letters.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Cover Letter Generator</h1>
        <p className="text-gray-600">Create professional, tailored cover letters for your applications.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Tell us about the role you're applying for.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <Label htmlFor="userName">Your Name *</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="userEmail">Your Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Software Engineer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Google"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jobDescription">Job Description (optional)</Label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Key Highlights (3 max) *</Label>
                <p className="text-sm text-gray-600 mb-2">
                  List your relevant achievements or skills for this role.
                </p>
                {highlights.map((highlight, index) => (
                  <Input
                    key={index}
                    value={highlight}
                    onChange={(e) => updateHighlight(index, e.target.value)}
                    placeholder={`Highlight ${index + 1}`}
                    className="mb-2"
                  />
                ))}
              </div>

              <div>
                <Label htmlFor="tone">Tone</Label>
                <Select value={tone} onValueChange={(value: any) => setTone(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="conversational">Conversational</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={generateMutation.isPending} className="w-full">
                {generateMutation.isPending ? 'Generating...' : 'Generate Cover Letter'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              {generatedLetter ? 'Your generated cover letter.' : 'Fill in the form to generate a cover letter.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedLetter ? (
              <div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">{generatedLetter}</pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} variant="default">
                    Download as TXT
                  </Button>
                  <Button onClick={handleCopy} variant="outline">
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No cover letter generated yet.</p>
                <p className="text-sm mt-2">Complete the form and click "Generate Cover Letter" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoverLetterPage;
