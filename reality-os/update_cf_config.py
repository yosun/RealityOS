
import json

with open('cf_config.json', 'r') as f:
    data = json.load(f)

etag = data['ETag']
config = data['DistributionConfig']

# Update DefaultCacheBehavior to forward Origin
default_behavior = config['DefaultCacheBehavior']
default_behavior['ForwardedValues']['Headers'] = {
    "Quantity": 1,
    "Items": ["Origin"]
}

# Also update existing behaviors just in case?
# /proxy-image* targets Lambda, which does redirect. Lambda doesn't need Origin forwarded really as it handles CORS code manually, but good practice.
# But /fal/* and /gemini/* match Lambda and return JSON with handled CORS.
# The critical one is DefaultCacheBehavior which hits S3.

# Write just the config for the update command
with open('updated_config.json', 'w') as f:
    json.dump(config, f)

print(etag)
