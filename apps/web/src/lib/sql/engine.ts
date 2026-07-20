import { match } from "ts-pattern";

export interface SelectItem {
  type: "star" | "column" | "aggregate";
  column: string;
  alias?: string;
  func?: "COUNT" | "SUM" | "AVG" | "MAX" | "MIN";
}

export interface OrderByItem {
  column: string;
  desc: boolean;
}

export interface WhereCondition {
  column: string;
  operator: "=" | "!=" | ">" | ">=" | "<" | "<=";
  value: string | number;
}

export interface WhereNode {
  type: "AND" | "OR";
  conditions: (WhereCondition | WhereNode)[];
}

export interface SqlAST {
  select: SelectItem[];
  where?: WhereNode;
  groupBy?: string[];
  orderBy?: OrderByItem[];
  limit?: number;
}

function parseSelect(selectStr: string): SelectItem[] {
  if (selectStr.trim() === "*") {
    return [{ type: "star", column: "*" }];
  }

  const items: SelectItem[] = [];
  // Split by comma, but be careful (in a real parser we'd handle commas inside functions, but here it's simple)
  const parts = selectStr.split(",").map((p) => p.trim());

  for (const part of parts) {
    // Match aggregate: SUM(col) AS alias
    // Use [\s\S]+ for alias to support Japanese/Unicode characters like 最高レート
    const aggMatch = part.match(
      /^(COUNT|SUM|AVG|MAX|MIN)\s*\(\s*([a-zA-Z0-9_*]+)\s*\)(?:\s+(?:AS\s+)?([^\s]+))?$/i,
    );
    if (aggMatch) {
      items.push({
        type: "aggregate",
        func: aggMatch[1].toUpperCase() as any,
        column: aggMatch[2],
        alias: aggMatch[3],
      });
      continue;
    }

    // Match column: col AS alias
    const colMatch = part.match(/^([a-zA-Z0-9_.]+)(?:\s+(?:AS\s+)?([^\s]+))?$/i);
    if (colMatch) {
      items.push({
        type: "column",
        column: colMatch[1],
        alias: colMatch[2],
      });
      continue;
    }

    // Fallback
    items.push({ type: "column", column: part });
  }
  return items;
}

