interface Message {
	role: "user" | "assistant";
	content: string;
}

interface ContentBlock {
	type: string;
	text?: string;
}

interface LLMResponse {
	content: ContentBlock[];
	stop_reason?: string;
}

export interface LLMOptions {
	model?: string;
	maxTokens?: number;
	systemPrompt?: string;
}

export async function callLLM(
	prompt: string,
	opts?: LLMOptions,
): Promise<string> {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		console.error(
			"✗ ANTHROPIC_API_KEY not set. Set it before running LLM commands.",
		);
		console.error("  export ANTHROPIC_API_KEY=sk-...");
		process.exit(1);
	}

	const model = opts?.model || "claude-haiku-4-5-20251001";
	const maxTokens = opts?.maxTokens || 4096;
	const systemPrompt = opts?.systemPrompt || "";

	const messages: Message[] = [{ role: "user", content: prompt }];

	const body: Record<string, unknown> = {
		model,
		max_tokens: maxTokens,
		messages,
	};

	if (systemPrompt) {
		body.system = [
			{
				type: "text",
				text: systemPrompt,
				cache_control: { type: "ephemeral" },
			},
		];
	}

	try {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"content-type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Anthropic API error: ${response.status} ${error}`);
		}

		const data = (await response.json()) as LLMResponse;
		const textBlock = data.content.find((b) => b.type === "text");
		if (!textBlock?.text) {
			throw new Error("No text in response");
		}

		return textBlock.text;
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		console.error(`✗ LLM call failed: ${message}`);
		process.exit(1);
	}
}
