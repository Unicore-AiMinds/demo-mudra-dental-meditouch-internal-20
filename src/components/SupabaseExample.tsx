import { useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

// Define a sample data type
interface SampleData {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

const SupabaseExample = () => {
  const { fetchData, insertData } = useSupabase();
  const [data, setData] = useState<SampleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Replace 'your_table_name' with the actual table name in your Supabase database
        const result = await fetchData<SampleData>('your_table_name', {
          order: { column: 'created_at', ascending: false }
        });
        setData(result);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Replace 'your_table_name' with the actual table name in your Supabase database
      const newItem = await insertData<SampleData>('your_table_name', {
        name,
        description: description.trim() || undefined,
      });
      
      // Add the new item to the data array
      setData(prev => [newItem, ...prev]);
      
      // Reset form
      setName('');
      setDescription('');
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Integration Example</CardTitle>
          <CardDescription>
            This component demonstrates fetching and adding data using Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Item'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data from Supabase</CardTitle>
          <CardDescription>
            Displaying data fetched from your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-4">
              {data.map((item) => (
                <div key={item.id} className="border rounded-md p-4">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  <p className="text-xs text-muted-foreground mt-2">
                    Added on {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No data found. Add some items to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseExample;
