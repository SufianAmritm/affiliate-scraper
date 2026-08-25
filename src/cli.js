const { run } = require("./pipeline/run");

function parseArgs(argv) {
	const args = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg.startsWith("--")) {
			const key = arg.slice(2);
			const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
			args[key] = value;
		} else {
			args._.push(arg);
		}
	}
	return args;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const command = args._[0];

	if (command !== "run") {
		console.log("usage: node src/cli.js run --seed seeds/rankpilot.example.json [--max 25]");
		process.exitCode = 1;
		return;
	}

	if (!args.seed) {
		console.error("missing --seed <path>");
		process.exitCode = 1;
		return;
	}

	try {
		await run({
			seedPath: args.seed,
			maxResultsPerQuery: args.max ? Number(args.max) : 25,
		});
	} catch (err) {
		console.error(err.message);
		process.exitCode = 1;
	}
}

main();
