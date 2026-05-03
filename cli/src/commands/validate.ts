import { loadManifest, validateManifest } from "../manifest";

export interface ValidateResult {
	valid: boolean;
	errors: Array<{ field: string; message: string }>;
	warnings: Array<{ field: string; message: string }>;
}

export async function runValidate(file: string, json = false): Promise<void> {
	try {
		const manifest = await loadManifest(file);
		const result = validateManifest(manifest);

		const output: ValidateResult = {
			valid: result.errors.length === 0,
			errors: result.errors,
			warnings: result.warnings,
		};

		if (json) {
			console.log(JSON.stringify(output, null, 2));
		} else {
			if (output.valid) {
				console.log(`✓ ${file} is valid`);
			} else {
				console.error(`✗ ${file} has validation errors:`);
				for (const e of output.errors) {
					console.error(`  ${e.field}: ${e.message}`);
				}
				process.exit(1);
			}

			if (output.warnings.length > 0) {
				console.warn(`⚠ ${output.warnings.length} warning(s):`);
				for (const w of output.warnings) {
					console.warn(`  ${w.field}: ${w.message}`);
				}
			}
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		const output: ValidateResult = {
			valid: false,
			errors: [{ field: "parse", message: msg }],
			warnings: [],
		};

		if (json) {
			console.log(JSON.stringify(output, null, 2));
			process.exit(1);
		} else {
			console.error(`✗ Failed to validate ${file}:`);
			console.error(`  ${msg}`);
			process.exit(1);
		}
	}
}
