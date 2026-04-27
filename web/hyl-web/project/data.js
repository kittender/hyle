// data.js — mock data for Hylé Prints SPA

window.PRINTS = [
  {
    id: "hyle-org/starter",
    author: "hyle-org",
    name: "starter",
    stars: 2890, forks: 431,
    pulls: { month: 4200, half: 21000, year: 38000, all: 62000 },
    description: "Official Hylé starter print. Covers all four folders with minimal opinions — recommended as your first print.",
    longDesc: "The official starting point maintained by the Hylé team. Provides a clean, unopinionated scaffold across all four standard folders: ontology, identities, craft, and ethics. Designed to be forked and extended, not used as-is. Fully compatible with every hyle CLI version.",
    language: "Markdown", license: "MIT", updated: "2026-04-18",
    tags: ["official", "starter", "minimal", "recommended"],
    verified: true,
    versions: [
      { tag: "1.0.4", date: "2026-04-18", notes: "Updated for hyle 2.3 compatibility. Revised quickstart docs." },
      { tag: "1.0.3", date: "2026-03-01", notes: "Minor documentation improvements across all folders." },
      { tag: "1.0.0", date: "2025-10-01", notes: "Initial official release." },
    ],
    tree: { ontology: { "README.md": null, "glossary.md": null }, identities: { "README.md": null, "roles.yaml": null }, craft: { "README.md": null, "conventions.md": null }, ethics: { "README.md": null, "policies.yaml": null } },
  },
  {
    id: "andrej-kirskyn/good-java",
    author: "andrej-kirskyn",
    name: "good-java",
    stars: 1234, forks: 89,
    pulls: { month: 980, half: 5100, year: 8700, all: 12300 },
    description: "Comprehensive substrate for best Java dev practices — Spring Boot, clean architecture, enterprise patterns.",
    longDesc: "A production-grade print for Java teams using Spring Boot. Covers domain-driven design principles in the ontology, a structured agent hierarchy for architect/developer/reviewer roles in identities, rich examples of service/repository patterns in craft, and GDPR-aligned ethics policies. Actively maintained.",
    language: "Java", license: "MIT", updated: "2026-04-10",
    tags: ["java", "spring", "enterprise", "backend", "clean-arch"],
    verified: true,
    versions: [
      { tag: "1.3.0", date: "2026-04-10", notes: "Added Spring Security identity patterns. New GDPR ethics module." },
      { tag: "1.2.1", date: "2026-02-15", notes: "Fixed identity hierarchy delegation chain for nested agents." },
      { tag: "1.1.0", date: "2025-12-01", notes: "Added ethics policy templates and scope management examples." },
      { tag: "1.0.0", date: "2025-10-20", notes: "Initial release with core craft patterns and Java conventions." },
    ],
    tree: {
      ontology: { "README.md": null, specs: { "api-design.md": null, "domain-model.md": null }, "domain-glossary.md": null },
      identities: { "README.md": null, "roles.yaml": null, "hierarchy.yaml": null, agents: { "architect.md": null, "developer.md": null, "reviewer.md": null } },
      craft: { "README.md": null, "conventions.md": null, "git-workflow.md": null, examples: { "UserService.java": null, "UserRepository.java": null, "DomainEvent.java": null } },
      ethics: { "README.md": null, "policies.yaml": null, "gdpr.md": null, "constraints.yaml": null },
    },
  },
  {
    id: "justbob/python-sub",
    author: "justbob",
    name: "python-sub",
    stars: 897, forks: 64,
    pulls: { month: 760, half: 3800, year: 6200, all: 9100 },
    description: "Boilerplate for advanced Python projects — no framework assumptions, focuses on clean domain logic and async patterns.",
    longDesc: "A framework-agnostic Python substrate emphasising clean architecture without the overhead. The craft folder contains async service patterns, repository abstractions, and domain event examples. Ethics constraints focus on data handling and PII management in Python codebases.",
    language: "Python", license: "Apache-2.0", updated: "2026-03-28",
    tags: ["python", "async", "domain-driven", "backend"],
    community: true,
    versions: [
      { tag: "2.1.0", date: "2026-03-28", notes: "Async patterns overhaul. Added FastAPI-compatible examples." },
      { tag: "2.0.0", date: "2026-01-10", notes: "Major rewrite: domain-driven structure throughout." },
      { tag: "1.0.2", date: "2025-11-05", notes: "Minor fixes and docs clarifications." },
    ],
    tree: { ontology: { "README.md": null, "specs": { "api-design.md": null }, "domain-glossary.md": null }, identities: { "README.md": null, "roles.yaml": null, agents: { "data-engineer.md": null, "backend-dev.md": null } }, craft: { "README.md": null, "conventions.md": null, examples: { "service.py": null, "repository.py": null, "events.py": null } }, ethics: { "README.md": null, "policies.yaml": null, "constraints.yaml": null } },
  },
  {
    id: "renaud-duteil/swisstools",
    author: "renaud-duteil",
    name: "swisstools",
    stars: 789, forks: 102,
    pulls: { month: 1100, half: 5600, year: 9400, all: 15200 },
    description: "Language agnostic base for starting any dev project. Minimal assumptions, maximal flexibility.",
    longDesc: "The go-to substrate when you want structure without language lock-in. Swisstools defines a lean ontology, a two-role identity system (owner/contributor), and a checklist-driven craft folder that works regardless of language. Used as a base by many other published prints.",
    language: "YAML", license: "MIT", updated: "2026-04-01",
    tags: ["agnostic", "base", "minimal", "starter"],
    community: true,
    versions: [
      { tag: "3.0.0", date: "2026-04-01", notes: "Restructured for hyle init compatibility. New checklist format." },
      { tag: "2.5.0", date: "2025-12-10", notes: "Added CI/CD checklist and expanded identity templates." },
      { tag: "2.0.0", date: "2025-09-01", notes: "Second generation with ethics module." },
    ],
    tree: { ontology: { "README.md": null, "glossary.md": null }, identities: { "README.md": null, "roles.yaml": null }, craft: { "README.md": null, "conventions.md": null, "checklist.md": null }, ethics: { "README.md": null, "policies.yaml": null } },
  },
  {
    id: "imalianny/best-front-sub",
    author: "imalianny",
    name: "best-front-sub",
    stars: 723, forks: 58,
    pulls: { month: 540, half: 2700, year: 4500, all: 6800 },
    description: "A clean and refined substrate for frontend development — React, TypeScript, and design system guidance.",
    longDesc: "Frontend-specialised print with a focus on component-driven development. The ontology includes a design token spec and component inventory. Craft examples cover React hooks, accessible component patterns, and type-safe API integration. Ethics module includes accessibility constraints.",
    language: "TypeScript", license: "MIT", updated: "2026-04-05",
    tags: ["frontend", "react", "typescript", "design-system", "a11y"],
    versions: [
      { tag: "1.5.0", date: "2026-04-05", notes: "Added design token ontology and accessibility ethics rules." },
      { tag: "1.4.0", date: "2026-02-20", notes: "React 19 patterns. New component examples." },
      { tag: "1.0.0", date: "2025-11-15", notes: "Initial release." },
    ],
    tree: { ontology: { "README.md": null, specs: { "component-spec.md": null }, "design-tokens.md": null }, identities: { "README.md": null, "roles.yaml": null, agents: { "designer.md": null, "frontend-dev.md": null } }, craft: { "README.md": null, "conventions.md": null, examples: { "Button.tsx": null, "useData.ts": null, "Layout.tsx": null } }, ethics: { "README.md": null, "policies.yaml": null, "accessibility.md": null } },
  },
  {
    id: "dataworks/ml-substrate",
    author: "dataworks",
    name: "ml-substrate",
    stars: 445, forks: 37,
    description: "Machine learning substrate with experiment tracking, data versioning ethics, and MLOps identity roles.",
    longDesc: "Purpose-built for ML teams. The ontology covers data schemas and experiment logging conventions. Identities define data scientist and MLOps engineer roles with appropriate scope boundaries. Ethics module includes bias audit templates and GDPR data handling rules for model training data.",
    language: "Python", license: "BSD-3", updated: "2026-03-15",
    tags: ["ml", "python", "mlops", "data-science", "ai"],
    versions: [
      { tag: "0.9.0", date: "2026-03-15", notes: "Beta: added bias audit ethics module." },
      { tag: "0.8.0", date: "2026-01-20", notes: "MLflow integration patterns in craft." },
    ],
    tree: { ontology: { "README.md": null, specs: { "data-schema.md": null }, "experiment-log.md": null }, identities: { "README.md": null, "roles.yaml": null, agents: { "data-scientist.md": null, "mlops-engineer.md": null } }, craft: { "README.md": null, "conventions.md": null, examples: { "train.py": null, "evaluate.py": null } }, ethics: { "README.md": null, "policies.yaml": null, "bias-audit.md": null, "gdpr.md": null } },
  },
  {
    id: "webcraft/nextjs-print",
    author: "webcraft",
    name: "nextjs-print",
    stars: 612, forks: 71,
    description: "Full-stack Next.js print with App Router, Prisma, and authentication patterns.",
    longDesc: "A full-stack substrate for Next.js teams. Covers route architecture in the ontology, a fullstack developer identity, and Prisma + NextAuth examples in craft. Updated for Next.js 15 App Router conventions.",
    language: "TypeScript", license: "MIT", updated: "2026-04-12",
    tags: ["nextjs", "fullstack", "typescript", "prisma", "auth"],
    versions: [
      { tag: "2.0.0", date: "2026-04-12", notes: "Next.js 15 App Router patterns, Prisma 6." },
      { tag: "1.2.0", date: "2025-12-05", notes: "Added auth patterns with NextAuth v5." },
      { tag: "1.0.0", date: "2025-10-10", notes: "Initial release." },
    ],
    tree: { ontology: { "README.md": null, specs: { "routes.md": null, "db-schema.md": null } }, identities: { "README.md": null, "roles.yaml": null, agents: { "fullstack-dev.md": null } }, craft: { "README.md": null, "conventions.md": null, examples: { "page.tsx": null, "api-route.ts": null, "schema.prisma": null } }, ethics: { "README.md": null, "policies.yaml": null, "privacy.md": null } },
  },
  {
    id: "devops-collective/k8s-print",
    author: "devops-collective",
    name: "k8s-print",
    stars: 334, forks: 29,
    description: "Kubernetes deployment substrate with GitOps workflows, security policies, and SRE identity roles.",
    longDesc: "Infrastructure substrate for platform and SRE teams. Ontology covers cluster specifications and runbook conventions. Identities define SRE and platform engineer roles. Craft includes Kubernetes manifest examples and Helm chart conventions. Ethics module enforces security baseline policies.",
    language: "YAML", license: "Apache-2.0", updated: "2026-03-20",
    tags: ["kubernetes", "devops", "gitops", "sre", "infrastructure"],
    versions: [
      { tag: "1.1.0", date: "2026-03-20", notes: "Added OPA policy examples in ethics module." },
      { tag: "1.0.0", date: "2025-11-30", notes: "Initial release." },
    ],
    tree: { ontology: { "README.md": null, specs: { "cluster-spec.md": null }, "runbook.md": null }, identities: { "README.md": null, "roles.yaml": null, agents: { "sre.md": null, "platform-engineer.md": null } }, craft: { "README.md": null, "conventions.md": null, examples: { "deployment.yaml": null, "service.yaml": null, "hpa.yaml": null } }, ethics: { "README.md": null, "policies.yaml": null, "security-baseline.md": null } },
  },
  {
    id: "samanthax/kickstart-fantasy-book",
    author: "samanthax",
    name: "kickstart-fantasy-book",
    stars: 38, forks: 4,
    pulls: { month: 210, half: 890, year: 1340, all: 1340 },
    description: "Everything you need to start writing your own fantasy book with LLM help — world-building, characters, plot arcs, lore consistency.",
    longDesc: "A substrate tailored for writers who want AI assistance in crafting fantasy novels. Covers ontology for world-building and lore, character identity templates, craft prompts for plot and chapter drafting, and ethics guidelines for originality and attribution.",
    language: "Markdown", license: "CC BY 4.0", updated: "2026-03-14",
    tags: ["writing", "fantasy", "creative", "llm", "book"],
    tree: { ontology: { "README.md": null, "lore.md": null, "world.md": null }, identities: { "README.md": null, "characters.yaml": null }, craft: { "README.md": null, "plot-arc.md": null }, ethics: { "README.md": null } },
  },
  {
    id: "amine-barra/aws-dva-c02-practice",
    author: "amine-barra",
    name: "aws-dva-c02-practice",
    stars: 459, forks: 61,
    pulls: { month: 1820, half: 7400, year: 11200, all: 14800 },
    description: "Turns any model into a coach for practicing your AWS DVA-C02 certification — mock exams, explanations, and spaced repetition.",
    longDesc: "A fully structured substrate that transforms an LLM into a rigorous AWS DVA-C02 exam coach. Includes domain ontology aligned to the official exam guide, coaching identity with assessment and feedback roles, craft prompts for scenario generation and spaced repetition, and ethics guidelines for accurate technical content.",
    language: "Markdown", license: "MIT", updated: "2026-04-02",
    tags: ["aws", "certification", "dva-c02", "study", "coaching"],
    community: true,
    tree: { ontology: { "README.md": null, "exam-domains.md": null, "services.md": null }, identities: { "README.md": null, "coach.yaml": null }, craft: { "README.md": null, "quiz-gen.md": null, "spaced-rep.md": null }, ethics: { "README.md": null } },
  },
  {
    id: "sterixxx/dnd-gm",
    author: "sterixxx",
    name: "dnd-gm",
    stars: 5, forks: 1,
    pulls: { month: 44, half: 180, year: 250, all: 250 },
    description: "Prepare your Dungeons & Dragons game sessions with custom scenarios generated and refined with AI — NPCs, maps, encounters, lore.",
    longDesc: "A substrate for Dungeon Masters who want AI-powered session prep. Ontology covers D&D rules, setting lore, and adventure hooks. Identities define GM, NPC, and world-builder roles. Craft provides scenario, encounter, and dialogue generation templates. Ethics covers content safety guidelines.",
    language: "Asciidoc", license: "GPL-3.0", updated: "2026-01-28",
    tags: ["dnd", "rpg", "creative", "gm", "tabletop"],
    tree: { ontology: { "README.md": null, "rules.adoc": null, "lore.adoc": null }, identities: { "README.md": null, "roles.yaml": null }, craft: { "README.md": null, "scenarios.adoc": null }, ethics: { "README.md": null } },
  },
];

