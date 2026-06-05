import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const meetingsRoot = join(root, "content", "meetings");
const outputPath = join(root, "data", "manifest.json");

const teamNames = {
  "level-1": "Level 1",
  "level-2": "Level 2",
  "level-3": "Level 3",
  "level-4": "Level 4"
};

const teams = [];
const meetings = [];

for (const teamSlug of await readdir(meetingsRoot)) {
  const teamPath = join(meetingsRoot, teamSlug);
  const files = (await readdir(teamPath)).filter((file) => file.endsWith(".md"));
  const teamName = teamNames[teamSlug] || titleCase(teamSlug);
  teams.push({ slug: teamSlug, name: teamName });

  for (const file of files) {
    const filePath = join(teamPath, file);
    const markdown = await readFile(filePath, "utf8");
    const frontMatter = parseFrontMatter(markdown);
    const date = frontMatter.date || file.replace(/\.md$/, "");
    const title = frontMatter.title || firstHeading(markdown) || `${teamName} Meeting`;

    meetings.push({
      team: teamSlug,
      teamName,
      date,
      title,
      path: relative(root, filePath).split("/").join("/")
    });
  }
}

teams.sort((a, b) => a.slug.localeCompare(b.slug));
meetings.sort((a, b) => a.team.localeCompare(b.team) || b.date.localeCompare(a.date));

await writeFile(outputPath, `${JSON.stringify({ teams, meetings }, null, 2)}\n`);

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  return Object.fromEntries(match[1].split("\n").map((line) => {
    const [key, ...rest] = line.split(":");
    return [key.trim(), rest.join(":").trim().replace(/^["']|["']$/g, "")];
  }).filter(([key]) => key));
}

function firstHeading(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1];
}

function titleCase(slug) {
  return slug.split("-").map((part) => `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");
}
