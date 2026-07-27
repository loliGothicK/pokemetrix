import { dashboards } from "@/lib/db/schema";
import { ulid } from "ulid";

export type InsertDashboard = typeof dashboards.$inferInsert;

export class DashboardFactory<
  THasUserId extends boolean = false,
  THasName extends boolean = false,
> {
  private data: Partial<InsertDashboard> = {
    id: ulid(),
    isDefault: false,
    layout: [],
    variables: [],
  };

  withUserId(userId: string): DashboardFactory<true, THasName> {
    this.data.userId = userId;
    return this as any;
  }

  withName(name: string): DashboardFactory<THasUserId, true> {
    this.data.name = name;
    return this as any;
  }

  withIsDefault(isDefault: boolean): this {
    this.data.isDefault = isDefault;
    return this;
  }

  withLayout(layout: unknown[]): this {
    this.data.layout = layout as any;
    return this;
  }

  withVariables(variables: unknown[]): this {
    this.data.variables = variables as any;
    return this;
  }

  build(this: DashboardFactory<true, true>): InsertDashboard {
    return this.data as InsertDashboard;
  }
}
