import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDashboardStore } from '@/store/dashboardStore';
import type { ApplicationStatus, Database } from '@jata/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface ApplicationFormData {
  title: string;
  company: string;
  url?: string;
  industry?: string;
  status: ApplicationStatus;
  source?: string;
}

type ApplicationInsert = Database['public']['Tables']['applications']['Insert'];

const getToday = () => new Date().toISOString().split('T')[0];

const STATUS_OPTIONS: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'Saved', label: 'Early Application' },
  { value: 'Applying', label: 'Starting Application' },
  { value: 'Applied', label: 'Applied' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Rejected', label: 'Rejected' },
];

const SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'capture_inbox', label: 'Capture Inbox' },
  { value: 'browser_extension', label: 'Browser Extension' },
  { value: 'pwa_share', label: 'PWA Share' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'lever', label: 'Lever' },
  { value: 'workday', label: 'Workday' },
  { value: 'wellfound', label: 'Wellfound' },
  { value: 'company_website', label: 'Company Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

const INDUSTRY_OPTIONS = [
  'Technology',
  'Software / SaaS',
  'AI / Data',
  'Fintech',
  'Health / Life Sciences',
  'Climate / Sustainability',
  'Agriculture / Food',
  'Education',
  'Consulting',
  'Nonprofit / NGO',
  'Government / Public Sector',
  'Media / Communications',
  'E-commerce / Retail',
  'Manufacturing',
  'Logistics / Supply Chain',
];

const CreateApplicationModal: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isModalOpen, closeModal } = useDashboardStore();

  const [formData, setFormData] = useState<ApplicationFormData>({
    title: '',
    company: '',
    url: '',
    industry: '',
    status: 'Saved',
    source: 'manual',
  });

  const createMutation = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      if (!user) throw new Error('User not authenticated');

      const payload: ApplicationInsert = {
        id: crypto.randomUUID(),
        user_id: user.id,
        title: data.title.trim(),
        company: data.company.trim(),
        status: data.status,
        date_applied: getToday(),
        url: data.url?.trim() || null,
        industry: data.industry?.trim() || null,
        source: data.source?.trim() || 'manual',
      };

      const { data: result, error } = await supabase
        .from('applications')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['recentActivity'] });
      toast({
        title: 'Application created',
        description: 'Your job application has been added successfully.',
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create application',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setFormData({
      title: '',
      company: '',
      url: '',
      industry: '',
      status: 'Saved',
      source: 'manual',
    });
    closeModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.company.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in job title and company name.',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleChange = <K extends keyof ApplicationFormData>(field: K, value: ApplicationFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Application</DialogTitle>
          <DialogDescription className="text-base">
            Track a new job opportunity. Required fields are marked with <span className="text-red-500">*</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Software Engineer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Google"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Job URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://example.com/job"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value as ApplicationStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(value) => handleChange('source', value)}
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              list="application-industry-options"
              value={formData.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              placeholder="Technology"
            />
            <datalist id="application-industry-options">
              {INDUSTRY_OPTIONS.map((industry) => (
                <option key={industry} value={industry} />
              ))}
            </datalist>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateApplicationModal;
