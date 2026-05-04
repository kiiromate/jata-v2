import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Clock, HelpCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitContact, type ContactFormData } from '@/services/contactService';

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.subject.trim().length < 2) {
      newErrors.subject = 'Subject must be at least 2 characters';
    }

    if (formData.message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContact(formData as ContactFormData);
      
      // Show success message
      toast({
        title: 'Message Sent Successfully!',
        description: 'We\'ve received your message and will get back to you within 72 hours.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: '',
      });
    } catch (error) {
      // Show error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to send message. Please try again later.';
      
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof ContactFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg max-w-5xl">
      <div className="mb-lg">
        <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          Have a question or need help? We're here for you.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-md">
        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-sm">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger
                      id="category"
                      className={errors.category ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="sales">Sales Inquiry</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category}</p>
                  )}
                </div>

                {/* Subject Field */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    Subject <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your inquiry"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={errors.subject ? 'border-destructive' : ''}
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us more about your inquiry..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className={errors.message ? 'border-destructive' : ''}
                    rows={6}
                  />
                  <div className="flex justify-between items-center">
                    {errors.message ? (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {formData.message.length} / 2000 characters
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information Sidebar */}
        <div className="space-y-sm">
          {/* Direct Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                Email Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Prefer email? Reach us directly at:
              </p>
              <a
                href="mailto:support@jata.app"
                className="text-sm font-medium text-primary hover:underline"
              >
                support@jata.app
              </a>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We typically respond within <span className="font-medium text-foreground">72 hours</span> during business days.
              </p>
            </CardContent>
          </Card>

          {/* Self-Service Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/faq">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Browse FAQ
                  </a>
                </Button>
              </div>
              <div>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/docs" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
