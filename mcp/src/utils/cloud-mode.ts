import { debug } from './logger.js';

/**
 * Check if MCP is running in cloud mode
 * Cloud mode is enabled by:
 * 1. Command line argument --cloud-mode
 * 2. Environment variable CLOUDBASE_MCP_CLOUD_MODE=true
 * 3. Environment variable MCP_CLOUD_MODE=true
 */
export function isCloudMode(): boolean {
  const cloudModeEnabled = process.env.CLOUDBASE_MCP_CLOUD_MODE === 'true' || 
                          process.env.MCP_CLOUD_MODE === 'true';
  
  if (cloudModeEnabled) {
    debug('Cloud mode is enabled');
  }
  
  return cloudModeEnabled;
}

/**
 * Enable cloud mode by setting environment variable
 */
export function enableCloudMode(): void {
  process.env.CLOUDBASE_MCP_CLOUD_MODE = 'true';
  debug('Cloud mode enabled via API call');
}

/**
 * Get cloud mode status for logging/debugging
 */
export function getCloudModeStatus(): { 
  enabled: boolean; 
  source: string | null;
} {
  if (process.env.CLOUDBASE_MCP_CLOUD_MODE === 'true') {
    return { enabled: true, source: 'CLOUDBASE_MCP_CLOUD_MODE' };
  }
  if (process.env.MCP_CLOUD_MODE === 'true') {
    return { enabled: true, source: 'MCP_CLOUD_MODE' };
  }
  return { enabled: false, source: null };
}