window.TEAM_PICKS = ["samanthax/kickstart-fantasy-book", "amine-barra/aws-dva-c02-practice", "sterixxx/dnd-gm"];

window.MOCK_FILES = {
  "identities/roles.yaml": `roles:\n  - id: architect\n    display_name: "Software Architect"\n    authority: senior\n    can_delegate:\n      - developer\n      - reviewer\n    scopes:\n      - ontology\n      - identities\n      - craft\n      - ethics\n\n  - id: developer\n    display_name: "Java Developer"\n    authority: standard\n    can_delegate:\n      - reviewer\n    scopes:\n      - craft\n      - ontology\n\n  - id: reviewer\n    display_name: "Code Reviewer"\n    authority: standard\n    can_delegate: []\n    scopes:\n      - craft`,

  "identities/roles_v1.yaml": `roles:\n  - id: architect\n    display_name: "Architect"\n    authority: senior\n    can_delegate: [developer]\n    scopes: [ontology, craft]\n\n  - id: developer\n    display_name: "Developer"\n    authority: standard\n    can_delegate: []\n    scopes: [craft]`,

  "craft/examples/UserService.java": `package com.example.domain.user;\n\nimport org.springframework.stereotype.Service;\nimport org.springframework.transaction.annotation.Transactional;\nimport java.util.Optional;\n\n/**\n * Domain service for User aggregate.\n * See craft/conventions.md#service-layer\n */\n@Service\n@Transactional(readOnly = true)\npublic class UserService {\n\n    private final UserRepository repo;\n    private final ApplicationEventPublisher events;\n\n    public UserService(\n            UserRepository repo,\n            ApplicationEventPublisher events) {\n        this.repo = repo;\n        this.events = events;\n    }\n\n    @Transactional\n    public User createUser(CreateUserCommand cmd) {\n        if (repo.existsByEmail(cmd.email())) {\n            throw new UserAlreadyExistsException(cmd.email());\n        }\n        User user = User.create(cmd.email(), cmd.displayName());\n        User saved = repo.save(user);\n        events.publishEvent(new UserCreatedEvent(saved.getId()));\n        return saved;\n    }\n\n    public Optional<User> findById(UserId id) {\n        return repo.findById(id);\n    }\n}`,

  "ethics/policies.yaml": `version: "1.0"\npolicies:\n  - id: no-pii-in-logs\n    severity: critical\n    description: >\n      Agents must never emit PII (emails, names, IDs)\n      to log output, debug statements, or exceptions.\n    applies_to: [developer, reviewer]\n\n  - id: no-raw-sql\n    severity: warning\n    description: >\n      Raw SQL strings are forbidden.\n      Use JPA named queries or QueryDSL.\n    applies_to: [developer]\n\n  - id: gdpr-right-to-erasure\n    severity: critical\n    description: >\n      Every User aggregate must implement purge()\n      to anonymise all personal data fields.\n    applies_to: [architect, developer]`,

  "craft/conventions.md": `# Craft Conventions\n\n## Naming\n\n| Element    | Convention   | Example          |\n|------------|--------------|------------------|\n| Classes    | PascalCase   | \`UserService\`   |\n| Methods    | camelCase    | \`findByEmail()\` |\n| Constants  | UPPER_SNAKE  | \`MAX_RETRIES\`   |\n| Packages   | lowercase    | \`com.example\`   |\n\n## Layer Structure\n\n\`\`\`\nsrc/main/java/com/example/\n├── domain/          # Entities, value objects\n├── application/     # Use cases, commands\n├── infrastructure/  # Repos, adapters\n└── api/             # Controllers, DTOs\n\`\`\`\n\n## Git Workflow\n\n- Branch: \`feat/<ticket>-description\`\n- Commits: Conventional Commits format\n- PRs: squash merge into \`main\`\n- Tags: semver (\`1.2.3\`)`,

  "ontology/domain-glossary.md": `# Domain Glossary\n\n## Aggregate\nA cluster of domain objects treated as a single unit for data changes. Always has a root entity.\n\n## Command\nAn intent to change the system state. Named in imperative form: \`CreateUser\`, \`DeleteOrder\`.\n\n## Domain Event\nA record that something significant occurred. Named in past tense: \`UserCreated\`, \`OrderShipped\`.\n\n## Repository\nAn abstraction over the persistence layer. One repository per aggregate root.\n\n## Value Object\nAn immutable domain concept identified by its attributes, not its identity. E.g., \`Email\`, \`Money\`.`,

  "identities/agents/architect.md": `# Software Architect\n\n## Role\nThe architect agent is responsible for high-level design decisions, architectural reviews, and maintaining the identity topology. It has access to all four folders.\n\n## Responsibilities\n- Define and evolve the domain model (ontology)\n- Review and update identity hierarchy\n- Approve changes to ethics constraints\n- Guide craft conventions for the team\n\n## Constraints\n- Must not write implementation code directly\n- Architecture decisions must be documented in \`ontology/docs/\`\n- All topology changes require \`hyle topology check\` before commit`,

  "ethics/gdpr.md": `# GDPR Compliance Guidelines\n\n## Personal Data Categories\n\nThe following field types are classified as PII and governed by ethics/policies.yaml:\n\n- \`email\`, \`username\`, \`display_name\`\n- \`ip_address\`, \`user_agent\`\n- Any field with suffix \`_id\` linked to a User aggregate\n\n## Right to Erasure Implementation\n\nEvery aggregate root with PII must implement a \`purge()\` method:\n\n\`\`\`java\npublic void purge() {\n    this.email = "deleted@gdpr.invalid";\n    this.displayName = "Deleted User";\n    this.purgedAt = Instant.now();\n}\n\`\`\`\n\n## Retention\n\nAudit logs: 12 months maximum. Session data: 30 days.`,
};

