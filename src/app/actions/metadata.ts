'use client';

import type { AppMetadata, InfoPlist } from '@/types/global';

import { parse } from '@plist/parse';
import { strFromU8, unzipSync } from 'fflate';

const appRegex = /\.app\/Info\.plist$/;

export async function getMetadata(formData: FormData) {
	const file = formData.get('ipa');
	if (!(file instanceof File)) {
		throw new Error('No IPA file provided');
	}

	const buffer = await file.arrayBuffer();
	const uint8Array = new Uint8Array(buffer);
	const files = unzipSync(uint8Array);
	const plistFileNames = Object.keys(files).filter((fileName) =>
		appRegex.test(fileName)
	);
	if (plistFileNames.length === 0) {
		throw new Error('Info.plist not found');
	}
	const fileData = files[plistFileNames[0]];
	const xml = strFromU8(fileData);
	const data = parse(xml) as InfoPlist;

	const name = data.CFBundleDisplayName ?? data.CFBundleName ?? '';
	const version =
		data.CFBundleShortVersionString ?? data.CFBundleVersion ?? '';
	const bundleId = data.CFBundleIdentifier ?? '';

	const response = await fetch(
		`/api/metadata?appName=${encodeURIComponent(name)}`
	);
	if (!response.ok) {
		throw new Error('Failed to fetch App Store metadata');
	}
	const storeMetadata = (await response.json()) as {
		icon?: string;
		rating?: number;
		description?: string;
		developer?: string;
	};

	const metadata: AppMetadata = {
		icon: storeMetadata.icon ?? '',
		name,
		version,
		bundleId,
		rating: storeMetadata.rating ?? 0,
		description: storeMetadata.description,
		developer: storeMetadata.developer ?? '',
	};

	return metadata;
}
