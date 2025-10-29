import { useState, useMemo, useRef, useEffect } from 'react';
import { faqData, faqCategories, FAQItem } from '@/data/faqData';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FAQItemProps {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  onFeedback: (helpful: boolean) => void;
}

const FAQItemComponent = ({ item, isOpen, onToggle, onFeedback }: FAQItemProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Smooth scroll to the question when expanded
      contentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={contentRef}
      className="border rounded-lg overflow-hidden transition-all duration-200"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="border-t bg-card">
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.answer}
            </p>
            <div className="flex items-center gap-3 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Was this helpful?</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFeedback(true)}
                  className="gap-1"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onFeedback(false)}
                  className="gap-1"
                >
                  <ThumbsDown className="h-4 w-4" />
                  No
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fuzzy search implementation
  const filteredFAQs = useMemo(() => {
    let filtered = faqData;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const questionMatch = item.question.toLowerCase().includes(query);
        const answerMatch = item.answer.toLowerCase().includes(query);
        const tagsMatch = item.tags.some((tag) => tag.toLowerCase().includes(query));
        return questionMatch || answerMatch || tagsMatch;
      });
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const handleToggle = (id: string) => {
    setOpenItemId(openItemId === id ? null : id);
  };

  const handleFeedback = (itemId: string, helpful: boolean) => {
    // In a real implementation, this would send feedback to the backend
    toast({
      title: 'Thank you for your feedback!',
      description: helpful
        ? 'We\'re glad this answer was helpful.'
        : 'We\'ll work on improving this answer.',
    });
  };

  // Group FAQs by category for display
  const faqsByCategory = useMemo(() => {
    const grouped: Record<string, FAQItem[]> = {};
    filteredFAQs.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  }, [filteredFAQs]);

  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg max-w-5xl">
      <div className="mb-lg">
        <h1 className="text-4xl font-bold mb-3">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about JATA
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-md">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-3">
              Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="mb-md"
      >
        <TabsList className="w-full flex-wrap h-auto justify-start gap-2 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All
          </TabsTrigger>
          {faqCategories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-md">
          {filteredFAQs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No questions found matching your search.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          ) : selectedCategory === 'all' ? (
            // Show grouped by category when "All" is selected
            <div className="space-y-lg">
              {Object.entries(faqsByCategory).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-2xl font-semibold mb-sm">{category}</h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <FAQItemComponent
                        key={item.id}
                        item={item}
                        isOpen={openItemId === item.id}
                        onToggle={() => handleToggle(item.id)}
                        onFeedback={(helpful) => handleFeedback(item.id, helpful)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show flat list when a specific category is selected
            <div className="space-y-3">
              {filteredFAQs.map((item) => (
                <FAQItemComponent
                  key={item.id}
                  item={item}
                  isOpen={openItemId === item.id}
                  onToggle={() => handleToggle(item.id)}
                  onFeedback={(helpful) => handleFeedback(item.id, helpful)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="mt-lg">
        <CardHeader>
          <CardTitle>Still have questions?</CardTitle>
          <CardDescription>
            Can't find what you're looking for? We're here to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <a href="/contact">Contact Support</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@jata.app">Email Us</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQPage;
