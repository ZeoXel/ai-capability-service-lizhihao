import type { CapabilityHandler } from '../types/index.js';
import { NotFoundError } from '../errors/index.js';

const registry = new Map<string, CapabilityHandler>();

export function registerCapability(handler: CapabilityHandler): void {
  registry.set(handler.name, handler);
}

export function getCapability(name: string): CapabilityHandler {
  const cap = registry.get(name);
  if (!cap) throw new NotFoundError(`Unknown capability: ${name}`);
  return cap;
}

export function listCapabilities(): string[] {
  return Array.from(registry.keys());
}