window.DIFF_EXAMPLE = {
  file: "identities/roles.yaml",
  v1: "1.0.0",
  v2: "1.3.0",
  left: window.MOCK_FILES["identities/roles_v1.yaml"],
  right: window.MOCK_FILES["identities/roles.yaml"],
};

window.getLang = (filename) => {
  const ext = filename.split('.').pop();
  const map = { java: 'java', py: 'python', ts: 'typescript', tsx: 'typescript', yaml: 'yaml', yml: 'yaml', md: 'markdown', prisma: 'css', json: 'json', toml: 'toml' };
  return map[ext] || 'plain';
};

window.getFileContent = (path) => {
  if (window.MOCK_FILES[path]) return window.MOCK_FILES[path];
  const filename = path.split('/').pop();
  const ext = filename.split('.').pop();
  if (ext === 'md') return `# ${filename.replace('.md', '')}\n\nDocumentation for this file is available in the published print.\n\nPull this print locally to explore:\n\n\`\`\`\nhyle substrate pull ${path.split('/')[0]}\n\`\`\``;
  if (ext === 'yaml' || ext === 'yml') return `# ${filename}\n# Pull print to view full content\ncontent: see_local_copy`;
  if (ext === 'java') return `// ${filename}\n// Pull print to view full source\npackage com.example;`;
  if (ext === 'py') return `# ${filename}\n# Pull print to view full source`;
  return `# ${filename}\n# Content available after pull`;
};
