'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BusinessCard } from '@/lib/types';
import { Mail, Phone, Globe, MapPin, MoreVertical, Edit, Trash, Download, Share2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface BusinessCardsListProps {
  cards: BusinessCard[];
}

export default function BusinessCardsList({ cards }: BusinessCardsListProps) {
  const [selectedCard, setSelectedCard] = useState<BusinessCard | null>(null);
  const [filter, setFilter] = useState<'all' | 'processed' | 'pending' | 'failed'>('all');
  
  const filteredCards = filter === 'all' 
    ? cards 
    : cards.filter(card => card.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'processed':
        return 'Processed';
      case 'pending':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">名刺一覧</h1>
          <p className="text-muted-foreground">名刺コレクションを管理</p>
        </div>
        
        <div className="flex flex-wrap gap-1 md:gap-2">
          <Button variant={filter === 'all' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            すべて
          </Button>
          <Button variant={filter === 'processed' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('processed')}>
            Processed
          </Button>
          <Button variant={filter === 'pending' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('pending')}>
            Processing
          </Button>
          <Button variant={filter === 'failed' ? 'secondary' : 'outline'} size="sm" onClick={() => setFilter('failed')}>
            Failed
          </Button>
        </div>
      </div>

      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {filteredCards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
                <CardHeader className="relative p-0">
                  <div 
                    className="h-40 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${card.imageUrl})` }}
                  >
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Share</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl">{card.name}</CardTitle>
                    <Badge 
                      variant={
                        card.status === 'processed' ? 'default' : 
                        card.status === 'pending' ? 'outline' : 'destructive'
                      }
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(card.status)}
                      <span>{getStatusText(card.status)}</span>
                    </Badge>
                  </div>
                  <CardDescription className="text-sm mb-4">{card.title} at {card.company}</CardDescription>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{card.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{card.phone}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 mt-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setSelectedCard(card)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Business Card Details</DialogTitle>
                      </DialogHeader>
                      {selectedCard && (
                        <Tabs defaultValue="details">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="image">Card Image</TabsTrigger>
                            <TabsTrigger value="edit">Edit</TabsTrigger>
                          </TabsList>
                          <TabsContent value="details" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-muted-foreground">Name</Label>
                                    <div className="font-medium">{selectedCard.name}</div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Company</Label>
                                    <div className="font-medium">{selectedCard.company}</div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Job Title</Label>
                                    <div className="font-medium">{selectedCard.title}</div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <div className="font-medium flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      <a href={`mailto:${selectedCard.email}`} className="text-primary hover:underline">
                                        {selectedCard.email}
                                      </a>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Phone</Label>
                                    <div className="font-medium flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      <a href={`tel:${selectedCard.phone}`} className="hover:underline">
                                        {selectedCard.phone}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-muted-foreground">Website</Label>
                                    <div className="font-medium flex items-center gap-2">
                                      <Globe className="h-4 w-4" />
                                      <a href={selectedCard.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {selectedCard.website}
                                      </a>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Address</Label>
                                    <div className="font-medium flex items-start gap-2">
                                      <MapPin className="h-4 w-4 mt-1" />
                                      <span>{selectedCard.address}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Notes</Label>
                                    <div className="font-medium">
                                      {selectedCard.notes || "No notes added yet."}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Added On</Label>
                                    <div className="font-medium">
                                      {format(new Date(selectedCard.createdAt), 'PPP')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="image" className="mt-4">
                            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                              <img 
                                src={selectedCard.imageUrl} 
                                alt={`${selectedCard.name}'s business card`} 
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </TabsContent>
                          <TabsContent value="edit" className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="name">Name</Label>
                                  <Input id="name" defaultValue={selectedCard.name} />
                                </div>
                                <div>
                                  <Label htmlFor="company">Company</Label>
                                  <Input id="company" defaultValue={selectedCard.company} />
                                </div>
                                <div>
                                  <Label htmlFor="title">Job Title</Label>
                                  <Input id="title" defaultValue={selectedCard.title} />
                                </div>
                                <div>
                                  <Label htmlFor="email">Email</Label>
                                  <Input id="email" type="email" defaultValue={selectedCard.email} />
                                </div>
                                <div>
                                  <Label htmlFor="phone">Phone</Label>
                                  <Input id="phone" defaultValue={selectedCard.phone} />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="website">Website</Label>
                                  <Input id="website" defaultValue={selectedCard.website} />
                                </div>
                                <div>
                                  <Label htmlFor="address">Address</Label>
                                  <Textarea id="address" defaultValue={selectedCard.address} />
                                </div>
                                <div>
                                  <Label htmlFor="notes">Notes</Label>
                                  <Textarea id="notes" defaultValue={selectedCard.notes} />
                                </div>
                                <Button className="w-full">Save Changes</Button>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}