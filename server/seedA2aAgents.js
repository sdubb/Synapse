import { productionDb } from "./src/storage/productionDb.js";
import { a2aMeshEngine } from "./src/a2a/googleA2AMesh.js";

console.log("Seeding A2A Agent IDs into SQLite 'agents' table...");

const a2aCards = a2aMeshEngine.getAgentCards();

for (const card of a2aCards) {
  productionDb.insertAgent({
    id: card.id,
    name: card.name,
    provider: "Google A2A v1.0 / agy.exe Core",
    department: card.role,
    owner: "admin@enterprise.com",
    status: "ACTIVE",
    securityScore: 95,
    spendCeilingUsd: card.governance?.spendCeilingUsd || 2500.0,
    requiresHitlAboveUsd: card.governance?.requiresHitlAboveUsd || 500.0,
    systemPrompt: `Autonomous A2A agent operating as ${card.name} with capabilities: ${card.capabilities.join(", ")}.`
  });
}

console.log(`✅ Seeded ${a2aCards.length} A2A agents into relational 'agents' table.`);
