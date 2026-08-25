const fs = require("fs");

function escapeCell(value) {
	const str = value === null || value === undefined ? "" : String(value);
	if (/[",\n]/.test(str)) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

function toCsv(rows, columns) {
	const lines = [columns.join(",")];
	for (const row of rows) {
		lines.push(columns.map((col) => escapeCell(row[col])).join(","));
	}
	return lines.join("\n");
}

function writeCsv(filepath, rows, columns) {
	fs.writeFileSync(filepath, toCsv(rows, columns), "utf8");
}

module.exports = { writeCsv };
