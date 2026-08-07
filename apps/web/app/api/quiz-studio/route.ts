import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import matter from "gray-matter";

const execAsync = promisify(exec);

// Repo root is 2 levels up from apps/web
const REPO_ROOT = path.resolve(process.cwd(), "../..");

async function gitExec(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, { cwd: REPO_ROOT, maxBuffer: 10 * 1024 * 1024 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const filePath = searchParams.get("file");

  if (!filePath) {
    return NextResponse.json({ error: "Missing ?file= param" }, { status: 400 });
  }

  // Sanitize – only allow content/quiz/ paths
  if (!filePath.startsWith("apps/web/content/quiz/")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
  }

  const absPath = path.join(REPO_ROOT, filePath);

  // Read current file content from disk
  let fileContent: string | null = null;
  try {
    fileContent = await fs.readFile(absPath, "utf-8");
  } catch {
    fileContent = null;
  }

  // Get unified diff (working tree vs HEAD)
  let patch: string | null = null;
  try {
    const { stdout } = await gitExec(`git diff HEAD -- "${filePath.replace(/\\/g, "/")}"`);
    patch = stdout || null;

    // If no diff (file is clean or new/untracked), try showing it as a new file patch
    if (!patch && fileContent) {
      // Check if file exists in HEAD
      try {
        await gitExec(`git cat-file -e HEAD:"${filePath.replace(/\\/g, "/")}"`);
        // File exists in HEAD and is unchanged
      } catch {
        // File is new/untracked — synthesize an addition patch
        const lines = fileContent.split("\n");
        const hunks = lines.map((l) => `+${l}`).join("\n");
        patch = [
          `diff --git a/${filePath} b/${filePath}`,
          `new file mode 100644`,
          `--- /dev/null`,
          `+++ b/${filePath}`,
          `@@ -0,0 +1,${lines.length} @@`,
          hunks,
        ].join("\n");
      }
    }
  } catch {
    patch = null;
  }

  // Get commit log for this file
  type GitLogEntry = {
    hash: string;
    shortHash: string;
    author: string;
    email: string;
    date: string;
    subject: string;
  };
  let gitLog: GitLogEntry[] = [];
  try {
    const { stdout } = await gitExec(
      `git log --format="%H|%h|%an|%ae|%aI|%s" -10 -- "${filePath.replace(/\\/g, "/")}"`,
    );
    gitLog = stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, shortHash, author, email, date, ...subjectParts] = line.split("|");
        return { hash, shortHash, author, email, date, subject: subjectParts.join("|") };
      });
  } catch {
    gitLog = [];
  }

  return NextResponse.json({
    filePath,
    fileContent,
    patch,
    gitLog,
  });
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const filePath = searchParams.get("file");

  if (!filePath) {
    return NextResponse.json({ error: "Missing ?file= param" }, { status: 400 });
  }

  if (!filePath.startsWith("apps/web/content/quiz/")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (typeof body.content !== "string") {
      return NextResponse.json({ error: "Missing or invalid content" }, { status: 400 });
    }

    const absPath = path.join(REPO_ROOT, filePath);
    await fs.writeFile(absPath, body.content, "utf-8");

    const parsed = matter(body.content);
    const reviewed = parsed.data.reviewed === true;

    return NextResponse.json({ success: true, reviewed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save file" }, { status: 500 });
  }
}
