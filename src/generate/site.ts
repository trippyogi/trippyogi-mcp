import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProfile } from "../content/load.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const outDir = join(root, "site");

function write(name: string, body: string): void {
  writeFileSync(join(outDir, name), body.endsWith("\n") ? body : `${body}\n`, "utf8");
}

function main(): void {
  const profile = loadProfile();
  mkdirSync(outDir, { recursive: true });

  const llms = [
    `# ${profile.person.name}`,
    "",
    `> ${profile.person.headline}`,
    "",
    profile.person.summary,
    "",
    `Site: ${profile.person.url}`,
    `Email: ${profile.person.email}`,
    `MCP: ${profile.person.url.replace(/\/$/, "")}/mcp`,
    "",
    "## Projects",
    ...profile.projects.flatMap((project) => [
      "",
      `### ${project.name}`,
      project.summary,
      `Outcome: ${project.outcome}`,
      project.liveUrl ? `Live: ${project.liveUrl}` : null,
      project.sourceUrl ? `Source: ${project.sourceUrl}` : null,
      ...project.receiptUrls.map((url) => `Receipt: ${url}`)
    ].filter(Boolean) as string[]),
    "",
    "## Experience",
    ...profile.experience.flatMap((role) => [
      "",
      `### ${role.role} — ${role.org}`,
      `${role.start} – ${role.end ?? "present"}`,
      role.summary,
      ...role.highlights.map((item) => `- ${item}`)
    ]),
    "",
    "## Availability",
    profile.availability.seeking,
    `Best fit: ${profile.availability.bestFit.join(", ")}`,
    "",
    "## Agent surfaces",
    "- /llms.txt",
    "- /resume.md",
    "- /projects.md",
    "- /mcp (Streamable HTTP MCP)",
    ""
  ].join("\n");

  const resume = [
    `# ${profile.person.name}`,
    "",
    `${profile.person.jobTitle} · ${profile.person.location}`,
    "",
    profile.person.summary,
    "",
    "## Experience",
    ...profile.experience.flatMap((role) => [
      "",
      `### ${role.role} — ${role.org}`,
      `${role.start} – ${role.end ?? "present"}`,
      "",
      role.summary,
      "",
      ...role.highlights.map((item) => `- ${item}`)
    ]),
    "",
    "## Contact",
    `- Email: ${profile.availability.contact.email}`,
    `- Site: ${profile.availability.contact.site}`,
    `- LinkedIn: ${profile.availability.contact.linkedin}`,
    `- GitHub: ${profile.availability.contact.github}`,
    ""
  ].join("\n");

  const projects = [
    `# Projects`,
    "",
    ...profile.projects.flatMap((project) => [
      `## ${project.name}`,
      "",
      `- Status: ${project.status}`,
      `- Years: ${project.years}`,
      `- Summary: ${project.summary}`,
      `- Outcome: ${project.outcome}`,
      project.liveUrl ? `- Live: ${project.liveUrl}` : null,
      project.sourceUrl ? `- Source: ${project.sourceUrl}` : null,
      project.packageUrl ? `- Package: ${project.packageUrl}` : null,
      ...project.receiptUrls.map((url) => `- Receipt: ${url}`),
      ""
    ].filter(Boolean) as string[])
  ].join("\n");

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.person.name,
    url: profile.person.url,
    email: profile.person.email,
    jobTitle: profile.person.jobTitle,
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Diego",
      addressRegion: "CA",
      addressCountry: "US"
    },
    sameAs: profile.person.sameAs,
    knowsAbout: profile.person.knowsAbout
  };

  write("llms.txt", llms);
  write("resume.md", resume);
  write("projects.md", projects);
  write("person.jsonld", JSON.stringify(personJsonLd, null, 2));
  console.log(`Wrote generated surfaces to ${outDir}`);
}

main();
