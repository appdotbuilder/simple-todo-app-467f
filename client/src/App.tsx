
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CheckCircle2, Circle, Edit3, Trash2, Plus, Filter } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput, UpdateTodoInput, Priority } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');

  // Form state for creating new todos
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null,
    priority: 'medium',
    due_date: null
  });

  // Form state for editing existing todos
  const [editFormData, setEditFormData] = useState<Partial<Todo>>({});

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await trpc.createTodo.mutate({
        ...formData,
        description: formData.description || null,
        due_date: formData.due_date || null
      });
      setTodos((prev: Todo[]) => [...prev, response]);
      setFormData({
        title: '',
        description: null,
        priority: 'medium',
        due_date: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? { ...t, completed: !t.completed } : t)
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditFormData({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: todo.due_date
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const updateData: UpdateTodoInput = {
        id,
        ...editFormData
      };
      
      await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === id ? { ...t, ...editFormData } : t)
      );
      setEditingId(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTodos = todos.filter((todo: Todo) => {
    const statusMatch = filter === 'all' || 
                       (filter === 'active' && !todo.completed) || 
                       (filter === 'completed' && todo.completed);
    
    const priorityMatch = priorityFilter === 'all' || todo.priority === priorityFilter;
    
    return statusMatch && priorityMatch;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✅ Todo Manager</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="What needs to be done? 🎯"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                    }
                    required
                    className="text-lg"
                  />
                </div>
                
                <Textarea
                  placeholder="Add a description (optional) 📝"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTodoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
                
                <div className="space-y-4">
                  <Select
                    value={formData.priority || 'medium'}
                    onValueChange={(value: Priority) =>
                      setFormData((prev: CreateTodoInput) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="date"
                    value={formData.due_date ? new Date(formData.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTodoInput) => ({
                        ...prev,
                        due_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? 'Adding Task...' : '➕ Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6 shadow-md border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All ({todos.length})
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                >
                  Active ({todos.filter((t: Todo) => !t.completed).length})
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Completed ({todos.filter((t: Todo) => t.completed).length})
                </Button>
              </div>
              
              <Select value={priorityFilter} onValueChange={(value: Priority | 'all') => setPriorityFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">🔴 High Priority</SelectItem>
                  <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                  <SelectItem value="low">🟢 Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Todo List */}
        {filteredTodos.length === 0 ? (
          <Card className="shadow-md border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-gray-500 text-lg">
                {todos.length === 0 
                  ? "No tasks yet. Create your first task above!" 
                  : "No tasks match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTodos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`shadow-md border-0 transition-all duration-200 hover:shadow-lg ${
                  todo.completed 
                    ? 'bg-green-50/80 backdrop-blur-sm' 
                    : 'bg-white/80 backdrop-blur-sm'
                } ${isOverdue(todo.due_date) && !todo.completed ? 'ring-2 ring-red-200' : ''}`}
              >
                <CardContent className="pt-6">
                  {editingId === todo.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <Input
                        value={editFormData.title || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditFormData((prev: Partial<Todo>) => ({ ...prev, title: e.target.value }))
                        }
                        className="text-lg font-semibold"
                      />
                      
                      <Textarea
                        value={editFormData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setEditFormData((prev: Partial<Todo>) => ({ 
                            ...prev, 
                            description: e.target.value || null 
                          }))
                        }
                        placeholder="Description (optional)"
                        rows={3}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          value={editFormData.priority || 'medium'}
                          onValueChange={(value: Priority) =>
                            setEditFormData((prev: Partial<Todo>) => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">🟢 Low Priority</SelectItem>
                            <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                            <SelectItem value="high">🔴 High Priority</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="date"
                          value={editFormData.due_date ? new Date(editFormData.due_date).toISOString().split('T')[0] : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setEditFormData((prev: Partial<Todo>) => ({
                              ...prev,
                              due_date: e.target.value ? new Date(e.target.value) : null
                            }))
                          }
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSaveEdit(todo.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div>
                      <div className="flex items-start gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleComplete(todo)}
                          className="mt-1 p-0 h-6 w-6"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-lg font-semibold ${
                            todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                          }`}>
                            {todo.title}
                          </h3>
                          
                          {todo.description && (
                            <p className={`mt-1 ${
                              todo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                            }`}>
                              {todo.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <Badge className={`${getPriorityColor(todo.priority)} border`}>
                              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} Priority
                            </Badge>
                            
                            {todo.due_date && (
                              <div className={`flex items-center gap-1 text-sm ${
                                isOverdue(todo.due_date) && !todo.completed 
                                  ? 'text-red-600 font-medium' 
                                  : 'text-gray-500'
                              }`}>
                                <CalendarDays className="h-4 w-4" />
                                <span>Due: {formatDate(todo.due_date)}</span>
                                {isOverdue(todo.due_date) && !todo.completed && (
                                  <span className="ml-1 text-red-600 font-bold">⚠️ OVERDUE</span>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-400">
                              Created: {formatDate(todo.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(todo)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(todo.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Stats Footer */}
        {todos.length > 0 && (
          <Card className="mt-8 shadow-md border-0 bg-white/60 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{todos.length}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {todos.filter((t: Todo) => t.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {todos.filter((t: Todo) => !t.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {todos.filter((t: Todo) => isOverdue(t.due_date) && !t.completed).length}
                  </div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