function parseWhereValue(valStr: string): string | number {
  valStr = valStr.trim();
  if (/^['"](.*)['"]$/.test(valStr)) {
    return valStr.slice(1, -1);
  }
  const num = Number(valStr);
  if (!Number.isNaN(num)) return num;
  return valStr; // unquoted string as fallback
}

function parseWhereCondition(condStr: string): WhereCondition | null {
  const match = condStr.match(/^([a-zA-Z0-9_.]+)\s*(=|!=|>|>=|<|<=)\s*(.+)$/);
  if (!match) return null;
  return {
    column: match[1],
    operator: match[2] as any,
    value: parseWhereValue(match[3]),
  };
}

function parseWhere(whereStr: string): WhereNode | undefined {
  // A very simple AND/OR parser without parenthesis support for now
  if (!whereStr.trim()) return undefined;

  // Split by OR first (lower precedence)
  const orParts = whereStr.split(/\s+OR\s+/i);
  if (orParts.length > 1) {
    const conditions = orParts.map((p) => parseWhere(p)!).filter(Boolean);
    return { type: "OR", conditions };
  }

  // Split by AND
  const andParts = whereStr.split(/\s+AND\s+/i);
  if (andParts.length > 1) {
    const conditions = andParts
      .map((p) => parseWhereCondition(p.trim()))
      .filter(Boolean) as WhereCondition[];
    return { type: "AND", conditions };
  }

  const cond = parseWhereCondition(whereStr.trim());
  return cond ? { type: "AND", conditions: [cond] } : undefined;
}

export function parseSql(query: string): SqlAST {
  // Strip newlines and extra spaces
  const q = query.replace(/\s+/g, " ").trim();

  // Regex to extract clauses
  // SELECT ... FROM table_name [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...]
  const regex =
    /SELECT\s+(.+?)\s+FROM\s+([a-zA-Z0-9_]+|\?)(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i;
  const match = q.match(regex);

  if (!match) {
    throw new Error(
      "Invalid SQL syntax. Must be: SELECT ... FROM table [WHERE ...] [GROUP BY ...] [ORDER BY ...] [LIMIT ...]",
    );
  }

  const [, selectStr, , whereStr, groupByStr, orderByStr, limitStr] = match;

  const ast: SqlAST = {
    select: parseSelect(selectStr),
  };

  if (whereStr) {
    ast.where = parseWhere(whereStr);
  }

  if (groupByStr) {
    ast.groupBy = groupByStr.split(",").map((s) => s.trim());
  }

  if (orderByStr) {
    ast.orderBy = orderByStr.split(",").map((s) => {
      const m = s.trim().match(/^([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?$/i);
      if (!m) throw new Error("Invalid ORDER BY syntax");
      return { column: m[1].trim(), desc: m[2] ? m[2].toUpperCase() === "DESC" : false };
    });
  }

  if (limitStr) {
    ast.limit = parseInt(limitStr, 10);
  }

  return ast;
}

function evaluateCondition(record: any, cond: WhereCondition): boolean {
  const recordVal = record[cond.column];
  if (recordVal === undefined) return false;

  return match(cond.operator)
    .with("=", () => recordVal == cond.value)
    .with("!=", () => recordVal != cond.value)
    .with(">", () => recordVal > cond.value)
    .with(">=", () => recordVal >= cond.value)
    .with("<", () => recordVal < cond.value)
    .with("<=", () => recordVal <= cond.value)
    .otherwise(() => false);
}

function evaluateWhereNode(record: any, node?: WhereNode): boolean {
  if (!node) return true;
  if (node.type === "AND") {
    return node.conditions.every((c) => {
      if ("type" in c) return evaluateWhereNode(record, c);
      return evaluateCondition(record, c);
    });
  }
  if (node.type === "OR") {
    return node.conditions.some((c) => {
      if ("type" in c) return evaluateWhereNode(record, c);
      return evaluateCondition(record, c);
    });
  }
  return true;
}

export function executeSql(
  query: string,
  records: readonly Record<string, unknown>[],
): Record<string, unknown>[] {
  const ast = parseSql(query);

  // 1. Filter
  let filtered = records.filter((r) => evaluateWhereNode(r, ast.where));

  // 1.5 Sort before projection if NOT aggregating/grouping, so we can sort by unselected columns
  const isAggregating = ast.select.some((s) => s.type === "aggregate");
  const hasGroupBy = ast.groupBy && ast.groupBy.length > 0;

  if (!isAggregating && !hasGroupBy && ast.orderBy && ast.orderBy.length > 0) {
    const ob = ast.orderBy;
    filtered = [...filtered].sort((a, b) => {
      for (const order of ob) {
        const valA = a[order.column] as any;
        const valB = b[order.column] as any;
        if (valA < valB) return order.desc ? 1 : -1;
        if (valA > valB) return order.desc ? -1 : 1;
      }
      return 0;
    });
  }

  let results: Record<string, unknown>[] = [];

  // 2. Group By & Aggregate (or simple projection if no Group By)
  if (hasGroupBy) {
    // Grouping
    const groups = new Map<string, any[]>();
    for (const row of filtered) {
      const key = ast.groupBy!.map((col) => String(row[col])).join("|||");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(row);
    }

    for (const [key, groupRows] of groups.entries()) {
      const outRow: Record<string, unknown> = {};

      // Populate grouping columns first to ensure they are available
      const keyParts = key.split("|||");
      ast.groupBy!.forEach((col, idx) => {
        outRow[col] = keyParts[idx]; // Note: types become string here, a more robust engine would preserve types
      });

      // Project & Aggregate
      for (const sel of ast.select) {
        const outKey = sel.alias || sel.column;
        if (sel.type === "column") {
          outRow[outKey] = groupRows[0][sel.column];
        } else if (sel.type === "aggregate") {
          let val = 0;
          if (sel.func === "COUNT") {
            val = groupRows.length;
          } else if (sel.func === "SUM") {
            val = groupRows.reduce((acc, r) => acc + (Number(r[sel.column]) || 0), 0);
          } else if (sel.func === "AVG") {
            val =
              groupRows.length === 0
                ? 0
                : groupRows.reduce((acc, r) => acc + (Number(r[sel.column]) || 0), 0) /
                  groupRows.length;
          } else if (sel.func === "MAX") {
            val = Math.max(...groupRows.map((r) => Number(r[sel.column]) || -Infinity));
          } else if (sel.func === "MIN") {
            val = Math.min(...groupRows.map((r) => Number(r[sel.column]) || Infinity));
          }
          outRow[outKey] = val;
        }
      }
      results.push(outRow);
    }
  } else if (isAggregating) {
    // Global aggregation (single row)
    const outRow: Record<string, unknown> = {};
    for (const sel of ast.select) {
      const outKey = sel.alias || sel.column;
      if (sel.type === "aggregate") {
        let val = 0;
        if (sel.func === "COUNT") {
          val = filtered.length;
        } else if (sel.func === "SUM") {
          val = filtered.reduce((acc, r) => acc + (Number(r[sel.column]) || 0), 0);
        } else if (sel.func === "AVG") {
          val =
            filtered.length === 0
              ? 0
              : filtered.reduce((acc, r) => acc + (Number(r[sel.column]) || 0), 0) /
                filtered.length;
        } else if (sel.func === "MAX") {
          val = Math.max(...filtered.map((r) => Number(r[sel.column]) || -Infinity));
        } else if (sel.func === "MIN") {
          val = Math.min(...filtered.map((r) => Number(r[sel.column]) || Infinity));
        }
        outRow[outKey] = val;
      } else if (sel.type === "column") {
        outRow[outKey] = filtered.length > 0 ? filtered[0][sel.column] : null;
      }
    }
    results = [outRow];
  } else {
    // Normal Projection
    for (const row of filtered) {
      const outRow: Record<string, unknown> = {};
      for (const sel of ast.select) {
        if (sel.type === "star") {
          Object.assign(outRow, row);
        } else if (sel.type === "column") {
          outRow[sel.alias || sel.column] = row[sel.column];
        }
      }
      results.push(outRow);
    }
  }

  // 3. Sort (if aggregated/grouped, because we didn't sort beforehand)
  if ((isAggregating || hasGroupBy) && ast.orderBy && ast.orderBy.length > 0) {
    const ob = ast.orderBy;
    results.sort((a, b) => {
      for (const order of ob) {
        const valA = a[order.column] as any;
        const valB = b[order.column] as any;
        if (valA < valB) return order.desc ? 1 : -1;
        if (valA > valB) return order.desc ? -1 : 1;
      }
      return 0;
    });
  }

  // 4. Limit
  if (ast.limit !== undefined) {
    results = results.slice(0, ast.limit);
  }

  return results;
}

/**
 * Extracts a TypeScript type string representing the rows from a parsed SQL query.
 * For Monaco Editor intelligence.
 */
export function generateRowTypeFromSql(sql: string): string {
  try {
    const ast = parseSql(sql);
    if (!ast.select || ast.select.length === 0) return "Array<Partial<BattleRecord>>";

    // If there is a '*' we can just return Partial<BattleRecord>
    if (ast.select.some((s) => s.type === "star")) {
      return "Array<Partial<BattleRecord>>";
    }

    // Generate strict interface fields based on selected columns/aggregates
    const props = ast.select.map((s) => {
      const name = s.alias || s.column;
      let type = "any";
      if (s.type === "aggregate") {
        type = "number";
      } else if (s.type === "column") {
        // Strict typing: if the column exists in BattleRecord, use it; otherwise 'any'
        type = `ExtractRowValue<"${s.column}">`;
      }

      const safeName = /^[a-zA-Z0-9_]+$/.test(name) ? name : `"${name}"`;
      return `${safeName}: ${type};`;
    });

    return `Array<{ ${props.join(" ")} }>`;
  } catch {
    // If parse fails (e.g. typing in progress), fallback to base
    return "Array<Partial<BattleRecord>>";
  }
}
