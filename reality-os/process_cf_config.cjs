const fs = require('fs');

const config = JSON.parse(fs.readFileSync('cf_current_config.json', 'utf8'));

// Define the new behavior for Gemini
const geminiBehavior = {
    "PathPattern": "/gemini/*",
    "TargetOriginId": "Lambda-Proxy",
    "TrustedSigners": { "Enabled": false, "Quantity": 0 },
    "TrustedKeyGroups": { "Enabled": false, "Quantity": 0 },
    "ViewerProtocolPolicy": "https-only",
    "AllowedMethods": {
        "Quantity": 7,
        "Items": ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
        "CachedMethods": {
            "Quantity": 2,
            "Items": ["HEAD", "GET"]
        }
    },
    "SmoothStreaming": false,
    "Compress": true,
    "LambdaFunctionAssociations": { "Quantity": 0 },
    "FunctionAssociations": { "Quantity": 0 },
    "FieldLevelEncryptionId": "",
    "GrpcConfig": { "Enabled": false },
    "ForwardedValues": {
        "QueryString": false, // Gemini might not strictly need query strings if we pass everything in body, but harmless
        "Cookies": { "Forward": "none" },
        "Headers": { "Quantity": 0 },
        "QueryStringCacheKeys": { "Quantity": 0 }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0
};

// Add to CacheBehaviors
if (!config.DistributionConfig.CacheBehaviors) {
    config.DistributionConfig.CacheBehaviors = { Quantity: 0, Items: [] };
}

// Check if it already exists (unlikely given our analysis, but good practice)
const exists = config.DistributionConfig.CacheBehaviors.Items.find(b => b.PathPattern === '/gemini/*');
if (!exists) {
    config.DistributionConfig.CacheBehaviors.Items.push(geminiBehavior);
    config.DistributionConfig.CacheBehaviors.Quantity += 1;
    console.log("Added /gemini/* behavior");
} else {
    // update it just in case
    Object.assign(exists, geminiBehavior);
    console.log("Updated /gemini/* behavior");
}

fs.writeFileSync('cf_updated_config.json', JSON.stringify(config.DistributionConfig, null, 2));
console.log("Written cf_updated_config.json");
console.log("ETag:", config.ETag);
fs.writeFileSync('cf_etag.txt', config.ETag);
