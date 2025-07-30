
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const [insertedTodo] = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false,
        priority: 'medium',
        due_date: null
      })
      .returning()
      .execute();

    // Delete the todo
    const result = await deleteTodo({ id: insertedTodo.id });

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo is deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, insertedTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when todo does not exist', async () => {
    // Try to delete a non-existent todo
    const result = await deleteTodo({ id: 999 });

    // Should return false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const [todo1] = await db.insert(todosTable)
      .values({
        title: 'Todo 1',
        description: 'First todo',
        completed: false,
        priority: 'high',
        due_date: null
      })
      .returning()
      .execute();

    const [todo2] = await db.insert(todosTable)
      .values({
        title: 'Todo 2',
        description: 'Second todo',
        completed: true,
        priority: 'low',
        due_date: null
      })
      .returning()
      .execute();

    // Delete only the first todo
    const result = await deleteTodo({ id: todo1.id });

    // Should return success
    expect(result.success).toBe(true);

    // Verify first todo is deleted
    const deletedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo1.id))
      .execute();

    expect(deletedTodos).toHaveLength(0);

    // Verify second todo still exists
    const remainingTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todo2.id))
      .execute();

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0].title).toEqual('Todo 2');
  });
});
