import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { verifyToken } from '@/lib/auth';

const scriptsDir = path.join(process.cwd(), 'scripts');

interface ScriptInfo {
  name: string;
  file: string;
  description?: string;
}

async function listScripts(): Promise<ScriptInfo[]> {
  const entries = await fs.readdir(scriptsDir, { withFileTypes: true });
  const scripts: ScriptInfo[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.js')) continue;

    const file = entry.name;
    const filePath = path.join(scriptsDir, file);

    let description: string | undefined;
    try {
      const contents = await fs.readFile(filePath, 'utf-8');
      const lines = contents.split(/\r?\n/);
      const commentLine = lines.find((line) => line.trim().startsWith('//'));
      if (commentLine) {
        description = commentLine.replace(/^\/\//, '').trim();
      }
    } catch {
      description = undefined;
    }

    scripts.push({
      name: file.replace(/\.js$/, ''),
      file,
      description,
    });
  }

  scripts.sort((a, b) => a.name.localeCompare(b.name));
  return scripts;
}

function runScript(scriptPath: string, args: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV ?? 'production',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? -1,
      });
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scripts = await listScripts();
    return NextResponse.json({ scripts });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('No token provided') || error.message.includes('Invalid token'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to list scripts', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyToken(request);
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { script, args } = body as { script?: string; args?: string[] };

    if (!script || typeof script !== 'string') {
      return NextResponse.json({ error: 'Script name is required' }, { status: 400 });
    }

    const normalizedScript = script.replace(/\\/g, '/');
    const targetPath = path.join(scriptsDir, normalizedScript);

    if (!targetPath.startsWith(scriptsDir)) {
      return NextResponse.json({ error: 'Invalid script path' }, { status: 400 });
    }

    try {
      const stat = await fs.stat(targetPath);
      if (!stat.isFile() || !targetPath.endsWith('.js')) {
        return NextResponse.json({ error: 'Script not found' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    const argArray = Array.isArray(args) ? args.filter((arg) => typeof arg === 'string') : [];
    const result = await runScript(targetPath, argArray);

    return NextResponse.json({
      success: result.exitCode === 0,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('No token provided') || error.message.includes('Invalid token'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Failed to execute script', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


