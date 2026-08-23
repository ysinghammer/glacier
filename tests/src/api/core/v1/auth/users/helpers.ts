import type { APIResponse } from '@playwright/test';

type JsonObject = Record<string, unknown>;

export interface UserDocument {
  data: {
    attributes: JsonObject;
    id: string;
  };
}

export interface UserCollectionDocument {
  data: UserDocument['data'][];
  meta: JsonObject;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function userData(value: unknown): UserDocument['data'] {
  if (!isJsonObject(value) || typeof value.id !== 'string' || !isJsonObject(value.attributes)) {
    throw new Error('Expected a user document response.');
  }

  return { id: value.id, attributes: value.attributes };
}

export async function userDocument(response: APIResponse): Promise<UserDocument> {
  const body: unknown = await response.json();

  if (!isJsonObject(body)) {
    throw new Error('Expected a JSON object response.');
  }

  return { data: userData(body.data) };
}

export async function userCollectionDocument(
  response: APIResponse
): Promise<UserCollectionDocument> {
  const body: unknown = await response.json();

  if (!isJsonObject(body) || !Array.isArray(body.data) || !isJsonObject(body.meta)) {
    throw new Error('Expected a user collection response.');
  }

  return { data: body.data.map(userData), meta: body.meta };
}
