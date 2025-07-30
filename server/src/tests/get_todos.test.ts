
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { getTodos } from '../handlers/get_todos';

// Test todo data
const testTodos: CreateTodoInput[] = [
  {
    title: 'First Todo',
    description: 'First todo for testing',
    priority: 'high',
    due_date: new Date('2024-12-31')
  },
  {
    title: 'Second Todo',
    description: null,
    priority: 'low',
    due_date: null
  },
  {
    title: 'Third Todo',
    description: 'Third todo for testing',
    priority: 'medium',
    due_date: new Date('2024-06-15')
  }
];

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Insert test todos
    await db.insert(todosTable)
      .values(testTodos)
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos are returned with correct fields
    const titles = result.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
    expect(titles).toContain('Third Todo');

    // Verify each todo has required fields
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(typeof todo.title).toBe('string');
      expect(typeof todo.completed).toBe('boolean');
      expect(['low', 'medium', 'high']).toContain(todo.priority);
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return todos ordered by created_at descending', async () => {
    // Insert todos with slight delays to ensure different timestamps
    await db.insert(todosTable)
      .values([testTodos[0]])
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values([testTodos[1]])
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values([testTodos[2]])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first (descending)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });

  it('should handle todos with different field values correctly', async () => {
    await db.insert(todosTable)
      .values(testTodos)
      .execute();

    const result = await getTodos();

    // Find specific todos and verify their properties
    const firstTodo = result.find(todo => todo.title === 'First Todo');
    expect(firstTodo).toBeDefined();
    expect(firstTodo!.description).toBe('First todo for testing');
    expect(firstTodo!.priority).toBe('high');
    expect(firstTodo!.due_date).toBeInstanceOf(Date);
    expect(firstTodo!.completed).toBe(false); // Default value

    const secondTodo = result.find(todo => todo.title === 'Second Todo');
    expect(secondTodo).toBeDefined();
    expect(secondTodo!.description).toBeNull();
    expect(secondTodo!.priority).toBe('low');
    expect(secondTodo!.due_date).toBeNull();
    expect(secondTodo!.completed).toBe(false); // Default value
  });
});
