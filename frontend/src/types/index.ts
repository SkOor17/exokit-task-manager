//  Enums

export type Role = "ADMIN" | "MANAGER" | "OPERATOR";

export type TaskType =
  | "CUTTING"
  | "MACHINING"
  | "ASSEMBLY"
  | "FINISHING"
  | "OILING"
  | "PACKAGING"
  | "QUALITY_CHECK";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "VALIDATED";

export type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "DELIVERED"
  | "CANCELLED";

export type TimeType = "HUMAN" | "MACHINE" | "OILING";

//  Entités

export interface User {
  id: string;
  email: string;
  lastName: string;
  firstName?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productType?: string;
  description?: string;
  status: WorkOrderStatus;
  orderDate: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  specifications?: unknown; // Json
  billOfMaterials?: unknown; // Json
  estimatedCost?: number;
  actualCost?: number;
  sellingPrice?: number;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
  // Calculé côté frontend ou renvoyé par le backend
  progress?: number;
  totalTasks?: number;
  completedTasks?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: number;
  status: TaskStatus;
  dueDate: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHumanTime?: number;
  estimatedMachineTime?: number;
  estimatedOilingTime?: number;
  actualHumanTime: number;
  actualMachineTime: number;
  actualOilingTime: number;
  kitDescription?: string;
  completionNotes?: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  assignedToId?: string;
  assignedTo?: User;
  timers?: Timer[];
  checklists?: Checklist[];
  createdAt: string;
  updatedAt: string;
  // Calculé
  joursRestants?: number;
}

export interface Timer {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number; // secondes
  isPaused: boolean;
  notes?: string;
  timeType: TimeType;
  taskId: string;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[]; // Array of { id, label, checked, required }
  isCompleted: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id?: string | number; 
  label: string;
  checked: boolean;
  required?: boolean;
}

//  Auth

export interface AuthTokens {
  access_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  role?: Role;
}

//  DTOs (payloads envoyés au backend)

export type CreateTaskDto = Pick<Task, "title" | "type" | "workOrderId"> &
  Partial<
    Pick<
      Task,
      | "description"
      | "priority"
      | "status"
      | "dueDate"
      | "estimatedHumanTime"
      | "estimatedMachineTime"
      | "estimatedOilingTime"
      | "kitDescription"
      | "assignedToId"
    >
  >;

export type UpdateTaskDto = Partial<CreateTaskDto> & {
  completionNotes?: string;
  completedAt?: string;
};

export type CreateWorkOrderDto = Pick<
  WorkOrder,
  "customerName" | "orderNumber"
> &
  Partial<Pick<WorkOrder, "description" | "productType" | "expectedDelivery">>;

export type UpdateWorkOrderDto = Partial<
  CreateWorkOrderDto & {
    status: WorkOrderStatus;
    actualDelivery: string;
    billOfMaterials: unknown;
    specifications: unknown;
    estimatedCost: number;
    actualCost: number;
    sellingPrice: number;
  }
>;

//  Filtres & pagination

export interface TaskFilters {
  status?: TaskStatus;
  type?: TaskType;
  assignedToId?: string;
  workOrderId?: string;
  priority?: number;
  search?: string;
}
