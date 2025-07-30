
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing',
  priority: 'high',
  due_date: new Date('2024-12-31')
};

// Test input with minimal fields but including required priority
const minimalInput: CreateTodoInput = {
  title: 'Minimal Todo',
  priority: 'medium'
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with all fields', async () => {
    const result = await createTodo(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.priority).toEqual('high');
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toEqual(new Date('2024-12-31').getTime());
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with minimal fields', async () => {
    const result = await createTodo(minimalInput);

    // Basic field validation with defaults
    expect(result.title).toEqual('Minimal Todo');
    expect(result.description).toBeNull();
    expect(result.priority).toEqual('medium');
    expect(result.due_date).toBeNull();
    expect(result.completed).toEqual(false); // Default from database schema
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(testInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Test Todo');
    expect(todos[0].description).toEqual('A todo for testing');
    expect(todos[0].priority).toEqual('high');
    expect(todos[0].completed).toEqual(false);
    expect(todos[0].due_date).toBeInstanceOf(Date);
    expect(todos[0].created_at).toBeInstanceOf(Date);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description and due_date correctly', async () => {
    const inputWithNulls: CreateTodoInput = {
      title: 'Todo with nulls',
      description: null,
      due_date: null,
      priority: 'low'
    };

    const result = await createTodo(inputWithNulls);

    expect(result.title).toEqual('Todo with nulls');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.priority).toEqual('low');
    expect(result.completed).toEqual(false);

    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].description).toBeNull();
    expect(todos[0].due_date).toBeNull();
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createTodo(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());

    // Initially, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});
