
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type GetTodoInput } from '../schema';
import { getTodo } from '../handlers/get_todo';

describe('getTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return todo when it exists', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A test todo description',
        priority: 'high',
        due_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];
    const input: GetTodoInput = { id: createdTodo.id };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Test Todo');
    expect(result!.description).toEqual('A test todo description');
    expect(result!.completed).toEqual(false);
    expect(result!.priority).toEqual('high');
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when todo does not exist', async () => {
    const input: GetTodoInput = { id: 999 };

    const result = await getTodo(input);

    expect(result).toBeNull();
  });

  it('should return todo with nullable fields as null', async () => {
    // Create a todo with minimal fields (nullable fields will be null)
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Minimal Todo'
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];
    const input: GetTodoInput = { id: createdTodo.id };

    const result = await getTodo(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTodo.id);
    expect(result!.title).toEqual('Minimal Todo');
    expect(result!.description).toBeNull();
    expect(result!.due_date).toBeNull();
    expect(result!.completed).toEqual(false); // Default value
    expect(result!.priority).toEqual('medium'); // Default value
  });
});
