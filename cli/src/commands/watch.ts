import { createHash } from "node:crypto";
import {
	appendFileSync,
	existsSync,
	openSync,
	readFileSync,
	readSync,
	readdirSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface WatchOptions {
	audit?: boolean;
	split?: string;
	offline?: boolean;
}

interface TurnStats {
	seq: number;
	timestamp: string;
	model: string;
	inputTokens: number;
	outputTokens: number;
	cacheReadTokens: number;
	cacheWriteTokens: number;
	requestId: string;
	gitBranch?: string;
	lineNum: number;
}

interface AuditLogRecord {
	type: string;
	message?: {
		usage?: {
			input_tokens?: number;
			output_tokens?: number;
			cache_read_input_tokens?: number;
			cache_creation_input_tokens?: number;
		};
	};
	timestamp?: number;
	model?: string;
	requestId?: string;
	gitBranch?: string;
}

interface SessionInfo {
	sessionId: string;
	jsonlPath: string;
	gitBranch?: string;
}

interface AuditState {
	lastHash: string;
	lastSeq: number;
}

const CONTEXT_WINDOW_SIZES: Record<string, number> = {
	"claude-opus-4-7": 200_000,
	"claude-sonnet-4-6": 200_000,
	"claude-haiku-4-5": 200_000,
};

export async function runWatch(opts: WatchOptions): Promise<void> {
	const cwd = process.cwd();

	try {
		const session = findSession(cwd);
		if (!session) {
			console.error("✗ No active Claude Code session found in this directory");
			process.exit(1);
		}

		const turns: TurnStats[] = [];
		let auditState: AuditState | null = null;
		let splitTriggered = false;
		let lastProcessedLineCount = 0;

		// Hide cursor on start
		process.stdout.write("\x1b[?25l");

		// Setup signal handler for clean exit
		process.on("SIGINT", () => {
			process.stdout.write("\x1b[?25h"); // Show cursor
			console.log("\nWatch stopped.");
			process.exit(0);
		});

		// Initialize audit log if needed
		if (opts.audit) {
			const auditPath = join(cwd, "hyle-audit.log");
			if (existsSync(auditPath)) {
				auditState = readLastAuditHash(auditPath);
			} else {
				auditState = { lastHash: "0".repeat(64), lastSeq: 0 };
			}
		}

		// Read baseline
		const baseline = readBaseline(session.jsonlPath);
		turns.push(...baseline.turns);
		lastProcessedLineCount = baseline.lineCount;

		// Poll for new turns
		const pollInterval = setInterval(() => {
			const newTurns = pollJSONLByLineCount(
				session.jsonlPath,
				lastProcessedLineCount,
			);
			if (newTurns.length > 0) {
				lastProcessedLineCount = newTurns[newTurns.length - 1].lineNum;
				turns.push(...newTurns);

				// Write audit entries if enabled
				if (opts.audit && auditState) {
					for (const turn of newTurns) {
						auditState = appendAuditEntry(cwd, turn, auditState);
					}
				}

				// Check split threshold if enabled
				if (opts.split && !splitTriggered) {
					const threshold = parseThreshold(opts.split);
					if (shouldSplit(turns, threshold, session)) {
						splitTriggered = true;
						const catchupPath = writeCatchupFile(cwd, session, turns);
						showSplitWarning(catchupPath);
					}
				}
			}

			renderUI(turns, session);
		}, 1000);

		// Initial render
		renderUI(turns, session);
	} catch (e) {
		process.stdout.write("\x1b[?25h"); // Show cursor on error
		console.error(`✗ ${(e as Error).message}`);
		process.exit(1);
	}
}

function findSession(cwd: string): SessionInfo | null {
	const sessionsDir = join(homedir(), ".claude", "sessions");
	if (!existsSync(sessionsDir)) return null;

	const cwdNormalized = cwd.normalize("NFC");

	try {
		const files = readdirSync(sessionsDir);
		for (const file of files) {
			if (!file.endsWith(".json")) continue;
			const sessionPath = join(sessionsDir, file);
			try {
				const content = JSON.parse(readFileSync(sessionPath, "utf8"));
				const contentCwdNormalized = (content.cwd as string).normalize("NFC");
				if (contentCwdNormalized === cwdNormalized && content.sessionId) {
					// Find the matching JSONL by scanning projects/ for the session ID
					const projectsBase = join(homedir(), ".claude", "projects");
					if (!existsSync(projectsBase)) return null;

					const projectDirs = readdirSync(projectsBase);
					for (const projectDir of projectDirs) {
						const jsonlPath = join(
							projectsBase,
							projectDir,
							`${content.sessionId}.jsonl`,
						);
						if (existsSync(jsonlPath)) {
							return {
								sessionId: content.sessionId.slice(0, 12),
								jsonlPath,
								gitBranch: content.gitBranch,
							};
						}
					}
				}
			} catch {
				// Skip invalid session files
			}
		}
	} catch {
		return null;
	}

	return null;
}

function readBaseline(jsonlPath: string): {
	turns: TurnStats[];
	lineCount: number;
} {
	const turns: TurnStats[] = [];
	const seenRequestIds = new Set<string>();

	try {
		const content = readFileSync(jsonlPath, "utf8");
		const lines = content.split("\n");

		let seq = 0;
		let lineNum = 0;
		for (const line of lines) {
			lineNum++;
			if (!line.trim()) continue;
			try {
				const record = JSON.parse(line);
				if (
					record.type === "assistant" &&
					record.message?.usage &&
					record.requestId
				) {
					// Only count each unique requestId once (skip duplicates)
					if (!seenRequestIds.has(record.requestId)) {
						seenRequestIds.add(record.requestId);
						seq++;
						const turn = extractTurnStats(record, seq);
						turn.lineNum = lineNum;
						turns.push(turn);
					}
				}
			} catch {
				// Skip malformed lines
			}
		}

		return { turns, lineCount: lines.length };
	} catch {
		return { turns: [], lineCount: 0 };
	}
}

function pollJSONLByLineCount(
	jsonlPath: string,
	lastProcessedLineCount: number,
): TurnStats[] {
	const turns: TurnStats[] = [];

	try {
		const content = readFileSync(jsonlPath, "utf8");
		const lines = content.split("\n");

		// Get the current total line count
		const totalLineCount = lines.length;
		if (totalLineCount <= lastProcessedLineCount) {
			return turns;
		}

		// Get seq count and seen request IDs from baseline
		let baselineSeq = 0;
		const seenRequestIds = new Set<string>();
		for (let i = 0; i < lastProcessedLineCount && i < lines.length; i++) {
			const line = lines[i];
			if (!line.trim()) continue;
			try {
				const record = JSON.parse(line);
				if (
					record.type === "assistant" &&
					record.message?.usage &&
					record.requestId
				) {
					if (!seenRequestIds.has(record.requestId)) {
						seenRequestIds.add(record.requestId);
						baselineSeq++;
					}
				}
			} catch {
				// Skip malformed lines
			}
		}

		let seq = baselineSeq;
		let lineNum = lastProcessedLineCount;

		// Process only new lines
		for (let i = lastProcessedLineCount; i < lines.length; i++) {
			const line = lines[i];
			lineNum++;

			if (!line.trim()) continue;
			try {
				const record = JSON.parse(line);
				if (
					record.type === "assistant" &&
					record.message?.usage &&
					record.requestId
				) {
					// Only count each unique requestId once
					if (!seenRequestIds.has(record.requestId)) {
						seenRequestIds.add(record.requestId);
						seq++;
						const turn = extractTurnStats(record, seq);
						turn.lineNum = lineNum;
						turns.push(turn);
					}
				}
			} catch {
				// Skip malformed lines
			}
		}

		return turns;
	} catch {
		return turns;
	}
}

function extractTurnStats(record: AuditLogRecord, seq: number): TurnStats {
	const usage = record.message?.usage || {};
	const timestamp = new Date(
		record.timestamp || Date.now(),
	).toLocaleTimeString();

	return {
		seq,
		timestamp,
		model: (record.model || "unknown").replace(/^claude-/, "").slice(0, 12),
		inputTokens: usage.input_tokens || 0,
		outputTokens: usage.output_tokens || 0,
		cacheReadTokens: usage.cache_read_input_tokens || 0,
		cacheWriteTokens: usage.cache_creation_input_tokens || 0,
		requestId: record.requestId ? record.requestId.slice(-8) : "?",
		gitBranch: record.gitBranch,
		lineNum: 0,
	};
}

function renderUI(turns: TurnStats[], session: SessionInfo): void {
	// Clear screen
	process.stdout.write("\x1b[2J\x1b[H");

	const totalInput = turns.reduce((s, t) => s + t.inputTokens, 0);
	const totalOutput = turns.reduce((s, t) => s + t.outputTokens, 0);
	const totalCacheRead = turns.reduce((s, t) => s + t.cacheReadTokens, 0);
	const totalCacheWrite = turns.reduce((s, t) => s + t.cacheWriteTokens, 0);

	const contextUsed = totalInput + totalCacheRead;
	const model = turns[turns.length - 1]?.model || "?";
	const contextWindow = CONTEXT_WINDOW_SIZES[`claude-${model}`] || 200_000;
	const contextPercent = Math.min(
		100,
		Math.round((contextUsed / contextWindow) * 100),
	);

	// Header
	console.log(
		`hyle watch — session: ${session.sessionId}  model: claude-${model}  ${session.gitBranch ? `branch: ${session.gitBranch}` : ""}`,
	);

	// Progress bar
	const barWidth = 30;
	const filled = Math.round((contextPercent / 100) * barWidth);
	const empty = Math.max(0, barWidth - filled);
	const bar = "█".repeat(filled) + "░".repeat(empty);

	let color = "\x1b[32m"; // Green
	if (contextPercent >= 80)
		color = "\x1b[31m"; // Red
	else if (contextPercent >= 60) color = "\x1b[33m"; // Yellow

	console.log(
		`Context: ${color}${bar}\x1b[0m  ${contextPercent}%  (${contextUsed.toLocaleString()} / ${contextWindow.toLocaleString()} tokens)`,
	);

	// Table
	console.log("\n TURN   TIME      INPUT      OUTPUT   CACHE_R   CACHE_W");
	console.log("─".repeat(60));

	for (const turn of turns.slice(-20)) {
		const input = turn.inputTokens.toLocaleString().padStart(8);
		const output = turn.outputTokens.toLocaleString().padStart(8);
		const cacheR = turn.cacheReadTokens.toLocaleString().padStart(8);
		const cacheW = turn.cacheWriteTokens.toLocaleString().padStart(8);
		console.log(
			` #${String(turn.seq).padStart(2)}   ${turn.timestamp}   ${input}   ${output}   ${cacheR}   ${cacheW}`,
		);
	}

	// Totals
	console.log("─".repeat(60));
	const tInput = totalInput.toLocaleString().padStart(8);
	const tOutput = totalOutput.toLocaleString().padStart(8);
	const tCacheR = totalCacheRead.toLocaleString().padStart(8);
	const tCacheW = totalCacheWrite.toLocaleString().padStart(8);
	console.log(
		` TOTAL                ${tInput}   ${tOutput}   ${tCacheR}   ${tCacheW}`,
	);

	console.log("\nWatching for new turns... Ctrl+C to exit");
}

function parseThreshold(threshold: string): {
	type: "percent" | "absolute";
	value: number;
} {
	if (threshold.endsWith("%")) {
		return { type: "percent", value: Number.parseInt(threshold) };
	}
	return { type: "absolute", value: Number.parseInt(threshold) };
}

function shouldSplit(
	turns: TurnStats[],
	threshold: { type: "percent" | "absolute"; value: number },
	session: SessionInfo,
): boolean {
	const totalInput = turns.reduce((s, t) => s + t.inputTokens, 0);
	const totalCacheRead = turns.reduce((s, t) => s + t.cacheReadTokens, 0);
	const contextUsed = totalInput + totalCacheRead;

	if (threshold.type === "percent") {
		const model = turns[turns.length - 1]?.model || "haiku-4-5";
		const contextWindow = CONTEXT_WINDOW_SIZES[`claude-${model}`] || 200_000;
		const percent = (contextUsed / contextWindow) * 100;
		return percent >= threshold.value;
	}

	return contextUsed >= threshold.value;
}

function writeCatchupFile(
	cwd: string,
	session: SessionInfo,
	turns: TurnStats[],
): string {
	const now = new Date().toISOString().slice(0, 19);
	const path = join(cwd, `hyle-catchup-${now}.md`);

	const totalInput = turns.reduce((s, t) => s + t.inputTokens, 0);
	const totalOutput = turns.reduce((s, t) => s + t.outputTokens, 0);
	const totalTokens = totalInput + totalOutput;

	const summary = `# Session Catch-up

**Session:** ${session.sessionId}
**Model:** claude-${turns[turns.length - 1]?.model || "?"}
**Turns:** ${turns.length}
**Tokens used:** ${totalTokens.toLocaleString()}

## Summary

Paste this file as your first message in a new Claude Code session to restore context.

Session started at ${turns[0]?.timestamp || "unknown"}. Last ${Math.min(3, turns.length)} turns covered:
${turns
	.slice(-3)
	.map(
		(t) =>
			`- (Turn ${t.seq}) Input: ${t.inputTokens}, Output: ${t.outputTokens}`,
	)
	.join("\n")}

## Full Turn Log

\`\`\`
${turns.map((t) => `Turn ${t.seq} (${t.timestamp}): ${t.inputTokens} input, ${t.outputTokens} output (${t.model})`).join("\n")}
\`\`\`
`;

	writeFileSync(path, summary);
	return path;
}

function showSplitWarning(catchupPath: string): void {
	const filename = catchupPath.split("/").pop() || "catchup";
	console.log(
		`\n⚠️  Context threshold reached. ${filename} written to working directory.`,
	);
	console.log(
		`OSC link: \x1b]8;;file://${catchupPath}\x1b\\[ open catch-up ]\x1b]8;;\x1b\\\n`,
	);
}

function appendAuditEntry(
	cwd: string,
	turn: TurnStats,
	state: AuditState,
): AuditState {
	const auditPath = join(cwd, "hyle-audit.log");

	const entry = {
		seq: state.lastSeq + 1,
		timestamp: new Date().toISOString(),
		turnSeq: turn.seq,
		model: `claude-${turn.model}`,
		inputTokens: turn.inputTokens,
		outputTokens: turn.outputTokens,
		cacheReadTokens: turn.cacheReadTokens,
		cacheWriteTokens: turn.cacheWriteTokens,
		requestId: turn.requestId,
		prevHash: state.lastHash,
	};

	const hash = createHash("sha256").update(JSON.stringify(entry)).digest("hex");
	const entryWithHash = { ...entry, hash };

	appendFileSync(auditPath, `${JSON.stringify(entryWithHash)}\n`);

	return { lastHash: hash, lastSeq: entry.seq };
}

function readLastAuditHash(auditPath: string): AuditState {
	try {
		const content = readFileSync(auditPath, "utf8");
		const lines = content.split("\n").filter((l) => l.trim());
		if (lines.length > 0) {
			const lastLine = JSON.parse(lines[lines.length - 1]);
			return { lastHash: lastLine.hash, lastSeq: lastLine.seq };
		}
	} catch {
		// Fall back to default
	}

	return { lastHash: "0".repeat(64), lastSeq: 0 };
}
