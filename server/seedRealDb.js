import { productionDb } from "./src/storage/productionDb.js";
import { EXPANDED_ENTERPRISE_ROLES } from "./src/templates/expandedRoles.js";

console.log("Seeding real enterprise workforce into SQLite relational database...");

for (const role of EXPANDED_ENTERPRISE_ROLES) {
  productionDb.insertAgent({
    id: role.id,
    name: role.name,
    provider: role.model,
    department: role.category,
    owner: "admin@enterprise.com",
    status: "ACTIVE",
    securityScore: 92,
    spendCeilingUsd: role.spendCeilingUsd,
    requiresHitlAboveUsd: 300.0,
    systemPrompt: `Operate autonomously as ${role.role} under Synapse OPA Rego governance.`
  });
}

console.log("✅ Seeded 9 real department workers into SQLite 'agents' table.");
