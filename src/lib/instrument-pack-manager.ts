import type { InstrumentPackManifest } from '../types/instrument-map'
import { getInstrumentSampler } from './instrument-sampler'

export interface ExpansionPackInfo {
  id: string
  name: string
  description?: string
  url: string
}

export async function fetchInstrumentManifest(): Promise<InstrumentPackManifest> {
  return getInstrumentSampler().getManifest()
}

export async function listExpansionPacks(): Promise<ExpansionPackInfo[]> {
  const manifest = await fetchInstrumentManifest()
  return manifest.expansion ?? []
}

/** Download an expansion pack manifest and preload its packs into the sampler. */
export async function loadExpansionPack(
  ctx: AudioContext,
  expansion: ExpansionPackInfo
): Promise<string[]> {
  const res = await fetch(expansion.url)
  if (!res.ok) throw new Error(`Failed to load expansion: ${expansion.name}`)
  const data = (await res.json()) as { packs?: string[]; packBaseUrl?: string }
  const packIds = data.packs ?? []
  await getInstrumentSampler().ensurePacks(ctx, packIds)
  return packIds
}

export async function loadExpansionById(ctx: AudioContext, expansionId: string): Promise<string[]> {
  const expansions = await listExpansionPacks()
  const match = expansions.find((e) => e.id === expansionId)
  if (!match) throw new Error(`Unknown expansion pack: ${expansionId}`)
  return loadExpansionPack(ctx, match)
}
