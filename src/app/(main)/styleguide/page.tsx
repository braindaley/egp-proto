'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Info, CheckCircle, XCircle, Palette, Type, Layout, FileText } from 'lucide-react';
import { BillProgress } from '@/components/BillProgress';
import { BillVote } from '@/components/BillVote';

export default function StyleGuidePage() {
  const [selectedTab, setSelectedTab] = useState('typography');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">
              Style Guide
            </h1>
            <p className="text-xl text-muted-foreground">
              Visual reference for typography, components, and design patterns
            </p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="typography" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Typography
              </TabsTrigger>
              <TabsTrigger value="components" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Components
              </TabsTrigger>
              <TabsTrigger value="bill-components" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bill Components
              </TabsTrigger>
              <TabsTrigger value="colors" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Colors
              </TabsTrigger>
            </TabsList>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-8">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Headings</CardTitle>
                    <CardDescription>Font family: Poppins (headline), PT Sans (body)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <code className="text-sm text-muted-foreground mb-2 block">font-headline text-5xl font-bold</code>
                        <h1 className="font-headline text-5xl font-bold text-primary">Heading 1 - Main Page Title</h1>
                      </div>
                      <div>
                        <code className="text-sm text-muted-foreground mb-2 block">font-headline text-4xl font-bold</code>
                        <h2 className="font-headline text-4xl font-bold text-primary">Heading 2 - Section Title</h2>
                      </div>
                      <div>
                        <code className="text-sm text-muted-foreground mb-2 block">font-headline text-3xl font-semibold</code>
                        <h3 className="font-headline text-3xl font-semibold text-primary">Heading 3 - Subsection</h3>
                      </div>
                      <div>
                        <code className="text-sm text-muted-foreground mb-2 block">font-headline text-2xl font-semibold</code>
                        <h4 className="font-headline text-2xl font-semibold text-foreground">Heading 4 - Component Title</h4>
                      </div>
                      <div>
                        <code className="text-sm text-muted-foreground mb-2 block">font-headline text-xl font-medium</code>
                        <h5 className="font-headline text-xl font-medium text-foreground">Heading 5 - Card Title</h5>
                      </div>
                      <div>
                        <code className="text-sm text-muted-foreground mb-2 block">font-headline text-lg font-medium</code>
                        <h6 className="font-headline text-lg font-medium text-foreground">Heading 6 - Small Title</h6>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Body Text</CardTitle>
                    <CardDescription>Various text styles used throughout the application</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">text-xl font-body</code>
                      <p className="text-xl font-body text-foreground">Large body text - Used for important descriptions and introductory content.</p>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">text-lg font-body</code>
                      <p className="text-lg font-body text-foreground">Medium body text - Standard content size for most text blocks.</p>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">text-base font-body</code>
                      <p className="text-base font-body text-foreground">Regular body text - Default paragraph text used throughout the site.</p>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">text-sm font-body text-muted-foreground</code>
                      <p className="text-sm font-body text-muted-foreground">Small muted text - Helper text, captions, and secondary information.</p>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">text-xs font-body text-muted-foreground</code>
                      <p className="text-xs font-body text-muted-foreground">Extra small text - Fine print, timestamps, and minimal details.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Text Variants</CardTitle>
                    <CardDescription>Specialized text styles and variants</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">font-semibold text-primary</code>
                      <p className="font-semibold text-primary">Primary emphasized text - Important labels and key information.</p>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">font-medium text-destructive</code>
                      <p className="font-medium text-destructive">Error or warning text - Used for alerts and error messages.</p>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">font-code text-sm bg-muted px-2 py-1 rounded</code>
                      <code className="font-code text-sm bg-muted px-2 py-1 rounded">Inline code text</code>
                    </div>
                    <div>
                      <code className="text-sm text-muted-foreground mb-2 block">underline hover:text-primary</code>
                      <a href="#" className="underline hover:text-primary">Link text with hover effect</a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-8">
              <div className="grid gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                    <CardDescription>Various button styles and states</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      <Button>Primary Button</Button>
                      <Button variant="secondary">Secondary Button</Button>
                      <Button variant="outline">Outline Button</Button>
                      <Button variant="ghost">Ghost Button</Button>
                      <Button variant="destructive">Destructive Button</Button>
                      <Button disabled>Disabled Button</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                    <CardDescription>Input fields, selects, and form controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sample-input">Text Input</Label>
                        <Input id="sample-input" placeholder="Enter text..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sample-select">Select</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose option..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="option1">Option 1</SelectItem>
                            <SelectItem value="option2">Option 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sample-textarea">Textarea</Label>
                      <Textarea id="sample-textarea" placeholder="Enter longer text..." rows={3} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="sample-checkbox" />
                      <Label htmlFor="sample-checkbox">Checkbox option</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="sample-switch" />
                      <Label htmlFor="sample-switch">Switch toggle</Label>
                    </div>
                    <RadioGroup defaultValue="option1" className="flex gap-6">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option1" id="r1" />
                        <Label htmlFor="r1">Option 1</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option2" id="r2" />
                        <Label htmlFor="r2">Option 2</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Badges & Pills</CardTitle>
                    <CardDescription>Status indicators and labels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      <Badge>Default Badge</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alerts</CardTitle>
                    <CardDescription>Information, warning, and error messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Information</AlertTitle>
                      <AlertDescription>This is an informational alert message.</AlertDescription>
                    </Alert>
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>This is an error alert message.</AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Progress & Loading</CardTitle>
                    <CardDescription>Progress bars and loading states</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Progress Bar (60%)</Label>
                      <Progress value={60} className="mt-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">Loading spinner</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cards</CardTitle>
                    <CardDescription>Content containers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Sample Card</CardTitle>
                          <CardDescription>This is a sample card with content</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Card content goes here...</p>
                        </CardContent>
                      </Card>
                      <Card className="border-dashed">
                        <CardContent className="flex items-center justify-center py-8">
                          <p className="text-muted-foreground">Dashed border card</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Bill Components Tab */}
            <TabsContent value="bill-components" className="space-y-8">
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Bill Progress Component</CardTitle>
                    <CardDescription>
                      Visual indicator showing a bill's progress through the legislative process using dots.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Introduced</h4>
                        <BillProgress stage="introduced" />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Passed House</h4>
                        <BillProgress stage="passed-house" />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Passed Senate</h4>
                        <BillProgress stage="passed-senate" />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">To Sign</h4>
                        <BillProgress stage="to-sign" />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Signed</h4>
                        <BillProgress stage="signed" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage Example</CardTitle>
                    <CardDescription>How to implement the BillProgress component in your code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        <code>{`import { BillProgress } from '@/components/BillProgress';

// In your component
<BillProgress stage="introduced" />
<BillProgress stage="passed-house" />
<BillProgress stage="passed-senate" />
<BillProgress stage="to-sign" />
<BillProgress stage="signed" />

// With custom styling
<BillProgress stage="passed-house" className="my-4" />`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bill Vote Component</CardTitle>
                    <CardDescription>
                      Visual indicator showing support/opposition percentages with thumbs up/down icons.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Support (Outline)</h4>
                        <BillVote type="support" percentage={40} />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Oppose (Outline)</h4>
                        <BillVote type="oppose" percentage={60} />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Voted Support (Filled)</h4>
                        <BillVote type="voted-support" percentage={40} />
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-semibold text-sm mb-3">Voted Oppose (Filled)</h4>
                        <BillVote type="voted-oppose" percentage={60} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vote Component Usage</CardTitle>
                    <CardDescription>How to implement the BillVote component in your code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        <code>{`import { BillVote } from '@/components/BillVote';

// Support/Oppose indicators (outline icons)
<BillVote type="support" percentage={40} />
<BillVote type="oppose" percentage={60} />

// Voted indicators (filled icons)
<BillVote type="voted-support" percentage={40} />
<BillVote type="voted-oppose" percentage={60} />

// With custom styling
<BillVote type="support" percentage={75} className="my-4" />`}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                  <CardDescription>Design system colors and their usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Primary Colors */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Primary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-primary border"></div>
                          <div>
                            <div className="font-medium">Primary</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--primary))</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-primary-foreground border"></div>
                          <div>
                            <div className="font-medium">Primary Foreground</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--primary-foreground))</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Colors */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Secondary</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-secondary border"></div>
                          <div>
                            <div className="font-medium">Secondary</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--secondary))</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-secondary-foreground border"></div>
                          <div>
                            <div className="font-medium">Secondary Foreground</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--secondary-foreground))</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Background Colors */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Background</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-background border"></div>
                          <div>
                            <div className="font-medium">Background</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--background))</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-foreground border"></div>
                          <div>
                            <div className="font-medium">Foreground</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--foreground))</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Muted Colors */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Muted</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted border"></div>
                          <div>
                            <div className="font-medium">Muted</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--muted))</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-muted-foreground border"></div>
                          <div>
                            <div className="font-medium">Muted Foreground</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--muted-foreground))</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Colors */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Card</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-card border"></div>
                          <div>
                            <div className="font-medium">Card</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--card))</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-card-foreground border"></div>
                          <div>
                            <div className="font-medium">Card Foreground</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--card-foreground))</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Utility Colors */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-lg">Utility</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-destructive border"></div>
                          <div>
                            <div className="font-medium">Destructive</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--destructive))</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-border border-2 border-foreground"></div>
                          <div>
                            <div className="font-medium">Border</div>
                            <div className="text-sm text-muted-foreground">hsl(var(--border))</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}