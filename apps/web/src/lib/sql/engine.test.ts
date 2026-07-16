import { expect, test, describe } from "vitest";
import { executeSql } from "./engine";

const MOCK_RECORDS = [
  { id: 1, opponent: "Pikachu", result: "win", rating: 1500 },
  { id: 2, opponent: "Charizard", result: "loss", rating: 1480 },
  { id: 3, opponent: "Pikachu", result: "win", rating: 1520 },
  { id: 4, opponent: "Bulbasaur", result: "draw", rating: 1520 },
  { id: 5, opponent: "Charizard", result: "win", rating: 1540 },
];

describe("Custom SQL Engine", () => {
  test("SELECT * FROM ?", () => {
    const res = executeSql("SELECT * FROM ?", MOCK_RECORDS);
    expect(res).toHaveLength(5);
    expect(res[0]).toEqual(MOCK_RECORDS[0]);
  });

  test("SELECT column FROM ?", () => {
    const res = executeSql("SELECT opponent, result FROM ?", MOCK_RECORDS);
    expect(res).toHaveLength(5);
    expect(res[0]).toEqual({ opponent: "Pikachu", result: "win" });
  });

  test("SELECT column AS alias", () => {
    const res = executeSql("SELECT opponent AS opp, result FROM ?", MOCK_RECORDS);
    expect(res[0]).toEqual({ opp: "Pikachu", result: "win" });
  });

  test("WHERE condition (simple)", () => {
    const res = executeSql("SELECT * FROM ? WHERE result = 'win'", MOCK_RECORDS);
    expect(res).toHaveLength(3);
    expect(res.every((r) => r.result === "win")).toBe(true);
  });

  test("WHERE condition (numeric >)", () => {
    const res = executeSql("SELECT * FROM ? WHERE rating > 1500", MOCK_RECORDS);
    expect(res).toHaveLength(3);
  });

  test("WHERE condition (AND)", () => {
    const res = executeSql(
      "SELECT * FROM ? WHERE opponent = 'Pikachu' AND result = 'win'",
      MOCK_RECORDS,
    );
    expect(res).toHaveLength(2);
  });

  test("WHERE condition (OR)", () => {
    const res = executeSql(
      "SELECT * FROM ? WHERE opponent = 'Pikachu' OR opponent = 'Bulbasaur'",
      MOCK_RECORDS,
    );
    expect(res).toHaveLength(3);
  });

  test("ORDER BY ASC", () => {
    const res = executeSql("SELECT * FROM ? ORDER BY rating ASC", MOCK_RECORDS);
    expect(res[0].rating).toBe(1480);
    expect(res[4].rating).toBe(1540);
  });

  test("ORDER BY DESC", () => {
    const res = executeSql("SELECT * FROM ? ORDER BY rating DESC", MOCK_RECORDS);
    expect(res[0].rating).toBe(1540);
    expect(res[4].rating).toBe(1480);
  });

  test("LIMIT", () => {
    const res = executeSql("SELECT * FROM ? LIMIT 2", MOCK_RECORDS);
    expect(res).toHaveLength(2);
  });

  test("GROUP BY and COUNT", () => {
    const res = executeSql("SELECT result, COUNT(*) AS count FROM ? GROUP BY result", MOCK_RECORDS);
    // win: 3, loss: 1, draw: 1
    expect(res).toHaveLength(3);
    const winRow = res.find((r) => r.result === "win");
    expect(winRow?.count).toBe(3);
  });

  test("GROUP BY and SUM", () => {
    const res = executeSql(
      "SELECT opponent, SUM(rating) AS total FROM ? GROUP BY opponent",
      MOCK_RECORDS,
    );
    const pikaRow = res.find((r) => r.opponent === "Pikachu");
    expect(pikaRow?.total).toBe(1500 + 1520); // 3020
  });

  test("Global aggregate (no GROUP BY)", () => {
    const res = executeSql(
      "SELECT COUNT(*) AS total, SUM(rating) AS sum_rating FROM ?",
      MOCK_RECORDS,
    );
    expect(res).toHaveLength(1);
    expect(res[0].total).toBe(5);
    expect(res[0].sum_rating).toBe(1500 + 1480 + 1520 + 1520 + 1540);
  });

  test("Complex query", () => {
    const query =
      "SELECT opponent, COUNT(*) AS wins FROM ? WHERE result = 'win' GROUP BY opponent ORDER BY wins DESC LIMIT 1";
    const res = executeSql(query, MOCK_RECORDS);
    expect(res).toHaveLength(1);
    expect(res[0].opponent).toBe("Pikachu");
    expect(res[0].wins).toBe(2);
  });
});
