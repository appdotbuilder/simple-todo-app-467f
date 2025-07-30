
import { z } from 'zod';

// Priority enum
export const priorityEnum = z.enum(['low', 'medium', 'high']);
export type Priority = z.infer<typeof priorityEnum>;

// Todo schema
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  completed: z.boolean(),
  priority: priorityEnum,
  due_date: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  priority: priorityEnum.default('medium'),
  due_date: z.coerce.date().nullable().optional()
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todos
export const updateTodoInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  priority: priorityEnum.optional(),
  due_date: z.coerce.date().nullable().optional()
});

export type UpdateTodoInput = z.infer<typeof updateTodoInputSchema>;

// Input schema for deleting todos
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;

// Input schema for getting a single todo
export const getTodoInputSchema = z.object({
  id: z.number()
});

export type GetTodoInput = z.infer<typeof getTodoInputSchema>;
