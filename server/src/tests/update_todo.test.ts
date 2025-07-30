
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      due_date: input.due_date || null
    })
    .returning()
    .execute();
  
  return result[0];
};

const testTodoInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing',
  priority: 'medium',
  due_date: new Date('2024-12-31')
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    const todo = await createTestTodo(testTodoInput);
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual(todo.description);
    expect(result.completed).toEqual(todo.completed);
    expect(result.priority).toEqual(todo.priority);
    expect(result.due_date).toEqual(todo.due_date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should update todo completion status', async () => {
    const todo = await createTestTodo(testTodoInput);
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.completed).toBe(true);
    expect(result.title).toEqual(todo.title);
    expect(result.description).toEqual(todo.description);
    expect(result.priority).toEqual(todo.priority);
    expect(result.due_date).toEqual(todo.due_date);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const todo = await createTestTodo(testTodoInput);
    
    const newDueDate = new Date('2025-01-15');
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Multiple Updates',
      description: 'Updated description',
      completed: true,
      priority: 'high',
      due_date: newDueDate
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual('Multiple Updates');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toBe(true);
    expect(result.priority).toEqual('high');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should handle null values for optional fields', async () => {
    const todo = await createTestTodo(testTodoInput);
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      description: null,
      due_date: null
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.title).toEqual(todo.title);
    expect(result.completed).toEqual(todo.completed);
    expect(result.priority).toEqual(todo.priority);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });

  it('should save updated todo to database', async () => {
    const todo = await createTestTodo(testTodoInput);
    
    const updateInput: UpdateTodoInput = {
      id: todo.id,
      title: 'Database Update Test',
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify the update was saved in the database
    const dbTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(dbTodos).toHaveLength(1);
    expect(dbTodos[0].title).toEqual('Database Update Test');
    expect(dbTodos[0].completed).toBe(true);
    expect(dbTodos[0].updated_at).toBeInstanceOf(Date);
    expect(dbTodos[0].updated_at > todo.updated_at).toBe(true);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 99999,
      title: 'Non-existent Todo'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/Todo with id 99999 not found/i);
  });

  it('should update only updated_at when no other fields provided', async () => {
    const todo = await createTestTodo(testTodoInput);
    
    const updateInput: UpdateTodoInput = {
      id: todo.id
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todo.id);
    expect(result.title).toEqual(todo.title);
    expect(result.description).toEqual(todo.description);
    expect(result.completed).toEqual(todo.completed);
    expect(result.priority).toEqual(todo.priority);
    expect(result.due_date).toEqual(todo.due_date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > todo.updated_at).toBe(true);
  });
});
